const listPreviousRequestsSchema = {
    id: "list_previous_requests_schema_v1",
    name: "ListPreviousRequests",
    description: "Schema for capturing details of previously made gift tree requests, including request ID, number of trees gifted, occasion, recipient summary, gifting date, and payment status.",
    fields: [
        {
            name: "requestId",
            type: "string",
            description: "Unique identifier for the gift tree request.",
        },
        {
            name: "giftedTrees",
            type: "number",
            description: "Number of trees gifted in the request.",
        },
        {
            name: "occasion",
            type: "string",
            description: "Occasion for which the trees were gifted.",
            optional: true,
            nullable: true,
        },
        {
            name: "giftedToPeople",
            type: "string",
            description: "Details of the recipients of the gifted trees.",
        },
        {
            name: "giftedOn",
            type: "string",
            description: "Date when the trees were gifted.",
        },
        {
            name: "paymentStatus",
            type: "enum",
            description: "Payment status for the request.",
            enumValues: ["Pending Payment", "Completed"],
        },
    ],
};

export default listPreviousRequestsSchema;