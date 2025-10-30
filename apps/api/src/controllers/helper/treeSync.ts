import { Op, WhereOptions } from "sequelize";
import { Tree } from "../../models/tree";
import TreeRepository from "../../repo/treeRepo";
import {UserRepository} from "../../repo/userRepo";
import { VisitorImagesRepository } from "../../repo/visitorImagesRepo";
import { VisitRepository } from "../../repo/visitsRepo";
import { VisitorImage } from "../../models/visitor_images";

export type SyncTreeFromVisitorImagesOptions = {
    saplingId: string;
    visitId?: number | null;
    visitorId?: number | null;
    imageType?: "user_tree_image" | "user_card_image";
    imageUrl?: string | null;
    captureTimestamp?: Date | null;
    description?: string | null;
    plantedBy?: string | null;
    assignedTo?: number | null;
};

export type SyncTreeFromVisitorImagesResult = {
    updatedTreeId?: number;
    createdTreeId?: number;
    updatedFields?: Record<string, any>;
    created?: boolean;
    alreadySynced?: boolean;
    message?: string;
};

export async function syncTreeFromVisitorImages(options: SyncTreeFromVisitorImagesOptions): Promise<SyncTreeFromVisitorImagesResult> {
    let {
        saplingId,
        visitId,
        visitorId,
        imageType,
        imageUrl,
        captureTimestamp,
        description,
        plantedBy,
        assignedTo,
    } = options;

    if (!saplingId) {
        return { alreadySynced: true, message: "saplingId missing" };
    }

    const tree = await TreeRepository.getTreeBySaplingId(saplingId);
    const visitorImages = await VisitorImagesRepository.getVisitorImagesBySaplingId(saplingId);
    let visitor = null;
    if (visitorId) visitor = await UserRepository.getUserById(visitorId);
    const resolvedDescription = await resolveDescription(visitId, description);

    if (!visitId || !visitor){
        if (visitorImages && visitorImages.length > 0){
            visitId = visitorImages[0]?.visit_id;
            visitorId = visitorImages[0]?.visitor_id;
            if (visitorId) visitor = await UserRepository.getUserById(visitorId);
        }
    }

    const updates: Record<string, any> = {};

    if (visitId && tree?.visit_id !== visitId) {
        updates.visit_id = visitId;
    }

    if (visitorId && tree?.assigned_to !== visitorId) {
        updates.assigned_to = visitorId;
        updates.assigned_at = captureTimestamp?captureTimestamp: new Date();
        updates.planted_by = visitor?.name;
    }

    // if (captureTimestamp && !isNaN(captureTimestamp.getTime())) {
    //     if (!tree?.assigned_at || tree.assigned_at.getTime() !== captureTimestamp.getTime()) {
    //         updates.assigned_at = captureTimestamp;
    //     }
    // }

    if (resolvedDescription && (!tree?.description || tree.description !== resolvedDescription)) {
        updates.description = resolvedDescription;
    }

    if (plantedBy && tree?.planted_by !== plantedBy) {
        updates.planted_by = plantedBy;
    }

    if (assignedTo && tree?.assigned_to !== assignedTo) {
        updates.assigned_to = assignedTo;
    }

    attachVisitorImagesToUpdate(visitorImages, updates, imageType, imageUrl);

    if (!tree) {
        // Update-only mode: do not create a tree from visitor images
        return { created: false, message: "Tree not found for saplingId; update-only mode, no creation performed" };
    }

    if (Object.keys(updates).length === 0) {
        return { alreadySynced: true, updatedTreeId: tree.id, message: "No updates needed" };
    }

    updates.updated_at = new Date();
    await tree.update(updates);

    return {
        updatedTreeId: tree.id,
        updatedFields: updates,
    };
}

async function resolveDescription(visitId?: number | null, fallbackDescription?: string | null): Promise<string | null | undefined> {
    if (fallbackDescription) {
        return fallbackDescription;
    }

    if (!visitId) {
        return undefined;
    }

    const visit = await VisitRepository.getVisit(visitId);
    return visit?.visit_name ?? undefined;
}

function attachVisitorImagesToUpdate(
    visitorImages: VisitorImage[],
    updates: Record<string, any>,
    imageType?: "user_tree_image" | "user_card_image",
    imageUrl?: string | null,
) {
    const latestImages = getLatestVisitorImages(visitorImages);

    if (imageType && imageUrl) {
        // immediate preference for the image passed in the current sync
        if (imageType === "user_tree_image") {
            updates.user_tree_image = imageUrl;
        } else if (imageType === "user_card_image") {
            updates.user_card_image = imageUrl;
        }
    }

    if (latestImages.user_tree_image && !updates.user_tree_image) {
        updates.user_tree_image = latestImages.user_tree_image.image_url;
    }

    if (latestImages.user_card_image && !updates.user_card_image) {
        updates.user_card_image = latestImages.user_card_image.image_url;
    }
}

type BuildCreationPayloadInput = {
    saplingId: string;
    visitId?: number | null;
    visitorId?: number | null;
    description?: string | null | undefined;
    captureTimestamp?: Date | null;
    plantedBy?: string | null;
    assignedTo?: number | null;
    visitorImages: VisitorImage[];
    preferredImageType?: "user_tree_image" | "user_card_image";
    preferredImageUrl?: string | null;
};

// function buildCreationPayloadFromVisitorImages(input: BuildCreationPayloadInput) {
//     const {
//         saplingId,
//         visitId,
//         visitorId,
//         description,
//         captureTimestamp,
//         plantedBy,
//         assignedTo,
//         visitorImages,
//         preferredImageType,
//         preferredImageUrl,
//     } = input;

//     const latestImages = getLatestVisitorImages(visitorImages);

//     if (!latestImages.user_tree_image && !latestImages.user_card_image && !preferredImageUrl) {
//         return null;
//     }

//     const payload: Partial<Tree> = {
//         sapling_id: saplingId,
//         visit_id: visitId ?? null,
//         assigned_to: assignedTo ?? visitorId ?? null,
//         assigned_at: captureTimestamp ?? new Date(),
//         description: description ?? null,
//         planted_by: plantedBy ?? null,
//         user_tree_image: latestImages.user_tree_image?.image_url ?? null,
//         user_card_image: latestImages.user_card_image?.image_url ?? null,
//         created_at: new Date(),
//         updated_at: new Date(),
//     };

//     if (preferredImageType === "user_tree_image" && preferredImageUrl) {
//         payload.user_tree_image = preferredImageUrl;
//     }

//     if (preferredImageType === "user_card_image" && preferredImageUrl) {
//         payload.user_card_image = preferredImageUrl;
//     }

//     return payload as any;
// }

function getLatestVisitorImages(visitorImages: VisitorImage[]) {
    const latest: {
        user_tree_image?: VisitorImage;
        user_card_image?: VisitorImage;
    } = {};

    for (const image of visitorImages) {
        if (image.type === "user_tree_image") {
            if (!latest.user_tree_image || latest.user_tree_image.created_at < image.created_at) {
                latest.user_tree_image = image;
            }
        } else if (image.type === "user_card_image") {
            if (!latest.user_card_image || latest.user_card_image.created_at < image.created_at) {
                latest.user_card_image = image;
            }
        }
    }

    return latest;
}