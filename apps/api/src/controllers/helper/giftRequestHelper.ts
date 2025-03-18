import { Op } from "sequelize";
import { GiftCard } from "../../models/gift_card";
import { GiftCardRequest, GiftCardRequestAttributes, GiftCardRequestCreationAttributes, GiftCardRequestStatus } from "../../models/gift_card_request";
import { GiftRequestUser, GiftRequestUserCreationAttributes } from "../../models/gift_request_user";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import TreeRepository from "../../repo/treeRepo";
import { UserRepository } from "../../repo/userRepo";
import runWithConcurrency, { Task } from "../../helpers/consurrency";
import { convertPdfToImage } from "../../helpers/pdfToImage";
import PlantTypeTemplateRepository from "../../repo/plantTypeTemplateRepo";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, createSlide, deleteUnwantedSlides, getSlideThumbnail, reorderSlides } from "./slides";
import { uploadImageUrlToS3 } from "./uploadtos3";
import { copyFile, downloadSlide } from "../../services/google";
import { TemplateType } from "../../models/email_template";
import { EmailTemplateRepository } from "../../repo/emailTemplatesRepo";
import { sendDashboardMail } from "../../services/gmail/gmail";
import { UserGroupRepository } from "../../repo/userGroupRepo";

export const defaultGiftMessages = {
    primary: 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.',
    birthday: 'We are immensely delighted to share that a tree has been planted in your name on the occasion of your birthday at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.',
    memorial: 'A tree has been planted in the memory of <name here> at the 14 Trees Foundation reforestation site. For many years, this tree will help rejuvenate local ecosystems, support local biodiversity and offset the harmful effects of climate change and global warming.',
    secondary: 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.',
    logo: 'Gifted by 14 Trees in partnership with'
}

interface GiftRequestPayload {
    treesCount: number,
    sponsorName: string,
    sponsorEmail: string,
    eventType?: string,
    eventName?: string,
    giftedBy: string,
    giftedOn: string,
    primaryMessage: string,
    secondaryMessage: string,
    recipients: {
        recipientName: string,
        recipientEmail: string,
        recipientPhone?: string,
        treesCount: number,
    }[]
}

