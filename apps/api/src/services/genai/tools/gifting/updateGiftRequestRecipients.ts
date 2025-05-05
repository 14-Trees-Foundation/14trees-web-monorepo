
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { UserRepository } from "../../../../repo/userRepo";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { Op } from "sequelize";
import { GiftRequestUserCreationAttributes } from "../../../../models/gift_request_user";

// Define Main Request Schema
const UpdateGiftRequestRecipientsSchema = z.object({
    request_id: z.number().describe("The request id of the gift"),
    update_recipients: z.array(z.object({
        recipient_id: z.number().describe("The id of the recipient"),
        email: z.string().describe("The email of the recipient"),
        name: z.string().describe("The name of the recipient"),
        communication_email: z.string().optional().nullable().describe("The communication email of the recipient"),
        profile_image_url: z.string().optional().nullable().describe("Optional profile image URL of the recipient. Ask user to upload image file. When user uploads image, you will receive s3 image URLs."),
    })).optional().nullable().describe("The list of recipients to be updated"),
    delete_recipients: z.array(z.object({
        recipient_id: z.number().describe("The id of the recipient to be deleted"),
    })).optional().nullable().describe("The list of recipients to be deleted"),
    create_recipients: z.array(z.object({
        gifted_trees: z.number().default(1).nullable().describe("The number of trees to gift to the recipient"),
        email: z.string().describe("The email of the recipient"),
        name: z.string().describe("The name of the recipient"),
        communication_email: z.string().optional().nullable().describe("The communication email of the recipient"),
        profile_image_url: z.string().optional().nullable().describe("Optional profile image URL of the recipient. Ask user to upload image file. When user uploads image, you will receive s3 image URLs."),
    })).optional().nullable().describe("The list of recipients to be created"),
}).describe("The data to update the gift request recipients");


const description = `
Manage the recipients of a gift tree request by adding new recipients, editing their details, or removing existing ones.

Use this tool when:
- You want to add new recipients to a gift request.
- You need to update recipient names or email addresses.
- You want to remove recipients from an existing request.

Requires: gift request ID and recipient details.
`;


const updateGiftRequestRecipients = new DynamicStructuredTool({
    name: "update_gift_request_recipients",
    description: description,
    schema: UpdateGiftRequestRecipientsSchema,
    func: async (data): Promise<string> => {

        if (data.update_recipients) {
            for (const recipient of data.update_recipients) {
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
        }

        if (data.delete_recipients && data.delete_recipients.length > 0) {

            await GiftCardsRepository.deleteGiftRequestUsers({
                id: {[Op.in]: data.delete_recipients.map((recipient) => recipient.recipient_id)},
                gift_request_id: data.request_id,
            });
        }

        const createdRecipients: GiftRequestUserCreationAttributes[] = [];
        if (data.create_recipients && data.create_recipients.length > 0) {
            for (const recipient of data.create_recipients) {
                if (!recipient.email || !recipient.name) {
                    return JSON.stringify({
                        status: "error",
                        message: "Email and name are required for each recipient.",
                    });
                }
                const user = await UserRepository.upsertUser({
                    email: recipient.email,
                    name: recipient.name,
                    communication_email: recipient.communication_email,
                });
                createdRecipients.push({
                    gift_request_id: data.request_id,
                    recipient: user.id,
                    assignee: user.id,
                    gifted_trees: recipient.gifted_trees || 1,
                    created_at: new Date(),
                    updated_at: new Date(), 
                });
            }
            await GiftCardsRepository.addGiftRequestUsers(createdRecipients);
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