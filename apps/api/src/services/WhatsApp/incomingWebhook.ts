import { giftSuccessMessage, imageMessage, interactiveGiftTreesFlow, interactiveReplyButton, textMessage } from './messages';
import { logResponseError } from './logResponseError';
import { sendWhatsAppMessage } from './messageHelper';
import { autoAssignTrees, processGiftRequest, sendGiftRequestRecipientsMail } from '../../controllers/helper/giftRequestHelper';
import RazorpayService from '../razorpay/razorpay';
import { sendTemplateMail } from '../gmail/gmail';
import { GiftCardsRepository } from '../../repo/giftCardsRepo';
import { UserRepository } from '../../repo/userRepo';
import { interactWithGiftingAgent } from '../genai/agent';
import { WAChatHistoryRepository } from '../../repo/waChatHistoryRepo';
import { Op } from 'sequelize';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function processIncomingWAMessageUsingGenAi(message: any) {
  const customerPhoneNumber = message.from;
  const messageType = message.type;

  if (messageType === "text") {
    const text = message.text.body;

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const chatHistory = await WAChatHistoryRepository.getWAChatMessages({ user_phone: customerPhoneNumber, timestamp: { [Op.gte]: fifteenMinutesAgo } })

    const history = chatHistory.map(item => {
      if (item.message_type === 'ai') return new AIMessage(item.message);
      
      return new HumanMessage(item.message);
    })
    await WAChatHistoryRepository.addWAChatMessage(text, 'human', customerPhoneNumber);
    const resp = await interactWithGiftingAgent(text, history);
    await WAChatHistoryRepository.addWAChatMessage(resp, 'ai', customerPhoneNumber);

    let messageUser = textMessage;
    messageUser.to = customerPhoneNumber;
    messageUser.text.body = resp

    try {
      await sendWhatsAppMessage(messageUser);
    } catch (error) {
      logResponseError(error);
    }
  }
}

async function processIncomingWAMessage(message: any) {
  const customerPhoneNumber = message.from;
  const messageType = message.type;

  if (messageType === "text") {
    const text = message.text.body;

    try {
      let replyButtonMessage = { ...interactiveReplyButton };
      replyButtonMessage.to = customerPhoneNumber;
      await sendWhatsAppMessage(replyButtonMessage);
    } catch (error) {
      logResponseError(error);
    }

  } else if (messageType === "interactive") {
    const interactiveType = message.interactive.type;

    if (interactiveType === "button_reply") {
      const buttonId: string = message.interactive.button_reply.id;
      const buttonTitle = message.interactive.button_reply.title;

      if (buttonId == '1') {
        try {
          let requestForm = interactiveGiftTreesFlow;
          requestForm.to = customerPhoneNumber;
          requestForm.interactive.action.parameters.flow_id = process.env.WA_FLOW_ID || '';
          requestForm.interactive.action.parameters.flow_action_payload.data.gifted_on = new Date().toISOString().slice(0, 10);

          const sendProductLists = await sendWhatsAppMessage(requestForm);
        } catch (error) {
          logResponseError(error);
        }
      } else if (buttonId.startsWith('send_mail')) {
        const requestIdStr = buttonId.split('_').slice(-1)[0];
        const requestId = parseInt(requestIdStr);

        sendEmailsToGiftRecipients(customerPhoneNumber, requestId);
      } else if (buttonId.startsWith('edit_recipients')) {
        const requestIdStr = buttonId.split('_').slice(-1)[0];
        const requestId = parseInt(requestIdStr);

        await sendEditRecipientsFlow(customerPhoneNumber, requestId);
      }
    }
    else if (interactiveType === "nfm_reply") {
      const formDataStr = message.interactive.nfm_reply.response_json;
      const formData = JSON.parse(formDataStr);

      console.log(formData);
      await handleFlowFormSubmit(customerPhoneNumber, formData);
    }
  }
}

async function handleFlowFormSubmit(customerPhoneNumber: string, formData: any) {
  if (formData.flow_token.startsWith("edit_recipients")) {
    await handleRecipientEditSubmit(customerPhoneNumber, formData);
  } else {
    await handleGiftFormSubmit(customerPhoneNumber, formData);
  }
}

