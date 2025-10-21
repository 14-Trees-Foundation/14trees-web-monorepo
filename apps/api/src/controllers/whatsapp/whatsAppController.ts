import { Request, Response } from "express";

//services
import { messageStatuses } from '../../services/whatsapp/messageStatuses';
import { sendWhatsAppMessage } from '../../services/whatsapp/messageHelper';
import processIncomingWAMessageOLD, { processIncomingWAMessage } from '../../services/whatsapp/incomingWebhook';

//helper
import { validateXHubSignature, decryptRequest, encryptResponse } from './whatsAppControllerHelper';
import { WHATSAPP_FLOW_ACTIONS, WHATSAPP_SCREENS } from './whatsAppConstants';
import { handleGiftingFlowExchange } from './flowHandler/whatsAppGiftingFlowHandler';
import { handleExpenseFlowExchange } from './flowHandler/whatsAppExpenseFlowHandler';
import { handleVisitFlowExchange } from './flowHandler/whatsAppVisitFlowHandler';
import { handleMenuFlowExchange } from './flowHandler/whatsAppMenuFlowHandler';

//repo
import { GiftCardsRepository } from '../../repo/giftCardsRepo';
import { WhatsAppDecryptedBody, WhatsAppFlowPayload } from "./whatsAppFlowTypes";

//env
const verificationToken = process.env.WA_WEBHOOK_VERIFICATION_TOKEN;

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

    // Verify this is from the messages webhook, not other updates
    if (body.field !== 'messages') {
        // not from the messages webhook so dont process
        return res.sendStatus(400)
    }

    if (body.value.hasOwnProperty("messages")) {
        console.log("Input Body: ", JSON.stringify(body, null, 2))

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

export const webhookController = async (req: Request, res: Response) => {
    // if (!validateXHubSignature(req.body, req.headers['x-hub-signature-256'] as string)) {
    //     console.log(
    //         "Warning - request header X-Hub-Signature not present or invalid"
    //     );
    //     res.sendStatus(401);
    //     return;
    // }

    // Decrypt request body
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body);

    let response = null;
    const action = decryptedBody?.action;

    switch (action) {
        case WHATSAPP_FLOW_ACTIONS.PING: {
            response = { version: decryptedBody?.version, data: { status: 'active' } };
            break;
        }
        case WHATSAPP_FLOW_ACTIONS.INIT: {
            const payload = await getInitPayload(decryptedBody!.flow_token);
            response = { version: decryptedBody!.version, ...payload };
            break;
        }
        case WHATSAPP_FLOW_ACTIONS.DATA_EXCHANGE: {
            console.log("Input Body for whatsapp flow webhook: ", JSON.stringify(decryptedBody, null, 2))
            const responsePayload = await handleDataExchange(decryptedBody!);
            response = { version: decryptedBody!.version, ...responsePayload };
            break;
        }
        default:
            break;
    }

    res.status(200).send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
}

async function getInitPayload(token: string) {
    const payload = { screen: "", data: {} as any }

    if (token.startsWith("gift_form")) {
        payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.GIFTING_TREES;
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

        payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.RECIPIENTS_A;
        payload.data = data;
    } else if (token.startsWith("edit_gift_msg")) {
        const giftRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: 406 }])
        payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.DASHBOARD;
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

async function handleDataExchange(decryptedBody: WhatsAppDecryptedBody) {
    const payload: WhatsAppFlowPayload = { data: {} }

    const handledByGifting = await handleGiftingFlowExchange(payload, decryptedBody)
    if (handledByGifting) {
        return payload
    }

    const handledByExpense = await handleExpenseFlowExchange(payload, decryptedBody)
    if (handledByExpense) {
        return payload
    }

    const handledByVisitRegistration = await handleVisitFlowExchange(payload, decryptedBody)
    if (handledByVisitRegistration) {
        return payload
    }

    const handledByMenu = await handleMenuFlowExchange(payload, decryptedBody)
    if (handledByMenu) {
        return payload
    }

    return payload
}