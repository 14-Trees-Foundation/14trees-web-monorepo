const recipientDetailsSchema = {
    id: "recipient_details_schema_v1",
    name: "RecipientDetails",
    description: "Schema for capturing details of recipients to gift trees to.",
    fields: [
        {
            name: "recipients_count",
            type: "number",
            description: "Number of recipients to gift trees to.",
        },
        {
            name: "recipients",
            type: "array",
            description: "Array of recipient details.",
            items: {
                type: "object",
                fields: [
                    {
                        name: "recipient_name",
                        type: "string",
                        description: "Full name of the recipient.",
                    },
                    {
                        name: "recipient_email",
                        type: "string",
                        description: "Optional: email address of the recipient. This will be used to share tree cards and personalised dashboard links to recipient!",
                        optional: true,
                        nullable: true,
                    },
                    {
                        name: "recipient_phone",
                        type: "string",
                        description: "Optional contact number of the recipient.",
                        optional: true,
                        nullable: true,
                    },
                    {
                        name: "profile_image_url",
                        type: "string",
                        description: "Optional profile image URL of the recipient. Ask user to upload image file. When user uploads image, you will receive s3 image URLs.",
                        optional: true,
                        nullable: true,
                    },
                    {
                        name: "trees_count",
                        type: "number",
                        description: "Number of trees to gift.",
                        default: 1,
                    },
                ],
            },
        },
    ],
};

export default recipientDetailsSchema;