const getUniqueRequestId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const autoAssignTrees = async (giftCardRequest: GiftCardRequestAttributes, users: GiftRequestUser[], cards: GiftCard[], memoryImageUrls: string[] | null) => {
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

const getGiftCardTemplateImage = async (presentationId: string, templateId: string, requestId: string, saplingId: string) => {

    const url = await getSlideThumbnail(presentationId, templateId)
    const s3Url = await uploadImageUrlToS3(url, `cards/${requestId}/thumbnails/${saplingId}.jpg`);

    return s3Url;
}

export const getPersonalizedMessage = (primaryMessage: string, userName: string, eventType: string | null, relation?: string | null) => {
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

export const getPersonalizedMessageForMoreTrees = (primaryMessage: string, count: number) => {
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

const generateTreeCardImage = async (requestId: string, presentationId: string, giftCard: GiftCard, templateId: string): Promise<void> => {

    let tries = 3;
    const backOff = 2;
    while (tries > 0) {
        try {
            const templateImage = await getGiftCardTemplateImage(presentationId, templateId, requestId, (giftCard as any).sapling_id);
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

const generateTreeCardImages = async (requestId: string, presentationId: string, slideIds: string[], giftCards: GiftCard[]) => {

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
            s3Keys.push(`${requestId}/${(giftCard as any).sapling_id}.png`)
        }

        console.log("No. of s3 keys:", s3Keys.length);

        const time = new Date().getTime();
        const results = await convertPdfToImage(data, s3Keys);
        console.log(new Date().getTime() - time);
        console.log(results);
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
                tasks.push(() => generateTreeCardImage(requestId, presentationId, giftCard, templateId));
            }
        }

        await runWithConcurrency(tasks, 3);
    }
}

export const generateGiftCardsForGiftRequest = async (giftCardRequest: GiftCardRequest) => {

    const startTime = new Date().getTime();
    const templatePresentationId = process.env.GIFT_CARD_PRESENTATION_ID;
    if (!templatePresentationId) return;

    const userTreeCount: Record<string, number> = {};
    const idToCardMap: Map<number, GiftCard> = new Map();
    const giftCards = await GiftCardsRepository.getBookedTrees(giftCardRequest.id, 0, -1);
    for (const giftCard of giftCards.results) {
        idToCardMap.set(giftCard.id, giftCard);

        if (!giftCard.tree_id || !giftCard.gifted_to || !giftCard.assigned_to) continue;
        const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
        if (userTreeCount[key]) userTreeCount[key]++
        else userTreeCount[key] = 1;
    }

    const treeCards = giftCards.results.sort((a, b) => {
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

    console.log('[INFO]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', `Initial time taken: ${new Date().getTime() - startTime}ms`);
    const copyTasks: Task<string>[] = [];
    const batchSize = 200;
    const requiredPresentations = Math.ceil(cardIds.length / batchSize);

    for (let i = 0; i < requiredPresentations; i++) {
        copyTasks.push(() => copyFile(templatePresentationId, `${(giftCardRequest as any).group_name || (giftCardRequest as any).user_name}-[${giftCardRequest.id}] (${i + 1})`))
    }

    let time = new Date().getTime();
    const presentationIds = await runWithConcurrency(copyTasks, 10);
    console.log('[INFO]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', `Time taken to generate presentations: ${new Date().getTime() - time}ms`);

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
                let primaryMessage = giftCardRequest.primary_message;
                if (giftCard.gifted_to && giftCard.assigned_to) {
                    const key = giftCard.gifted_to.toString() + "_" + giftCard.assigned_to.toString();
                    if (giftCard.assigned_to !== giftCard.gifted_to) primaryMessage = getPersonalizedMessage(primaryMessage, (giftCard as any).assignee_name, giftCardRequest.event_type, (giftCard as any).relation);
                    if (userTreeCount[key] > 1) primaryMessage = getPersonalizedMessageForMoreTrees(primaryMessage, userTreeCount[key]);
                }

                const record = {
                    slideId: templateId,
                    name: (giftCard as any).recipient_name || "",
                    sapling: (giftCard as any).sapling_id,
                    content1: primaryMessage,
                    content2: giftCardRequest.secondary_message,
                    logo: giftCardRequest.logo_url,
                    logo_message: giftCardRequest.logo_message
                }

                records.push(record);
            }
        }
        console.log('[INFO]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', `Time taken to generate gift cards: ${new Date().getTime() - time}ms`);

        time = new Date().getTime();
        await bulkUpdateSlides(presentationId, records);
        console.log('[INFO]', 'GiftCardController::getGiftCardTemplatesForGiftCardRequest', `Time taken to update slides: ${new Date().getTime() - time}ms`);
        await deleteUnwantedSlides(presentationId, slideIds);
        await reorderSlides(presentationId, slideIds);

        console.log(presentationId);

        await generateTreeCardImages(giftCardRequest.request_id, presentationId, slideIds, batchGiftCards)
        console.log("[INFO]", `Batch: ${batch + 1} --------------------------- END`)
    }


    if (giftCardRequest.status === GiftCardRequestStatus.pendingGiftCards) {
        giftCardRequest.status = GiftCardRequestStatus.completed;
    }
    giftCardRequest.updated_at = new Date();
    await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
}


export const sendMailsToSponsors = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    const emailData: any = {
        trees: [] as any[],
        user_email: giftCardRequest.user_email,
        user_name: giftCardRequest.user_name,
        event_name: giftCardRequest.event_name,
        group_name: giftCardRequest.group_name,
        company_logo_url: giftCardRequest.logo_url,
        is_gift: giftCardRequest.request_type === 'Cards Request',
        count: 0
    };

    for (const giftCard of giftCards) {

        const treeData = {
            sapling_id: giftCard.sapling_id,
            dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
            planted_via: giftCard.planted_via,
            plant_type: giftCard.plant_type,
            scientific_name: giftCard.scientific_name,
            card_image_url: giftCard.card_image_url,
            event_name: giftCard.event_name,
            assigned_to_name: giftCard.assigned_to_name,
        };

        emailData.trees.push(treeData);
        emailData.count++;
    }

    const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
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

    const templateType: TemplateType = emailData.count > 1 ? 'sponsor-multi-trees' : 'sponsor-single-tree';
    const templates = await EmailTemplateRepository.getEmailTemplates({ event_type: eventType, template_type: templateType })
    if (templates.length === 0) {
        console.log("[ERROR]", "giftCardsController::sendEmailForGiftCardRequest", "Email template not found");
        return;
    }

    const statusMessage: string = await sendDashboardMail(templates[0].template_name, emailData, mailIds, ccMailIds, attachments);

}

