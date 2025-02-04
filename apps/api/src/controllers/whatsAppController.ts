import * as crypto from 'crypto'
import * as fs from 'fs'
import axios from 'axios'

import { Request, Response } from "express";
import { messageStatuses } from '../services/WhatsApp/messageStatuses';
import { sendWhatsAppMessage } from '../services/WhatsApp/messageHelper';
import processIncomingWAMessage from '../services/WhatsApp/incomingWebhook';
import { decryptRequest, encryptResponse } from '../services/WhatsApp/incomingFlowWebhook';
import { defaultGiftMessages, generateGiftCardTemplate } from './helper/giftRequestHelper';
import { getSlideThumbnail, updateSlide } from './helper/slides';
import { GiftCardsRepository } from '../repo/giftCardsRepo';

const verificationToken = process.env.WA_WEBHOOK_VERIFICATION_TOKEN;
const appSecret = process.env.WA_APP_SECRET;
const pemFile = process.env.WA_PRIVATE_PEM || '';
const passprase = process.env.WA_PEM_PASSPHRASE || '';

function validateXHubSignature(requestBody: any, signature: string) {
    const calcXHubSignature = "sha256=" + crypto
        .createHmac('sha256', appSecret || '')
        .update(JSON.stringify(requestBody), 'utf-8')
        .digest('hex');

    return signature === calcXHubSignature;
}


export const whatsAppBotWebHook = async (req: Request, res: Response) => {

    // Calculate x-hub signature value to check with value in request header
    if (!validateXHubSignature(req.body, req.headers['x-hub-signature-256'] as string)) {
        console.log(
            "Warning - request header X-Hub-Signature not present or invalid"
        );
        res.sendStatus(401);
        return;
    }

    console.log("request header X-Hub-Signature validated");

    const body = req.body.entry[0].changes[0];

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

    console.log(decryptedBody);

    let response = null;
    if (decryptedBody && decryptedBody.action === 'ping') {
        response = { version: decryptedBody.version, data: { status: 'active' } }
    } 
    // else if (decryptedBody.action === 'INIT') {
    //     const recipients = await GiftCardsRepository.getGiftRequestUsers(382);
    //     let data: any = { recipients_count: recipients.length }
    //     recipients.forEach((recipient: any, i: number) => {
    //         data = {
    //             ...data,
    //             [`id_${i + 1}`]: recipient.id,
    //             [`recipient_${i + 1}`]: recipient.recipient,
    //             [`recipient_name_${i + 1}`]: recipient.recipient_name,
    //             [`recipient_email_${i + 1}`]: recipient.recipient_email,
    //             [`recipient_phone_${i + 1}`]: recipient.recipient_phone ?? '',
    //         }
    //     })
    //     response = {
    //         version: decryptedBody.version,
    //         screen: "RECIPIENTS_A",
    //         data: data,
    //     }
    // }
    else if (decryptedBody.action === "INIT") {
        response = { version: decryptedBody.version, screen: "GIFTING_TREES", data: { gifted_on: new Date().toISOString().slice(0, 10) } }
    } else if (decryptedBody.action === "data_exchange" && decryptedBody.screen === 'DASHBOARD') {
        const { ocassion_type, slide_id } = decryptedBody.data;

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

        const primary_message = ocassion_type === '1' ? defaultGiftMessages.birthday : ocassion_type === '2' ? defaultGiftMessages.memorial : defaultGiftMessages.primary;
        const secondary_message = defaultGiftMessages.secondary;
        response = { version: decryptedBody.version, screen: "GIFT_MESSAGES", data: { slide_id: slideId, primary_message, secondary_message } }
    } else if (decryptedBody.action === 'data_exchange' && decryptedBody.screen === 'GIFT_MESSAGES') {
        const { primary_message, secondary_message, slide_id: slideId } = decryptedBody.data;

        const record = {
            name: "<User's Name>",
            sapling: '00000',
            content1: primary_message,
            content2: secondary_message,
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

        response = { version: decryptedBody.version, screen: "CARD_PREVIEW", data: { card_image: base64 } }
    }

    res.status(200).send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
}