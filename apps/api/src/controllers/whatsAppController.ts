import * as crypto from 'crypto'
import * as fs from 'fs'

import { Request, Response } from "express";
import { messageStatuses } from '../services/WhatsApp/messageStatuses';
import { sendWhatsAppMessage } from '../services/WhatsApp/messageHelper';
import processIncomingWAMessage from '../services/WhatsApp/incomingWebhook';
import { decryptRequest, encryptResponse } from '../services/WhatsApp/incomingFlowWebhook';

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
    } else if (decryptedBody.action === "INIT") {
        response = { version: decryptedBody.version, screen: "GIFTING_TREES", data: { gifted_on: new Date().toISOString().slice(0, 10) } }
    }

    res.status(200).send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
}