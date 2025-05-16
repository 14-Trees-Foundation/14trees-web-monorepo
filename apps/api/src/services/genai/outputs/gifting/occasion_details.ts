
const occasionDetailsSchema = {
    id: "occasion_details_schema_v1",
    name: "OccasionDetails",
    description: "Schema for capturing details of the occasion for gifting trees, including type, name, date, and optional images.",
    fields: [
        {
            name: "occasion_type",
            type: "enum",
            description: "Type of the occasion for gifting trees. Default: General Gift.",
        },
        {
            name: "occasion_name",
            type: "string",
            description: "Name of the occasion for gifting trees.",
            optional: true,
            nullable: true,
        },
        {
            name: "gifted_by",
            type: "string",
            description: "Name(s) to show on the personalized dashboard. Default: Name of the person gifting the trees.",
            optional: true,
            nullable: true,
        },
        {
            name: "gifted_on",
            type: "string",
            description: "Date of the occasion for gifting trees. Default: Today's date.",
            optional: true,
            nullable: true,
        },
        {
            name: "memory_images",
            type: "array",
            description: "Optional images to show on the personalized dashboard. Ask the user to upload images. When the user uploads images, you will receive S3 image URLs.",
            items: {
                type: "string",
            },
            optional: true,
            nullable: true,
        },
    ],
};

export default occasionDetailsSchema;