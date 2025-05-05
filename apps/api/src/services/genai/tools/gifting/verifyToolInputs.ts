import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

// Define Main Request Schema
const verifyToolInputsSchema = z
    .object({
        tool_name: z
            .string()
            .describe(
                `The name of the tool whose inputs the user is currently providing.
        
This should exactly match the tool being discussed or whose inputs are being collected.

Example: "gift_tool"`
            ),
        input_data: z
            .record(z.any())
            .describe(
                `A JSON object containing the user-provided fields so far for the specified tool.
        
- Only include fields the user has explicitly provided.
- If a field has not been mentioned by the user, omit it entirely (do not include null or empty values).
- This field is used to incrementally validate or verify user input, even if the input is incomplete.
        
Example:
{
  "occasion_type": "1",
  "recipient_name": "Alice"
}`
            ),
    })
    .describe(
        `Schema used to verify input fields provided by the user for a specific tool.`
    );

const description = `
This function should be called **after every user message** that contains potential tool input.
It helps validate partial or complete input data to guide the conversation.

If the user has provided some, but not all, required fields for a tool, use this schema to return the fields they have supplied so far.

The LLM should use this function repeatedly to track and verify incremental user input until all necessary fields for the tool are collected.
`;

const verifyToolInputs = new DynamicStructuredTool({
    name: "verify_tool_inputs",
    description: description,
    schema: verifyToolInputsSchema,
    func: async (data): Promise<string> => {

        const { tool_name, input_data } = data;
        if (!tool_name || !input_data) {
            return JSON.stringify({
                status: "error",
                message: "Tool name and input data are required.",
            });
        }
        console.log("Tool name:", tool_name);
        console.log("Input data:", input_data);

        return JSON.stringify({
            message: "Inputs provided so far are valid. Ask for remaining inputs if any and return structured data back to client",
            data: input_data,
        });
    }
});

export default verifyToolInputs;