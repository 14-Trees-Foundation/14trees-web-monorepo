import * as crypto from 'crypto'
import * as fs from 'fs'
import axios from 'axios'

import { Request, Response } from "express";
import { messageStatuses } from '../services/whatsapp/messageStatuses';
import { sendWhatsAppMessage } from '../services/whatsapp/messageHelper';
import processIncomingWAMessage from '../services/whatsapp/incomingWebhook';
import { decryptRequest, encryptResponse } from '../services/whatsapp/incomingFlowWebhook';
import { defaultGiftMessages, generateGiftCardTemplate } from './helper/giftRequestHelper';
import { getSlideThumbnail, updateSlide } from './helper/slides';
import { GiftCardsRepository } from '../repo/giftCardsRepo';
import generateGiftMessages from '../services/genai/agents/gifting_agents/giftMessageAgent';

const verificationToken = process.env.WA_WEBHOOK_VERIFICATION_TOKEN;
const appSecret = process.env.WA_APP_SECRET;
const pemFile = process.env.WA_PRIVATE_PEM || '';
const passprase = process.env.WA_PEM_PASSPHRASE || '';
import { GoogleSpreadsheet } from "../services/google";

function validateXHubSignature(requestBody: any, signature: string) {
    const calcXHubSignature = "sha256=" + crypto
        .createHmac('sha256', appSecret || '')
        .update(JSON.stringify(requestBody), 'utf-8')
        .digest('hex');

    return signature === calcXHubSignature;
}


export const whatsAppWebHookController = async (req: Request, res: Response) => {

    // Calculate x-hub signature value to check with value in request header
    // if (!validateXHubSignature(req.body, req.headers['x-hub-signature-256'] as string)) {
    //     console.log(
    //         "Warning - request header X-Hub-Signature not present or invalid"
    //     );
    //     res.sendStatus(401);
    //     return;
    // }

    // console.log("request header X-Hub-Signature validated");

    const body = req.body.entry[0].changes[0];
    console.log("Input Body: ", JSON.stringify(body, null, 2))

    // Verify this is from the messages webhook, not other updates
    if (body.field !== 'messages') {
        // not from the messages webhook so dont process
        return res.sendStatus(400)
    }

    if (body.value.hasOwnProperty("messages")) {

        // Mark an incoming message as read
        try {
            let sendReadStatus = messageStatuses.read;
            sendReadStatus.message_id = body.value.messages[0].id;
            const readSent = await sendWhatsAppMessage(sendReadStatus);
        } catch (error) {
            console.log(error);
        }

        body.value.messages.forEach(processIncomingWAMessage);
    }

    res.sendStatus(200);
};

export const verifyWebHookConnection = async (req: Request, res: Response) => {
    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == verificationToken
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
}

export const whatsAppFlowWebHook = async (req: Request, res: Response) => {
    // if (!validateXHubSignature(req.body, req.headers['x-hub-signature-256'] as string)) {
    //     console.log(
    //         "Warning - request header X-Hub-Signature not present or invalid"
    //     );
    //     res.sendStatus(401);
    //     return;
    // }

    // console.log("request header X-Hub-Signature validated");

    const body = req.body;

    const privateKey = fs.readFileSync(pemFile, 'utf8');
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(body, privateKey, passprase);

    // console.log(decryptedBody);
    console.log("Input Body for whatsapp flow webhook: ", JSON.stringify(decryptedBody, null, 2))

    let response = null;
    if (decryptedBody && decryptedBody.action === 'ping') {
        response = { version: decryptedBody.version, data: { status: 'active' } }
    } else if (decryptedBody.action === "INIT") {
        const payload = await getInitPayload(decryptedBody.flow_token);
        response = { version: decryptedBody.version, ...payload };
    } else if (decryptedBody.action === "data_exchange") {
        const payload = await handleDataExchange(decryptedBody);
        response = { version: decryptedBody.version, ...payload };
    }

    res.status(200).send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
}

async function getInitPayload(token: string) {
    const payload = { screen: "", data: {} as any }

    if (token.startsWith("gift_form")) {
        payload.screen = "GIFTING_TREES"
        payload.data = { gifted_on: new Date().toISOString().split("T")[0] }
    } else if (token.startsWith("edit_recipients")) {
        const recipients = await GiftCardsRepository.getGiftRequestUsers(382);
        let data: any = { recipients_count: recipients.length }
        recipients.forEach((recipient: any, i: number) => {
            data = {
                ...data,
                [`id_${i + 1}`]: recipient.id,
                [`recipient_${i + 1}`]: recipient.recipient,
                [`recipient_name_${i + 1}`]: recipient.recipient_name,
                [`recipient_email_${i + 1}`]: recipient.recipient_email,
                [`recipient_phone_${i + 1}`]: recipient.recipient_phone ?? '',
            }
        })

        payload.screen = "RECIPIENTS_A";
        payload.data = data;
    } else if (token.startsWith("edit_gift_msg")) {
        const giftRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: 406 }])
        payload.screen = "DASHBOARD";
        payload.data = {
            request_id: giftRequestResp.results[0].id,
            gifted_on: giftRequestResp.results[0].gifted_on,
            gifted_by: giftRequestResp.results[0].planted_by,
            occasion_name: giftRequestResp.results[0].event_name || '',
            occasion_type: giftRequestResp.results[0].event_type,
        }
    }

    return payload;
}

