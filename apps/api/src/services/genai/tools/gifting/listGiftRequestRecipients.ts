
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";

// Define Main Request Schema
const ListGiftRequestRecipientsSchema = z.object({
    request_id: z.number().describe("The request id of the gift")
});

const description = `
List recipients for a gift request.
`;

const listGiftRequestRecipients = new DynamicStructuredTool({
    name: "list_gift_request_recipients",
    description: description,
    schema: ListGiftRequestRecipientsSchema,
    func: async (data): Promise<string> => {

        const users = await GiftCardsRepository.getGiftRequestUsers(data.request_id);
        const recipients = users.filter((user) => user.recipient === user.assignee).map((user: any) => ({
            recipient_id: user.recipient,
            email: user.recipient_email,
            name: user.recipient_name,
            communication_email: user.recipient_communication_email,
        }));

        return JSON.stringify({
            status: "complete",
            data: {
                recipients: recipients,
                request_id: data.request_id,
                message: "Gift request recipients retrieved successfully.",
            },
        });
    }

})

export default listGiftRequestRecipients;