const emailReceiver = async (giftCardRequest: any, emailData: any, eventType: string, template: string, attachCard: boolean, ccMailIds?: string[], testMails?: string[]) => {
    const mailIds = (testMails && testMails.length !== 0) ? testMails : [emailData.user_email];
    const isTestMail = (testMails && testMails.length !== 0) ? true : false

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
        subject = `Birthday wishes from ${giftCardRequest.planted_by ? giftCardRequest.planted_by : giftCardRequest.group_name ? giftCardRequest.group_name : giftCardRequest.user_name.split(" ")[0]} and 14 Trees`;
    }

    let tries = 3;
    const backOff = 2;
    while (tries > 0) {
        try {
            const statusMessage: string = await sendDashboardMail(template, emailData, mailIds, ccMailIds, attachments, subject);
            const updateRequest = {
                mail_sent: (statusMessage === '' && !isTestMail) ? true : false,
                mail_error: statusMessage ? statusMessage : null,
                updated_at: new Date()
            }


            await GiftCardsRepository.updateGiftRequestUsers(updateRequest, {
                gift_request_id: giftCardRequest.id,
                assignee: emailData.assigned_to,
                recipient: emailData.gifted_to,
            });
            break;
        } catch (error) {
            console.log('[ERROR]', 'GiftCardController::emailReceiver', error);
            tries--;
            // sleep 
            await new Promise(resolve => setTimeout(resolve, Math.pow(backOff, (3 - tries)) * 1000));
        }
    }
}

export const sendMailsToReceivers = async (giftCardRequest: any, giftCards: any[], eventType: string, attachCard: boolean, ccMails?: string[], testMails?: string[]) => {
    let count = 5;
    const userEmailDataMap: Record<string, any> = {};
    for (const giftCard of giftCards) {
        if (giftCard.mail_sent || !giftCard.user_email || (giftCard.user_email as string).trim().endsWith('@14trees')) continue;

        const key = giftCard.recipient + "_" + giftCard.assignee;
        const treeData = {
            sapling_id: giftCard.sapling_id,
            dashboard_link: 'https://dashboard.14trees.org/profile/' + giftCard.sapling_id,
            planted_via: giftCard.planted_via,
            plant_type: giftCard.plant_type,
            scientific_name: giftCard.scientific_name,
            card_image_url: giftCard.card_image_url,
            event_name: giftCard.event_name,
            assigned_to_name: giftCard.assigned_to_name,
        };

        if (userEmailDataMap[key]) {
            userEmailDataMap[key].trees.push(treeData);
            userEmailDataMap[key].count++;
        } else {
            userEmailDataMap[key] = {
                trees: [treeData],
                assigned_to_name: giftCard.assigned_to_name,
                user_email: giftCard.user_email,
                user_name: giftCard.user_name,
                event_name: giftCard.event_name,
                group_name: giftCardRequest.group_name,
                company_logo_url: giftCardRequest.logo_url,
                assigned_to: giftCard.assignee,
                gifted_to: giftCard.recipient,
                self: giftCard.assignee === giftCard.recipient ? true : undefined,
                relation: giftCard.relation,
                relational: giftCard.relation && giftCard.relation !== 'other' ? true : undefined,
                memorial: giftCard.event_type == "2" ? true : undefined,
                is_gift: giftCardRequest.request_type === 'Cards Request',
                count: 1
            }
        }
    }

    const ccMailIds = (ccMails && ccMails.length !== 0) ? ccMails : undefined;
    const isTestMail = (testMails && testMails.length !== 0) ? true : false

    const tasks: Task<void>[] = [];
    const templatesMap: Record<string, string> = {}

    for (const emailData of Object.values(userEmailDataMap)) {
        const templateType: TemplateType = emailData.count > 1 ? 'receiver-multi-trees' : 'receiver-single-tree';
        if (!templatesMap[templateType]) {
            const templates = await EmailTemplateRepository.getEmailTemplates({ event_type: eventType, template_type: templateType })
            if (templates.length === 0) {
                console.log("[ERROR]", "giftCardsController::sendEmailForGiftCardRequest", "Email template not found");
                return;
            }
            templatesMap[templateType] = templates[0].template_name
        }

        tasks.push(() => emailReceiver(giftCardRequest, emailData, eventType, templatesMap[templateType], attachCard, ccMailIds, testMails));

        count = count - 1;
        if (isTestMail && count === 0) break;
    }

    await runWithConcurrency(tasks, 2);
}

