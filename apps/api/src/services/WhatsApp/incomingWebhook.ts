import { giftSuccessMessage, imageMessage, interactiveGiftTreesFlow, interactiveReplyButton, textMessage } from './messages';
import { logResponseError } from './logResponseError';
import { sendWhatsAppMessage } from './messageHelper';
import { processGiftRequest, sendGiftRequestRecipientsMail } from '../../controllers/helper/giftRequestHelper';

async function sendGiftCardsToCustomer(customerPhoneNumber: string, imageUrls: string[]) {

  for (const imageUrl of imageUrls) {
    const message = imageMessage;
    message.to = customerPhoneNumber;
    message.image.link = imageUrl;

    try {
      const sendSuccessMessage = await sendWhatsAppMessage(message);
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
    + "\n\n*Note:-* Email will only be sent if you have provided recipients emails erlier in form."

  buttonMessage.interactive.action.buttons = [
    { type: 'reply', reply: { id: 'no', title: 'No' } },
    { type: 'reply', reply: { id: `send_mail_${requestId}`, title: 'Yes, Send Now' } },
    { type: 'reply', reply: { id: `schedule_mail_${requestId}`, title: 'Schedule for Latter' } },
  ]

  try {
    const sendSuccessMessage = await sendWhatsAppMessage(buttonMessage);
  } catch (error) {
    logResponseError(error);
  }
}

async function sendEmailsToGiftRecipients(customerPhoneNumber: string, requestId: number) {
  let message = textMessage;
  message.to = customerPhoneNumber;

  message.text.body = 'We will be sending dashboard links and gift cards to recipients!';

  try {
    const sendSuccessMessage = await sendWhatsAppMessage(message);
  } catch (error) {
    logResponseError(error);
  }
  
  await sendGiftRequestRecipientsMail(requestId);
}

async function postServeActions(customerPhoneNumber: string, images: string[], requestId: number) {
  await sendGiftCardsToCustomer(customerPhoneNumber, images);
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
    recipients: recipients
  }, (images: string[], requestId: number) => {
    postServeActions(customerPhoneNumber, images, requestId);
  })

  return requestId;
}


async function processIncomingWAMessage(message: any) {
  const customerPhoneNumber = message.from;
  const messageType = message.type;

  if (messageType === "text") {
    const textMessage = message.text.body;

    try {
      let replyButtonMessage = interactiveReplyButton;
      replyButtonMessage.to = customerPhoneNumber;
      const replyButtonSent = await sendWhatsAppMessage(replyButtonMessage);
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
      }
    }
    else if (interactiveType === "nfm_reply") {
      const formDataStr = message.interactive.nfm_reply.response_json;
      const formData = JSON.parse(formDataStr);

      console.log(formData);

      let successMessage = giftSuccessMessage;
      successMessage.to = customerPhoneNumber;

      try {
        const sendSuccessMessage = await sendWhatsAppMessage(successMessage);
      } catch (error) {
        logResponseError(error);
      }

      const requestId = await serveTheGiftRequest(customerPhoneNumber, formData);
      let giftMessage = textMessage;
      giftMessage.to = customerPhoneNumber;

      giftMessage.text.body = 'We have succesfully processed you request!'
        + `\n\n*Here is your gift request number: ${requestId}*.`
        + '\n\nIf you have any query regarding the gift request you can reach out to us!'

      try {
        const sendSuccessMessage = await sendWhatsAppMessage(giftMessage);
      } catch (error) {
        logResponseError(error);
      }
    }
  }
}

export default processIncomingWAMessage;