async function handleGiftFormSubmit(customerPhoneNumber: string, formData: any) {
  const recipientsCount = parseInt(formData.recipients_count);

  if (recipientsCount <= 5) {

    let successMessage = giftSuccessMessage;
    successMessage.to = customerPhoneNumber;

    try {
      await sendWhatsAppMessage(successMessage);
    } catch (error) {
      logResponseError(error);
    }

    const requestId = await serveTheGiftRequest(customerPhoneNumber, formData);
    let giftMessage = textMessage;
    giftMessage.to = customerPhoneNumber;

    giftMessage.text.body = 'We have succesfully processed your request!'
      + `\n\n*Here is your gift request number: ${requestId}*.`
      + '\n\nIf you have any query regarding the gift request you can reach out to us!'

    try {
      await sendWhatsAppMessage(giftMessage);
    } catch (error) {
      logResponseError(error);
    }
  }
  else {

    const mailOptions = {
      subject: 'Details required to complete gift trees request!',
      to: [formData.user_email],
      cc: ['vivayush@gmail.com'],
      attachments: [
        { filename: 'sample-dashboard-view-1.png', path: 'https://14treesplants.s3.ap-south-1.amazonaws.com/cards/samples/sample-dashboard-view-1.png' },
        { filename: 'sample-recipient-email.png', path: 'https://14treesplants.s3.ap-south-1.amazonaws.com/cards/samples/sample-recipient-email.png' },
        { filename: 'sample-gift-card-1.jpg', path: 'https://14treesplants.s3.ap-south-1.amazonaws.com/cards/samples/sample-gift-card-1.jpg' },
        { filename: 'GiftRecipientDetails.csv', path: 'https://14treesplants.s3.ap-south-1.amazonaws.com/cards/samples/GiftRecipientDetails.csv' },
      ]
    }

    await sendTemplateMail('gift-trees-required-details.html', mailOptions, { sponsorName: formData.user_name })

    let giftMessage = textMessage;
    giftMessage.to = customerPhoneNumber;

    giftMessage.text.body = 'You will shortly receive an email regarding required details for your request!'

    try {
      await sendWhatsAppMessage(giftMessage);
    } catch (error) {
      logResponseError(error);
    }
  }

}

async function handleRecipientEditSubmit(customerPhoneNumber: string, formData: any) {
  const requestIdStr = formData.flow_token.split("_").slice(-1)[0];
  const requestId: number = parseInt(requestIdStr);

  const numberOfRecipients = parseInt(formData.recipients_count);
  let recipients = await GiftCardsRepository.getGiftRequestUsers(requestId);
  for (let i = 1; i <= numberOfRecipients; i++) {
    const id = parseInt(formData[`id_${i}`]);
    const recipient = parseInt(formData[`recipient_${i}`]);
    const name = formData[`recipient_name_${i}`].trim();
    const email = formData[`recipient_email_${i}`]?.trim() ? formData[`recipient_email_${i}`].trim() : name.split(' ').join('.') + "@14trees";
    const phone = formData[`recipient_phone_${i}`]?.trim() ? formData[`recipient_phone_${i}`].trim() : null;

    const user = await UserRepository.upsertUser({ name, email, phone });
    if (user.id !== recipient) {
      const recipientUser = recipients.find(item => recipient === item.recipient);
      if (recipientUser) {
        await GiftCardsRepository.updateGiftRequestUsers({ recipient: user.id, assignee: user.id, updated_at: new Date() }, { id: id, recipient: recipient });
      }
    }
  }

  const giftRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: requestId }]);
  const cardsResp = await GiftCardsRepository.getBookedTrees(requestId, 0, -1);

  await autoAssignTrees(giftRequestResp.results[0], recipients, cardsResp.results, null);

  const buttonMessage = JSON.parse(JSON.stringify(interactiveReplyButton));
  buttonMessage.to = customerPhoneNumber;
  buttonMessage.interactive.body.text =
    `Recipient details have been updated for request number ${requestId}.`

  buttonMessage.interactive.action.buttons = [
    { type: 'reply', reply: { id: `edit_recipients_${requestId}`, title: 'Edit Recipients' } },
    { type: 'reply', reply: { id: `edit_gift_message_${requestId}`, title: 'Edit Gift Message' } },
    { type: 'reply', reply: { id: `send_mail_${requestId}`, title: 'Send Emails' } },
  ]

  try {
    await sendWhatsAppMessage(buttonMessage);
  } catch (error) {
    logResponseError(error);
  }
}

async function sendGiftCardsToCustomer(customerPhoneNumber: string, imageUrls: string[]) {

  if (imageUrls.length > 0) {

    let message = textMessage;
    message.to = customerPhoneNumber;
    message.text.body = 'Here are your gift cards:';

    try {
      await sendWhatsAppMessage(message);
    } catch (error) {
      logResponseError(error);
    }
  }

  for (const imageUrl of imageUrls) {
    const message = imageMessage;
    message.to = customerPhoneNumber;
    message.image.link = imageUrl;
    message.image.caption = "";

    try {
      await sendWhatsAppMessage(message);
    } catch (error) {
      logResponseError(error);
    }
  }
}