async function handleDataExchange(decryptedBody: any) {
    const payload = { screen: "", data: {} as any }
    if (decryptedBody.screen === 'DASHBOARD') {
        const { occasion_type, occasion_name } = decryptedBody.data;
        let primary_message = occasion_type === '1' ? defaultGiftMessages.birthday : occasion_type === '2' ? defaultGiftMessages.memorial : defaultGiftMessages.primary;
        let secondary_message = defaultGiftMessages.secondary;

        const resp = await generateGiftMessages(
            {occasionName: occasion_name, occasionType: occasion_type, 
                samplePrimaryMessage: primary_message, sampleSecondaryMessage: secondary_message}
        )

        payload.screen = "AI_MESSAGES";
        resp.messages.forEach((message, i) => {
            payload.data[`primary_${i+1}`] = message.primary_message;
            payload.data[`secondary_${i+1}`] = message.secondary_message;
        })
    } else if (decryptedBody.screen === 'AI_MESSAGES') {
        const { occasion_type, slide_id, choice } = decryptedBody.data;
        const data = decryptedBody.data;

        let primary_message = occasion_type === '1' ? defaultGiftMessages.birthday : occasion_type === '2' ? defaultGiftMessages.memorial : defaultGiftMessages.primary;
        let secondary_message = defaultGiftMessages.secondary;
        if (['1', '2', '3'].includes(choice)) {
            primary_message = data[`primary_${choice}`]
            secondary_message = data[`secondary_${choice}`]
        }

        let slideId: string | null = slide_id;
        if (!slideId) {
            const record = {
                name: "<User's Name>",
                sapling: '00000',
                content1: '',
                content2: '',
                logo: null,
                logo_message: ''
            }
    
            const resp = await generateGiftCardTemplate(record, undefined, false);
            slideId = resp.slideId
        }

        payload.screen = "GIFT_MESSAGES";
        payload.data = { 
            slide_id: slideId, 
            primary_message, 
            secondary_message 
        }
        
    } else if (decryptedBody.screen === 'GIFT_MESSAGES') {
        const { primary_message, slide_id: slideId } = decryptedBody.data;

        const record = {
            sapling: '00000',
            message: primary_message,
            logo_message: ''
        }

        const presentationId = process.env.LIVE_GIFT_CARD_PRESENTATION_ID || '';

        if (presentationId && slideId) {
            await updateSlide(presentationId, slideId, record, true);
        }

        let imageUrl = await getSlideThumbnail(presentationId, slideId);
        imageUrl = imageUrl.slice(0, imageUrl.length - 4) + "600";
        const resp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(resp.data, 'binary').toString('base64');

        payload.screen = "CARD_PREVIEW";
        payload.data = { card_image: base64 };
    } else if (decryptedBody.screen === 'EXPENSE_FORM') {
        // Forward expense form to summary screen
        payload.screen = "SUMMARY";
        payload.data = decryptedBody.data;
    } else if (decryptedBody.screen === 'SUMMARY') {

        // Add expense in the system
        let expense_data= decryptedBody.data;
        console.log("Expense to be added in the system: ", expense_data);
        const spreadsheetId = process.env.EXPENSE_SPREADSHEET;
                if (!spreadsheetId) {
                    console.log("[WARN]", "WhatsappController::handleDataExchange", "spreadsheet id (EXPENSE_SPREADSHEET) is not present in env");
                    return;
                }
        
        try {
            const googleSheet = new GoogleSpreadsheet();
            await googleSheet.insertRowData(spreadsheetId, "expenses", [
                new Date().toISOString().split("T")[0],
                expense_data.amount, 
                expense_data.who_paid, 
                expense_data.paid_to, 
                expense_data.reason]);
        } catch (error) {
            console.error("[ERROR] Failed to update Google Sheet with new expense:", {
                error,
                stack: error instanceof Error ? error.stack : undefined
            });
        }

        payload.screen = "EXPENSE_SUBMITTED";
        payload.data = {"response": "Thank you for submitting the expense!"};
    } 

    return payload
}