export async function processGiftRequest(payload: GiftRequestPayload, giftCardsCallBack: (cardImages: string[], requestId: number) => void) {

    const plotIds: number[] = [2124];

    // create gift request
    const giftRequest = await createGiftRrequest(payload);

    // create gift request user
    const users = await addGiftRequestUsers(payload, giftRequest.id);

    // reserve trees for gift request
    const treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftRequest.user_id, giftRequest.group_id, plotIds, giftRequest.no_of_cards, false, true, false);

    // add user to donations group
    if (treeIds.length > 0) await UserGroupRepository.addUserToDonorGroup(giftRequest.user_id);
    await GiftCardsRepository.bookGiftCards(giftRequest.id, treeIds);

    // get gift cards
    const cardsResp = await GiftCardsRepository.getBookedTrees(giftRequest.id, 0, -1);
    const cards = cardsResp.results;

    // assign trees
    await autoAssignTrees(giftRequest, users, cards, null);

    // update gift card request
    giftRequest.status = GiftCardRequestStatus.completed;
    giftRequest.updated_at = new Date();
    await giftRequest.save();

    const giftRequestsResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftRequest.id }]);
    const updatedRequest = giftRequestsResp.results[0];

    // get gift cards
    const updatedCards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftRequest.id);

    // await sendMailsToSponsors(updatedRequest, updatedCards, giftRequest.event_type === '1' ? 'birthday' : 'default', false);

    generateAndSendGiftCards(updatedRequest, giftCardsCallBack);

    return {
        requestId: giftRequest.id,
    }
}

async function createGiftRrequest(payload: GiftRequestPayload): Promise<GiftCardRequest> {

    // create sponsorUser
    const user = await UserRepository.upsertUser({ name: payload.sponsorName, email: payload.sponsorEmail });

    const request: GiftCardRequestCreationAttributes = {
        user_id: user.id,
        group_id: null,
        no_of_cards: payload.treesCount,
        is_active: false,
        logo_url: null,
        primary_message: payload.primaryMessage,
        secondary_message: payload.secondaryMessage,
        event_name: payload.eventName,
        event_type: payload.eventType,
        planted_by: payload.giftedBy,
        logo_message: defaultGiftMessages.logo,
        status: GiftCardRequestStatus.pendingPlotSelection,
        category: 'Public',
        grove: null,
        gifted_on: new Date(payload.giftedOn),
        created_by: user.id,
        request_type: 'Cards Request',
        created_at: new Date(),
        updated_at: new Date(),
        request_id: getUniqueRequestId(),
        payment_id: null,
        validation_errors: null,
        tags: ['WhatsApp']
    }

    return await GiftCardsRepository.createGiftCardRequest(request);
}

async function addGiftRequestUsers(payload: GiftRequestPayload, giftRequestId: number): Promise<GiftRequestUser[]> {

    // create gift request user
    const usersData: GiftRequestUserCreationAttributes[] = [];

    for (const recipient of payload.recipients) {
        const user = await UserRepository.upsertUser({ name: recipient.recipientName, email: recipient.recipientEmail, phone: recipient.recipientPhone });

        usersData.push({
            recipient: user.id,
            assignee: user.id,
            gifted_trees: recipient.treesCount,
            gift_request_id: giftRequestId,
            created_at: new Date(),
            updated_at: new Date(),
        })
    }

    return await GiftCardsRepository.addGiftRequestUsers(usersData, true) ?? [];
}

async function generateAndSendGiftCards(giftRequest: GiftCardRequest, giftCardsCallBack: (cardImages: string[], requestId: number) => void) {
    await generateGiftCardsForGiftRequest(giftRequest);

    const giftCardsResp = await GiftCardsRepository.getBookedTrees(giftRequest.id, 0, -1);
    const images = giftCardsResp.results.map(card => card.card_image_url);
    giftCardsCallBack(images, giftRequest.id);
}

export async function sendGiftRequestRecipientsMail(giftRequestId: number) {

    const giftRequestsResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftRequestId }]);
    const giftRequest = giftRequestsResp.results[0];

    // get gift cards
    const cards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftRequest.id);

    await sendMailsToReceivers(giftRequest, cards, giftRequest.event_type === '1' ? 'birthday' : 'default', true);
}

export async function generateGiftCardTemplate(record: any, plantType?: string, keepImages: boolean = false) {
    if (!process.env.LIVE_GIFT_CARD_PRESENTATION_ID) {
        throw new Error(
            'Missing live gift card template presentation id in ENV variables.'
        );
    }

    let pId: string = process.env.LIVE_GIFT_CARD_PRESENTATION_ID;
    let templateId: string = '';

    if (plantType) {
        const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId(plantType);
        if (plantTypeCardTemplate) {
            templateId = plantTypeCardTemplate.template_id;
        }
    } else {
        const plantTypeCardTemplate = await GiftCardsRepository.getPlantTypeTemplateId('Chinch (चिंच)');
        if (plantTypeCardTemplate) {
            templateId = plantTypeCardTemplate.template_id;
        }
    }

    const slideId = await createSlide(pId, templateId, record, keepImages);

    return { slideId, pId };
}