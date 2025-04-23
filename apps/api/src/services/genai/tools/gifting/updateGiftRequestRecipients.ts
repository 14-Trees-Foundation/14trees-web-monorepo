
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { UserRepository } from "../../../../repo/userRepo";

// Define Main Request Schema
const UpdateGiftRequestRecipientsSchema = z.object({
    request_id: z.number().describe("The request id of the gift"),
    recipients: z.array(z.object({
        recipient_id: z.number().describe("The id of the recipient"),
        email: z.string().describe("The email of the recipient"),
        name: z.string().describe("The name of the recipient"),
        communication_email: z.string().optional().nullable().describe("The communication email of the recipient"),
    })).describe("The list of recipients to be updated"),
});

const description = `
Update recipients for a gift request.
`;

const updateGiftRequestRecipients = new DynamicStructuredTool({
    name: "update_gift_request_recipients",
    description: description,
    schema: UpdateGiftRequestRecipientsSchema,
    func: async (data): Promise<string> => {

        for (const recipient of data.recipients) {
            if (!recipient.recipient_id || !recipient.email || !recipient.name) {
                return JSON.stringify({
                    status: "error",
                    message: "Recipient id, email and name are required for each recipient.",
                });
            }

            await UserRepository.upsertUser({
                id: recipient.recipient_id,
                email: recipient.email,
                name: recipient.name,
                communication_email: recipient.communication_email,
            })
        }

        return JSON.stringify({
            status: "complete",
            data: {
                message: "Gift request updated successfully.",
                request_id: data.request_id
            },
        });
    }

})

export default updateGiftRequestRecipients;