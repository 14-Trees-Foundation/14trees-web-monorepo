
const contactDetailsSchema = {
    id: "contact_schema_v1",
    name: "SponsorDetails",
    description: "Schema for extracting support team's contact information",
    fields: [
        {
            name: "mobile_numbers",
            type: "array",
            description: "Contact numbers of support team members",
            items: {
                type: "object",
                fields: [
                    {
                        name: "contact_name",
                        type: "string",
                        description: "Name of contact",
                    },
                    {
                        name: "contact_number",
                        type: "string",
                        description: "Contect number",
                    },
                ]
            }
        },
        {
            name: "email_addresses",
            type: "array",
            description: "List of email addresses",
        },
    ],
};

export default contactDetailsSchema;