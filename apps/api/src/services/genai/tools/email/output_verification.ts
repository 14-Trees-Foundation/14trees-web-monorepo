import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

// Define Main Request Schema
const VerifyOutputSchemaRequest = z.object({
    output_json: z.string().describe("Output JSON inside ```json``` tags")
});

const description = `
Must verify the response/output format, Before sending it back to user
`;

const outputJson = `
{{
    "output": {{
        {{
            "email_body": "Text plain email body, which can be sent back to user!",
            "attachments": [
                {{
                    "filename": "Name of the attachment file",
                    "path": "Attachment file url"
                }}
            ]
        }}
    }}
}}
`

const verifyOutputFormat = new DynamicStructuredTool({
    name: "verify_output_format",
    description: description,
    schema: VerifyOutputSchemaRequest,
    func: async (data): Promise<string> => {
        
        let isValid = false;
        const output = data.output_json.trim();
        if (data.output_json.startsWith('```json') && data.output_json.endsWith('```')) {
            const dataJson = output.slice(7, output.length - 3);
            const data = JSON.parse(dataJson);

            if (data.email_body && data.attachments) {
                isValid = true
            }
        }

        return isValid 
            ? 'Valid output format. Return same output without any modifications to user'
            : "Invalid output format. Output must be valid JSON object encloded in ```json``` tags"
            + `\n${outputJson}`
    }

})

export default verifyOutputFormat