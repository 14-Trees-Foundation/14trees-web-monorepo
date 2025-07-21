import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { UserRepository } from "../../repo/userRepo";
import { UserRelationRepository } from "../../repo/userRelationsRepo";
import { GiftCardRequestAttributes, GiftCardRequestStatus } from "../../models/gift_card_request";
import { GiftCard } from "../../models/gift_card";
import { Op } from "sequelize";
import { createSlide, updateSlide } from "../../controllers/helper/slides";
import { downloadSlide } from "../../services/google";
import * as archiver from 'archiver';
import axios from 'axios';
import GiftRequestHelper from "../../helpers/giftRequests";
import GiftCardsService from "../giftCardsService";

export class GiftCardTemplatesService {
    /**
     * Create gift cards for users
     */
    static async createGiftCards(giftCardRequestId: number, users: any[]) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', value: giftCardRequestId, operatorValue: 'equals' }
        ]);
        const giftCardRequest: GiftCardRequestAttributes = resp.results[0];

        const usersData: { giftedTo: number, assignedTo: number, imageName?: string, count: number }[] = [];
        let count = 0;

        for (const user of users) {
            // gifted To
            const giftedToUser = {
                id: user.gifted_to,
                name: user.gifted_to_name,
                email: user.gifted_to_email,
                phone: user.gifted_to_phone,
                birth_Date: user.gifted_to_dob,
            };
            const giftedTo = await UserRepository.upsertUserByEmailAndName(giftedToUser);

            // assigned To
            const assignedToUser = {
                id: user.assigned_to,
                name: user.assigned_to_name,
                email: user.assigned_to_email,
                phone: user.assigned_to_phone,
                birth_Date: user.assigned_to_dob,
            };
            const assignedTo = await UserRepository.upsertUserByEmailAndName(assignedToUser);

            if (giftedTo.id !== assignedTo.id && user.relation?.trim()) {
                await UserRelationRepository.createUserRelation({
                    primary_user: giftedTo.id,
                    secondary_user: assignedTo.id,
                    relation: user.relation.trim(),
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            usersData.push({
                giftedTo: giftedTo.id,
                assignedTo: assignedTo.id,
                imageName: user.image_name ? user.image_name : undefined,
                count: parseInt(user.count) || 1,
            });

            count += parseInt(user.count) || 1;
        }

        if (count > giftCardRequest.no_of_cards) {
            throw new Error("Requested number of gift trees doesn't match in user details!");
        }

        const cards = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        cards.results = cards.results.sort((a: any, b: any) => {
            if (a.assigned && !b.assigned) return -1;
            if (!a.assigned && b.assigned) return 1;
            return 0;
        });

        const idsToKeep: number[] = [];
        for (const user of usersData) {
            let count = user.count;
            for (const card of cards.results) {
                if (card.gifted_to === user.giftedTo && card.assigned_to === user.assignedTo) {
                    count--;
                    idsToKeep.push(card.id);
                    if (count === 0) break;
                }
            }
        }

        const extraCards = cards.results.filter(card => !idsToKeep.includes(card.id));
        const deleteIds: number[] = [];
        const resetIds: number[] = [];

        let assignedFound = false;
        for (const card of extraCards) {
            if (!card.gifted_to || card.tree_id) resetIds.push(card.id);
            else deleteIds.push(card.id);

            if ((card as any).assigned) assignedFound = true;
        }

        if (assignedFound) {
            throw new Error("Some trees are assigned to user. Please unassign before deleting!");
        }

        if (resetIds.length > 0) {
            await GiftCardsRepository.updateGiftCards(
                { gifted_to: null, assigned_to: null, profile_image_url: null },
                { id: { [Op.in]: resetIds } }
            );
        }
        if (deleteIds.length > 0) {
            await GiftCardsRepository.deleteGiftCards({ id: { [Op.in]: deleteIds } });
        }

        await GiftCardsRepository.upsertGiftCards(giftCardRequestId, usersData);

        // validation on user details
        if (giftCardRequest.no_of_cards !== count && !giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors 
                ? [...giftCardRequest.validation_errors, 'MISSING_USER_DETAILS'] 
                : ['MISSING_USER_DETAILS'];
        } else if (giftCardRequest.no_of_cards === count && giftCardRequest.validation_errors?.includes('MISSING_USER_DETAILS')) {
            giftCardRequest.validation_errors = giftCardRequest.validation_errors 
                ? giftCardRequest.validation_errors.filter(error => error !== 'MISSING_USER_DETAILS') 
                : null;
        }

        if (!giftCardRequest.validation_errors || giftCardRequest.validation_errors.length === 0) {
            giftCardRequest.validation_errors = null;
        }
        giftCardRequest.updated_at = new Date();
        
        return await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
    }

    /**
     * Generate gift card templates for a gift card request
     */
    static async generateGiftCardTemplatesForRequest(giftCardRequestId: number) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (resp.results.length === 0) {
            throw new Error('Please provide valid input details!');
        }

        const giftCardRequest = resp.results[0];
        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequest.id }
        ]);

        await GiftRequestHelper.generateGiftCardTemplates(giftCardRequest, giftCards.results);
        
        if (giftCardRequest.status === GiftCardRequestStatus.pendingGiftCards) {
            giftCardRequest.status = GiftCardRequestStatus.completed;
        }
        giftCardRequest.updated_at = new Date();
        
        return await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
    }

    /**
     * Update gift card images for a gift request
     */
    static async updateGiftCardImagesForRequest(giftCardRequestId: number) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (resp.results.length === 0) {
            throw new Error('Please provide valid input details!');
        }

        const giftCardRequest = resp.results[0];
        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequest.id }
        ]);

        const presentationIdMap: Record<string, GiftCard[]> = {};
        const pIdToSlideMap: Record<string, string[]> = {};

        for (const card of giftCards.results) {
            if (!card.presentation_id || !card.slide_id) continue;
            if (!presentationIdMap[card.presentation_id]) {
                presentationIdMap[card.presentation_id] = [];
                pIdToSlideMap[card.presentation_id] = [];
            }

            presentationIdMap[card.presentation_id].push(card);
            pIdToSlideMap[card.presentation_id].push(card.slide_id);
        }

        for (const [presentationId, cards] of Object.entries(presentationIdMap)) {
            const slideIds = pIdToSlideMap[presentationId];
            await GiftRequestHelper.generateTreeCardImages(giftCardRequest.request_id, presentationId, slideIds, cards);
        }

        return { success: true };
    }

    /**
     * Download gift card templates for a gift card request
     */
    static async downloadGiftCardTemplatesForRequest(giftCardRequestId: number, downloadType: string) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        
        if (resp.results.length === 0) {
            throw new Error('Please provide valid input details!');
        }

        const giftCardRequest = resp.results[0];
        if (!giftCardRequest.presentation_id) {
            throw new Error('Gift cards not generated yet!');
        }

        let mimeType: string;
        switch (downloadType) {
            case 'pdf':
                mimeType = 'application/pdf';
                break;
            case 'ppt':
                mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                break;
            case 'zip':
                mimeType = 'application/zip';
                break;
            default:
                throw new Error('Unsupported format. Use "zip", "pdf" or "ppt".');
        }

        if (downloadType !== 'zip') {
            return {
                type: 'file' as const,
                mimeType,
                filename: `slide.${downloadType}`,
                fileData: await downloadSlide(giftCardRequest.presentation_id, mimeType)
            };
        } else {
            const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [
                { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequest.id }
            ]);

            return {
                type: 'zip' as const,
                filename: `${(giftCardRequest as any).user_name + '_' + giftCardRequest.no_of_cards}.zip`,
                giftCards: giftCards.results
            };
        }
    }

    /**
     * Generate a gift card slide
     */
    static async generateGiftCardSlide(slideData: {
        saplingId?: string;
        plantType?: string;
        userName?: string;
        giftedBy?: string;
        primaryMessage: string;
        logo?: string;
        logoMessage?: string;
        isPersonal?: boolean;
    }) {
        if (!process.env.LIVE_GIFT_CARD_PRESENTATION_ID) {
            throw new Error('Missing live gift card template presentation id in ENV variables.');
        }

        let message = slideData.primaryMessage;
        if (slideData.userName) message = message.replace("{recipient}", slideData.userName);
        if (slideData.giftedBy) message = message.replace("{giftedBy}", slideData.giftedBy);
        
        const record = {
            sapling: slideData.saplingId ? slideData.saplingId : '00000',
            message: message,
            logo: slideData.logo,
            logo_message: slideData.logoMessage || ''
        };

        const pId: string = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;
        let slideId: string | null = null;
        
        if (slideData.plantType) {
            slideId = await this.generateGiftCardTemplate(pId, slideData.plantType, record, slideData.isPersonal ? false : true);
        }

        if (!slideId) {
            slideId = await this.generateGiftCardTemplate(pId, 'Chinch (चिंच)', record, slideData.isPersonal ? false : true);
        }

        return {
            presentation_id: pId,
            slide_id: slideId
        };
    }

    /**
     * Update a gift card template
     */
    static async updateGiftCardTemplate(templateData: {
        userName?: string;
        giftedBy?: string;
        saplingId?: string;
        slideId: string;
        primaryMessage: string;
        logo?: string;
        logoMessage?: string;
        treeCount?: number;
        assigneeName?: string;
        eventType?: string;
    }) {
        if (!process.env.LIVE_GIFT_CARD_PRESENTATION_ID) {
            throw new Error('Missing live gift card template presentation id in ENV variables.');
        }

        let message = (templateData.eventType && templateData.assigneeName && templateData.assigneeName !== templateData.userName) 
            ? GiftRequestHelper.getPersonalizedMessage(templateData.primaryMessage, templateData.assigneeName, templateData.eventType) 
            : templateData.primaryMessage;
        
        message = (templateData.treeCount && templateData.treeCount > 1) 
            ? GiftRequestHelper.getPersonalizedMessageForMoreTrees(message, templateData.treeCount) 
            : message;

        if (templateData.userName) message = message.replace("{recipient}", templateData.userName);
        if (templateData.giftedBy) message = message.replace("{giftedBy}", templateData.giftedBy);
        
        const record = {
            sapling: templateData.saplingId ? templateData.saplingId : '00000',
            message: message,
            logo: templateData.logo,
            logo_message: templateData.logoMessage || ''
        };

        const presentationId = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;
        await updateSlide(presentationId, templateData.slideId, record, true);
        
        return { success: true };
    }

    /**
     * Generate adhoc tree cards
     */
    static async generateAdhocTreeCards(saplingIds: string[]) {
        return await GiftCardsService.generateTreeCardsForSaplings(saplingIds);
    }

    /**
     * Helper method to generate gift card template
     */
    private static async generateGiftCardTemplate(presentationId: string, plantType: string, record: any, keepImages: boolean = false) {
        const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId(plantType);
        if (!plantTypeCardTemplate) {
            return null;
        }
        const templateId = plantTypeCardTemplate.template_id;
        const slideId = await createSlide(presentationId, templateId, record, keepImages);
        return slideId;
    }
}