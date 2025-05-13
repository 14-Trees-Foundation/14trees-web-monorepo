import { and, Op } from "sequelize";
import { GiftCard } from "../models/gift_card";
import { GiftCardRequest, GiftCardRequestAttributes, GiftCardRequestStatus, GiftMessages } from "../models/gift_card_request";
import { GiftRequestUser } from "../models/gift_request_user";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import TreeRepository from "../repo/treeRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import runWithConcurrency, { Task } from "./consurrency";
import { sendDashboardMail } from "../services/gmail/gmail";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, reorderSlides, deleteUnwantedSlides, getSlideThumbnail } from "../controllers/helper/slides";
import { copyFile, downloadSlide } from "../services/google";
import { uploadImageUrlToS3 } from "../controllers/helper/uploadtos3";
import { convertPdfToImage } from "./pdfToImage";


class GiftRequestHelper {

    public static async autoBookTreesForGiftRequest(giftCardRequestId: number, bookNonGiftable: boolean, diversify: boolean, bookAllHabits: boolean): Promise<string | void> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftCardRequest = resp.results[0];
        const treesCount = giftCardRequest.no_of_cards - Number((giftCardRequest as any).booked);
        if (treesCount <= 0) return;

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        if (plotIds.length === 0) {
            return 'Please assign plot to this request first!';
        }

