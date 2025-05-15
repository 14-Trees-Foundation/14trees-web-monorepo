
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";

// Define Main Request Schema
const ListGiftRequestRecipientsSchema = z.object({
    request_id: z.number().describe("Unique id of the gift request")
});

const description = `
Description:
Retrieves the list of recipients associated with a specific Gift Trees Request.

Use this tool to:
Get detailed information about all recipients linked to a particular gifting request.
Confirm which individuals were included in a specific tree gifting.

Required input:
gift_trees_request_id (number): The unique identifier of the Gift Trees Request.
`;


const listGiftRequestRecipients = new DynamicStructuredTool({
    name: "get_gift_recipients_by_request_id",
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