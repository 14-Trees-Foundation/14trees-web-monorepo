import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { sendEditDashboardMsgFlow } from "../../../WhatsApp/incomingWebhook";

// Define Main Request Schema
const SendEditGiftMessagingFlowRequestSchema = z.object({
    request_id: z.number().describe("Gift trees request id for which you want to edit gift dashboard/occasion/messaging deatils")
});

const description = `
Send user a WhatsApp Flow which can help user edit gift tree dashboard/occasion/messaging deatils
`;

function createSendEditGiftMessagingFlowTool(customerPhoneNumber: string) {
    return new DynamicStructuredTool({
        name: "send_edit_occasion_msg_flow",
        description: description,
        schema: SendEditGiftMessagingFlowRequestSchema,
        func: async (data): Promise<string> => {
            const { request_id } = data;

            await sendEditDashboardMsgFlow(customerPhoneNumber, request_id)
            return 'Flow sent to user!';
        }
    });
}

export default createSendEditGiftMessagingFlowTool;