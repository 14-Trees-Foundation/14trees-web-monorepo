
const paymentSchema = {
    id: "payment_schema_v1",
    name: "PaymentDetails",
    description: "Schema for extracting basic payment details such as order id.",
    fields: [
        {
            name: "order_id",
            type: "string",
            description: "Payment order id",
        },
    ],
};

export default paymentSchema;