async function sendEmailMessage(customerPhoneNumber: string, requestId: number) {

  // send mail action buttons
  const buttonMessage = JSON.parse(JSON.stringify(interactiveReplyButton));
  buttonMessage.to = customerPhoneNumber;
  buttonMessage.interactive.body.text =
    'Would you like to send dashboard links and gift images to recipients via email?'
    + "\n\n*Note:-* Email will only be sent if you have provided recipients emails earlier in form."

  buttonMessage.interactive.action.buttons = [
    { type: 'reply', reply: { id: 'no', title: 'No' } },
    { type: 'reply', reply: { id: `send_mail_${requestId}`, title: 'Yes, Send Now' } },
    { type: 'reply', reply: { id: `schedule_mail_${requestId}`, title: 'Schedule for Later' } },
  ]

  try {
    await sendWhatsAppMessage(buttonMessage);
  } catch (error) {
    logResponseError(error);
  }

  await sendEditRecipientsFlow(customerPhoneNumber, requestId);
}

async function sendEmailsToGiftRecipients(customerPhoneNumber: string, requestId: number) {
  let message = textMessage;
  message.to = customerPhoneNumber;

  message.text.body = 'We will be sending dashboard links and gift cards to recipients!';

  try {
    await sendWhatsAppMessage(message);
  } catch (error) {
    logResponseError(error);
  }

  await sendGiftRequestRecipientsMail(requestId);
}

async function postServeActions(customerPhoneNumber: string, images: string[], requestId: number) {
  await sendGiftCardsToCustomer(customerPhoneNumber, images);
  await delay(15000);
  await sendEmailMessage(customerPhoneNumber, requestId);
}

async function serveTheGiftRequest(customerPhoneNumber: string, messageData: any) {

  const recipientsCount = parseInt(messageData.recipients_count);
  let trees = 0;
  let recipients: any[] = [];

  for (let i = 1; i <= recipientsCount; i++) {
    const treesCount = parseInt(messageData[`trees_count_${i}`]);
    trees += treesCount;

    const recipientName: string = messageData[`recipient_name_${i}`];
    let recipientEmail: string | undefined = messageData[`recipient_email_${i}`];
    const recipientPhone: string | undefined = messageData[`recipient_phone_${i}`];

    if (!recipientEmail)
      recipientEmail = recipientName.toLocaleLowerCase().split(' ').join('.') + "@14trees";

    recipients.push({
      recipientName,
      recipientEmail,
      recipientPhone,
      treesCount
    })

  }

  const { requestId } = await processGiftRequest({
    treesCount: trees,
    sponsorEmail: messageData.user_email,
    sponsorName: messageData.user_name,
    eventName: messageData.ocassion_name,
    eventType: messageData.ocassion_type,
    giftedBy: messageData.gifted_by,
    giftedOn: messageData.gifted_on,
    primaryMessage: messageData.primary_message,
    secondaryMessage: messageData.secondary_message,
    recipients: recipients
  }, (images: string[], requestId: number) => {
    postServeActions(customerPhoneNumber, images, requestId);
  })

  const razorpayService = new RazorpayService();
  const qrCode = await razorpayService.generatePaymentQRCode(trees * 1 * 100);
  const paymentMessage = { ...imageMessage };
  paymentMessage.to = customerPhoneNumber;
  paymentMessage.image.link = qrCode;
  paymentMessage.image.caption =
    `You have requested *${trees === 1 ? '1 tree' : `${trees} trees`}* for gifting. Considering *per tree cost of INR 1/-*, your total cost is *INR ${trees * 1}/-*.`;

  try {
    await sendWhatsAppMessage(paymentMessage);
  } catch (error) {
    logResponseError(error);
  }

  return requestId;
}

async function sendEditRecipientsFlow(customerPhoneNumber: string, requestId: number) {
  const flowId = "615014964807600";

  const recipients = await GiftCardsRepository.getGiftRequestUsers(requestId);
  let data: any = { recipients_count: recipients.length }
  recipients.forEach((recipient: any, i: number) => {
    data = {
      ...data,
      [`id_${i + 1}`]: recipient.id,
      [`recipient_${i + 1}`]: recipient.recipient,
      [`recipient_name_${i + 1}`]: recipient.recipient_name,
      [`recipient_email_${i + 1}`]: recipient.recipient_email.endsWith("14trees") ? '' : recipient.recipient_email,
      [`recipient_phone_${i + 1}`]: recipient.recipient_phone ?? '',
    }
  })

  const flowMessage = { ...interactiveGiftTreesFlow };
  flowMessage.to = customerPhoneNumber;
  flowMessage.interactive.body.text = "You can edit recipient emails from below form!";
  flowMessage.interactive.action.parameters.flow_cta = "Edit Recipients";
  flowMessage.interactive.action.parameters.flow_id = flowId;
  flowMessage.interactive.action.parameters.flow_token = 'edit_recipients_' + requestId;
  flowMessage.interactive.action.parameters.flow_action_payload = { screen: 'RECIPIENTS_A', data: data }

  try {
    await sendWhatsAppMessage(flowMessage);
  } catch (error) {
    logResponseError(error);
  }

}

export default processIncomingWAMessage;