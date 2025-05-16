
const confirmSchema = {
    id: "confirm_schema_v1",
    name: "IsConfirm",
    description: "Schema to determine if the last AI-generated output is requesting user confirmation.",
    fields: [
        {
            name: "need_confirmation",
            type: "bool",
            description: "Indicates whether the final AI output requires user confirmation to proceed.",
        },
    ],
};

export default confirmSchema;