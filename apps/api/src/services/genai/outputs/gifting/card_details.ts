import { defaultGiftMessages } from "../../../../controllers/helper/giftRequestHelper";

const cardDetailsSchema = {
    id: "card_details_schema_v1",
    name: "CardDetails",
    description: "Schema for capturing details of the card message for tree gifting, including placeholders and character limits.",
    fields: [
        {
            name: "card_message",
            type: "string",
            description: `Card message statements, maximum of 430 characters for tree cards. The message should have "{recipient}" placeholder to replace with the actual name of the recipient.

Sample Message:
${defaultGiftMessages.primary}`,
            optional: true,
            nullable: true,
        },
    ],
};

export default cardDetailsSchema;
