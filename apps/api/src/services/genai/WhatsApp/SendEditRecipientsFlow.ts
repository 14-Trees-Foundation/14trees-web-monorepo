import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { sendEditRecipientsFlow } from "../../WhatsApp/incomingWebhook";

// Define Main Request Schema
const SendEditRecipientsFlowRequestSchema = z.object({
    request_id: z.number().describe("Gift trees request id for which you want to edit recipients")
});

const description = `
Send user a WhatsApp Flow which can help user edit gift request recipients details
`;

function createSendEditRecipientsFlowTool(customerPhoneNumber: string) {
    return new DynamicStructuredTool({
        name: "send_edit_recipients_flow",
        description: description,
        schema: SendEditRecipientsFlowRequestSchema,
        func: async (data): Promise<string> => {
            const { request_id } = data;

            await sendEditRecipientsFlow(customerPhoneNumber, request_id)
            return 'Flow sent to user!';
        }
    });
}

export default createSendEditRecipientsFlowTool;