
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

const interactiveMenuFormResponse = {
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "PHONE_NUMBER",
    "type": "interactive",
    "interactive": {
        "type": "flow",
        // "header": {
        // "type": "text",
        // "text": "Flow message header"
        // },
        "body": {
        "text": "Click the button below to submit new expense."
        },
        // "footer": {
        // "text": "Flow message footer"
        // },
        "action": {
            "name": "flow",
            "parameters": {
                "flow_message_version": "3",
                "flow_token": "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
                "flow_id": "1113268020927942",
                "flow_cta": "Add new expense",
                "flow_action": "navigate",
                // "mode": "draft",
                "flow_action_payload": {
                "screen": "EXPENSE_FORM"
                }
            }
        }
    }
}

const menuOptionsMessage = 
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "917829723729",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "🌱 Welcome to 14 Trees!"
    },
    "body": {
      "text": "Please select one of the options below:"
    },
    "action": {
      "button": "Menu Options",
      "sections": [
        {
          "title": "🏞️ Site Visit",
          "rows": [
            {
              "id": "site_visit_register",
              "title": "Register for site visit",
              "description": "Join our next plantation/site visit"
            },
            {
              "id": "site_visit_feedback",
              "title": "Site visit feedback",
              "description": "Share your experience with us"
            }
          ]
        },
        {
          "title": "🎁 Gifting Trees",
          "rows": [
            {
              "id": "gift_trees",
              "title": "Gift Trees",
              "description": "Plant trees for friends, family, or employees"
            },
            {
              "id": "track_gift_status",
              "title": "Track gift request",
              "description": "Check the progress of your gift order"
            }
          ]
        },
        {
          "title": "💼 Add Expense",
          "rows": [
            {
              "id": "submit_expense",
              "title": "Submit new expense",
              "description": "For internal 14 Trees team use only"
            }
          ]
        }
      ]
    }
  }
}

export {
    interactiveReplyButton,
    giftSuccessMessage,
    interactiveGiftTreesFlow,
    textMessage,
    imageMessage,
    interactiveMenuFormResponse,
    menuOptionsMessage
}
