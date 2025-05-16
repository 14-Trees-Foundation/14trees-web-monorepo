
const sponsorSchema = {
    id: "sponsor_schema_v1",
    name: "SponsorDetails",
    description: "Schema for extracting basic sponsor details such as name and email from text.",
    fields: [
        {
            name: "sponsor_name",
            type: "string",
            description: "Full name of the sponsor.",
        },
        {
            name: "sponsor_email",
            type: "string",
            description: "Email address of the sponsor.",
        },
    ],
};

export default sponsorSchema;