
const interactiveReplyButton = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "interactive",
    "interactive": {
        "type": "button",
        "body": {
            "text": "Greetings from 14 Trees Foundation. How can we help you?"
        },
        "action": {
            "buttons": [
                {
                    "type": "reply",
                    "reply": {
                        "id": "1",
                        "title": "Gift Trees"
                    }
                }
            ]
        }
    }
}

const interactiveGiftTreesFlow = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "interactive",
    "interactive": {
        "type": "flow",
        "body": {
            "text": "Please fill out below form in order to make gift trees request!"
        },
        "action": {
            "name": "flow",
            "parameters": {
                "flow_message_version": "3",
                "flow_token": "test_flow",
                "flow_id": "",
                "flow_cta": "Form",
                "flow_action": "navigate",
                "mode": "published",
                "flow_action_payload": {
                    "screen": "GIFTING_TREES",
                    "data": {
                        "gifted_on": "",
                    }
                }
            }
        }
    }
}

const giftSuccessMessage = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "text",
    "text": {
        "preview_url": false,
        "body": "Thank you for your kindness in gifting trees to others!"
        + "\nYour generosity is making a positive impact on the environment and the community. 🌱💚"
        + "\n\nWe are processing your request. You will receive an email after we have completed your request!",
    }
}

const textMessage = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "text",
    "text": {
        "preview_url": false,
        "body": ""
    }
}

const imageMessage = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "image",
    "image": {
      "link": "",
      "caption": "",
    }
  }

export {
    interactiveReplyButton,
    giftSuccessMessage,
    interactiveGiftTreesFlow,
    textMessage,
    imageMessage,
}
