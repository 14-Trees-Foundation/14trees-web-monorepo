import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

// Define Main Request Schema
const verifyToolInputsSchema = z.object({
    tool_name: z.string().describe("Name of the tool for which the inputs are being verified"),
    input_data: z.record(z.any()).describe("Input data object with fields to be verified"),
}).describe("Schema for verifying tool inputs");

const description = `
Whenever user provides the inputs pass it to this tool. Whether the inputs provided are partial or complete, this tool will verify the inputs and return the response to the user.
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
            status: "complete",
            data: {
                message: "Inputs provided so far are valid.",
                data: input_data,
            },
        });
    }
});

export default verifyToolInputs;