        let treeIds: number[] = [];
        treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.sponsor_id, giftCardRequest.group_id, plotIds, treesCount, bookNonGiftable, diversify, bookAllHabits);
        if (treeIds.length === 0) {
            return 'Enough trees not available for this request!';
        }
        

        // add user to donations group
        if (treeIds.length > 0) await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

        const cards = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }]);
        const finalTreeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (finalTreeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        if (treeIds.length !== treesCount) return 'Partially reserved: Enough trees not available for this request!';
    }

    public static async autoAssignTrees(giftCardRequest: GiftCardRequestAttributes, users: GiftRequestUser[], cards: GiftCard[], memoryImageUrls: string[] | null) {
        const userTreesMap: Record<number, GiftCard[]> = {};
        for (const user of users) {
            const userCards = cards.filter(card => card.gift_request_user_id === user.id);
            userTreesMap[user.id] = userCards;
        }
    
        let idx = 0;
        for (const user of users) {
            let count = user.gifted_trees - userTreesMap[user.id].length;
    
            while (count > 0) {
                if (idx >= cards.length) break;
                if (!cards[idx].gift_request_user_id) {
                    userTreesMap[user.id].push(cards[idx]);
                    count--;
                }
    
                idx++;
            }
        }
    
        const update = async (user: GiftRequestUser, updateRequest: any, treeIds: number[]) => {
            await GiftCardsRepository.updateGiftCards({ gift_request_user_id: user.id, updated_at: new Date() }, { gift_card_request_id: giftCardRequest.id, tree_id: { [Op.in]: treeIds } });
            await TreeRepository.updateTrees(updateRequest, { id: { [Op.in]: treeIds } });
        }
    
        const normalAssignment = giftCardRequest.request_type === 'Normal Assignment'
    
        const tasks: Task<void>[] = [];
        for (const user of users) {
            const cards = userTreesMap[user.id];
            const treeIds = cards.map(card => card.tree_id);
    
            const updateRequest = {
                assigned_at: normalAssignment ? new Date() : giftCardRequest.gifted_on,
                assigned_to: user.assignee,
                gifted_to: normalAssignment ? null : user.recipient,
                updated_at: new Date(),
                description: giftCardRequest.event_name,
                event_type: giftCardRequest.event_type,
                planted_by: null,
                gifted_by: normalAssignment ? null : giftCardRequest.user_id,
                gifted_by_name: normalAssignment ? null : giftCardRequest.planted_by,
                user_tree_image: user.profile_image_url,
                memory_images: memoryImageUrls,
            }
    
            tasks.push(() => update(user, updateRequest, treeIds));
        }
    
        await runWithConcurrency(tasks, 10);
    }


    public static async deleteGiftCardRequest(giftCardRequestId: number) {

        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })
        const cardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }]);

        const treeIds: number[] = [];
        cardsResp.results.forEach(card => {
            if (card.tree_id) treeIds.push(card.tree_id);
        })

        if (treeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
                gifted_to: null,
                gifted_by: null,
                gifted_by_name: null,
                assigned_to: null,
                assigned_at: null,
                memory_images: null,
                description: null,
                planted_by: null,
                user_tree_image: null,
                event_type: null,
                updated_at: new Date(),
            }

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: treeIds } });
            await GiftCardsRepository.deleteGiftCards({ gift_card_request_id: giftCardRequestId, tree_id: { [Op.in]: treeIds } });
        }

        // delete gift request plots
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })

        await GiftCardsRepository.deleteGiftRequestUsers({ gift_request_id: giftCardRequestId });

        let resp = await GiftCardsRepository.deleteGiftCardRequest(giftCardRequestId);
        console.log(`Deleted Gift card with id: ${giftCardRequestId}`, resp);
    }

    public static async emailReceiver(
        emailData: any, 
        eventType: string, 
        template: string, 
        attachCard: boolean, 
        ccMailIds?: string[], 
        testMails?: string[],
        giftedBy?: string,
        groupName?: string,
    ) {
        const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];
    
        let attachments: { filename: string; path: string }[] | undefined = undefined;
        if (attachCard) {
            const files: { filename: string; path: string }[] = []
            for (const tree of emailData.trees) {
                if (tree.card_image_url) {
                    files.push({
                        filename: tree.assigned_to_name + "_" + tree.card_image_url.split("/").slice(-1)[0],
                        path: tree.card_image_url
                    })
                }
            }
    
            if (files.length > 0) attachments = files;
        }
    
        let subject: string | undefined = undefined;
        if (eventType === 'birthday') {
            subject = 'Birthday wishes from 14 Trees';
            if (giftedBy || groupName) {
                subject = `Birthday wishes from ${giftedBy || groupName} and 14 Trees`;
            }
        }
    
        let tries = 3;
        const backOff = 2;
        let statusMessage: string | undefined = undefined;
        while (tries > 0) {
            try {
                statusMessage = await sendDashboardMail(template, emailData, mailIds, ccMailIds, attachments, subject);
                break;
            } catch (error: any) {
                statusMessage = error.message;
                console.log('[ERROR]', 'GiftCardController::emailReceiver', error);
                tries--;
                // sleep 
                await new Promise(resolve => setTimeout(resolve, Math.pow(backOff, (3 - tries)) * 1000));
            }
        }

        return statusMessage;
    }

    public static getGiftCardTemplateImage = async (presentationId: string, templateId: string, requestId: string, saplingId: string) => {

        const url = await getSlideThumbnail(presentationId, templateId)
        const s3Url = await uploadImageUrlToS3(url, `cards/${requestId}/thumbnails/${saplingId}.jpg`);
    
        return s3Url;
    }

    public static getPersonalizedMessage = (primaryMessage: string, userName: string, eventType: string | null, relation?: string | null) => {
        if (eventType === "2") {
            const index = primaryMessage.indexOf('<name here>');
            if (index < 0) return primaryMessage;
            if (relation && relation !== 'other') {
                return primaryMessage.substring(0, index) + 'your ' + relation.toLocaleLowerCase() + ' ' + `${userName.split(' ')[0]}` + primaryMessage.substring(index + 11)
            }
    
            return primaryMessage.substring(0, index) + `${userName.split(' ')[0]}` + primaryMessage.substring(index + 11)
        } else {
            const index = primaryMessage.indexOf('your');
            if (index < 0) return primaryMessage;
            if (relation && relation !== 'other') {
                return primaryMessage.substring(0, index + 5) + relation.toLocaleLowerCase() + ' ' + `${userName.split(' ')[0]}'s` + primaryMessage.substring(index + 4)
            }
    
            return primaryMessage.substring(0, index) + `${userName.split(' ')[0]}'s` + primaryMessage.substring(index + 4)
        }
    }
    
    public static getPersonalizedMessageForMoreTrees = (primaryMessage: string, count: number) => {
        let message = primaryMessage;
        const index = primaryMessage.indexOf('a tree');
        if (index !== -1) {
            message = primaryMessage.substring(0, index) + count + " trees" + primaryMessage.substring(index + 6);
        }
    
        const index2 = primaryMessage.indexOf('A tree');
        if (index2 !== -1) {
            message = primaryMessage.substring(0, index2) + count + " trees" + primaryMessage.substring(index2 + 6);
        }
    
        message = message.replace(/This tree/g, 'These trees');
        message = message.replace(/ tree /g, ' trees ');
        message = message.replace(/ trees has /g, ' trees have ');
    
        return message
    }
    
    public static generateTreeCardImage = async (requestId: string, presentationId: string, giftCard: GiftCard, templateId: string): Promise<void> => {
    
        let tries = 3;
        const backOff = 2;
        while (tries > 0) {
            try {
                const templateImage = await this.getGiftCardTemplateImage(presentationId, templateId, requestId, (giftCard as any).sapling_id);
                giftCard.card_image_url = templateImage;
                giftCard.slide_id = templateId;
                giftCard.presentation_id = presentationId;
                giftCard.updated_at = new Date();
                await GiftCardsRepository.updateGiftCard(giftCard);
                break;
            } catch (error) {
                console.log('[ERROR]', 'GiftCardController::generateTreeCardImage', error);
                tries--;
                // sleep 
                await new Promise(resolve => setTimeout(resolve, Math.pow(backOff, (3 - tries)) * 1000));
            }
        }
    }
    
    public static generateTreeCardImages = async (requestId: string, presentationId: string, slideIds: string[], giftCards: GiftCard[]) => {
    
        try {
            const resp = await downloadSlide(presentationId, 'application/pdf');
            const chunks: Buffer[] = [];
            for await (const chunk of resp) {
                chunks.push(chunk);
            }
            const data = Buffer.concat(chunks);
    
            const s3Keys: string[] = [];
            for (let i = 0; i < slideIds.length; i++) {
                const giftCard = giftCards[i];
                s3Keys.push(`/cards/${requestId}/thumbnails/${(giftCard as any).sapling_id}.png`)
            }
    
            console.log("No. of s3 keys:", s3Keys.length);
    
            const time = new Date().getTime();
            const results = await convertPdfToImage(data, s3Keys);
            console.log(new Date().getTime() - time);
    
            const tasks: Task<void>[] = [];
            for (let i = 0; i < slideIds.length; i++) {
                const giftCard = giftCards[i];
                const s3Key = s3Keys[i];
    
                if (results[s3Key]) {
                    giftCard.card_image_url = results[s3Key];
                    giftCard.slide_id = slideIds[i];
                    giftCard.presentation_id = presentationId;
                    giftCard.updated_at = new Date();
    
                    tasks.push(() => GiftCardsRepository.updateGiftCard(giftCard));
                }
            }
    
            await runWithConcurrency(tasks, 20);
        } catch (error) {
            console.log('[ERROR]', 'GiftCardController::generateTreeCardImages', error);
    
            const tasks: Task<void>[] = []
            for (let i = 0; i < slideIds.length; i++) {
                const templateId = slideIds[i];
                const giftCard = giftCards[i];
                if (giftCard) {
                    tasks.push(() => this.generateTreeCardImage(requestId, presentationId, giftCard, templateId));
                }
            }
    
            await runWithConcurrency(tasks, 3);
        }
    }

    public static generateGiftCardTemplates = async (giftCardRequest: GiftCardRequest, giftCards: GiftCard[], messages?: GiftMessages) => {
        const startTime = new Date().getTime();
        if (!process.env.GIFT_CARD_PRESENTATION_ID) {
            throw new Error("Missing gift card template presentation id in ENV variables.");
        }
    
        const templatePresentationId: string = process.env.GIFT_CARD_PRESENTATION_ID;
    
        const userTreeCount: Record<string, number> = {};
        const idToCardMap: Map<number, GiftCard> = new Map();
        for (const giftCard of giftCards) {
            idToCardMap.set(giftCard.id, giftCard);
    
            if (!giftCard.tree_id || !giftCard.gifted_to || !giftCard.assigned_to) continue;
            const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
            if (userTreeCount[key]) userTreeCount[key]++
            else userTreeCount[key] = 1;
        }
    
        const treeCards = giftCards.sort((a, b) => {
            if (!a.gift_request_user_id) return 1;
            if (!b.gift_request_user_id) return -1;
    
            return a.gift_request_user_id - b.gift_request_user_id;
        });
    
        const plantTypeTemplateIdMap: Map<string, string> = new Map();
        const plantTypeTemplates = await PlantTypeTemplateRepository.getAll();
        for (const plantTypeTemplate of plantTypeTemplates) {
            plantTypeTemplateIdMap.set(plantTypeTemplate.plant_type, plantTypeTemplate.template_id);
        }
    
        const templateIds: string[] = [];
        const cardIds: number[] = [];
        for (const giftCard of treeCards) {
            if (!giftCard.tree_id) continue;
            const templateId = plantTypeTemplateIdMap.get((giftCard as any).plant_type);
            if (!templateId) continue;
    
            templateIds.push(templateId);
            cardIds.push(giftCard.id);
        }
    
        console.log('[INFO]', 'GenerateTreeCards::', `Initial time taken: ${new Date().getTime() - startTime}ms`);
        const copyTasks: Task<string>[] = [];
        const batchSize = 200;
        const requiredPresentations = Math.ceil(cardIds.length / batchSize);
    
        for (let i = 0; i < requiredPresentations; i++) {
            copyTasks.push(() => copyFile(templatePresentationId, `${(giftCardRequest as any).group_name || (giftCardRequest as any).user_name}-[${giftCardRequest.id}] (${i + 1})`))
        }
    
        let time = new Date().getTime();
        const presentationIds = await runWithConcurrency(copyTasks, 10);
        console.log('[INFO]', 'GenerateTreeCards::', `Time taken to generate presentations: ${new Date().getTime() - time}ms`);
    
        for (let batch = 0; batch < presentationIds.length; batch++) {
    
            console.log("[INFO]", `Batch: ${batch + 1} --------------------------- START`)
            const presentationId = presentationIds[batch];
            let time = new Date().getTime();
    
            const records: any[] = [];
            const batchGiftCards: GiftCard[] = [];
            const slideIds: string[] = await createCopyOfTheCardTemplates(presentationId, templateIds.slice(batch * batchSize, (batch + 1) * batchSize));
            for (let i = 0; i < slideIds.length; i++) {
                const templateId = slideIds[i];
                const cardId = cardIds[(batch * batchSize) + i];
                const giftCard = idToCardMap.get(cardId);
                if (giftCard) {
                    batchGiftCards.push(giftCard);
                    let primaryMessage = messages ? messages.primary_message : giftCardRequest.primary_message;
                    let eventType = messages ? messages.event_type : giftCardRequest.event_type;
                    if (giftCard.gifted_to && giftCard.assigned_to) {
                        const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
                        if (giftCard.assigned_to !== giftCard.gifted_to) primaryMessage = this.getPersonalizedMessage(primaryMessage, (giftCard as any).assignee_name, eventType, (giftCard as any).relation);
                        if (userTreeCount[key] > 1) primaryMessage = this.getPersonalizedMessageForMoreTrees(primaryMessage, userTreeCount[key]);
                    }
    
                    primaryMessage = primaryMessage.replace("{recipient}", (giftCard as any).recipient_name || "");
                    const record = {
                        slideId: templateId,
                        sapling: (giftCard as any).sapling_id,
                        message: primaryMessage,
                        logo: giftCardRequest.logo_url,
                        logo_message: giftCardRequest.logo_message
                    }
    
                    records.push(record);
                }
            }
            console.log('[INFO]', 'GenerateTreeCards::', `Time taken to generate gift cards: ${new Date().getTime() - time}ms`);
    
            time = new Date().getTime();
            await bulkUpdateSlides(presentationId, records);
            console.log('[INFO]', 'GenerateTreeCards::', `Time taken to update slides: ${new Date().getTime() - time}ms`);
            await deleteUnwantedSlides(presentationId, slideIds);
            await reorderSlides(presentationId, slideIds);
    
            console.log(presentationId);
    
            await this.generateTreeCardImages(giftCardRequest.request_id, presentationId, slideIds, batchGiftCards)
            console.log("[INFO]", `Batch: ${batch + 1} --------------------------- END`)
        }
    
    }
}

export default GiftRequestHelper;