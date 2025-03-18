import { z } from "zod";
import { DynamicStructuredTool, Tool } from "langchain/tools";
import { StructuredToolInterface } from "@langchain/core/tools";
import { defaultGiftMessages, processGiftRequest } from "../../controllers/helper/giftRequestHelper";

// Define Enum for Occasion Type
enum OccasionType {
    BIRTHDAY = "1",
    MEMORIAL = "2",
    GENERAL_GIFT = "3",
}

// Define Recipient Schema
const RecipientSchema = z.object({
    recipient_name: z.string().describe("Full name of the recipient"),
    recipient_email: z.string().optional().describe("Optional: email address of the recipient. This will be used to share tree cards and personalised dashboard links to recipient!"),
    recipient_phone: z.string().optional().describe("Optional contact number of the recipient"),
    trees_count: z.number().default(1).describe("Number of trees to gift"),
});

// Define Main Request Schema
const CreateGiftTreesRequestSchema = z.object({
    recipients_count: z.number(),
    recipients: z.array(RecipientSchema),
    sponsor_name: z.string(),
    sponsor_email: z.string(),
    ocassion_type: z.nativeEnum(OccasionType).default(OccasionType.GENERAL_GIFT),
    ocassion_name: z.string().optional(),
    gifted_by: z.string().optional(),
    gifted_on: z.string().optional(),
});

const description = `
Want to gift trees to someone? 

Create a gift trees request. It will internally reserve trees for recipients and create personalized tree cards and dashboards for recipients.

Response: Request Id
Sponsor can see all this using gift trees request id!
`;

const createGiftTreesRequestTool = new DynamicStructuredTool({
    name: "create_gift_trees_request",
    description: description,
    schema: CreateGiftTreesRequestSchema,
    func: async (data): Promise<String> => {

        let trees = 0;
        let recipients: any[] = [];

        for (const user of data.recipients) {
            const treesCount = user.trees_count;
            trees += treesCount;

            const recipientName: string = user.recipient_name;
            let recipientEmail: string | undefined = user.recipient_email;
            const recipientPhone: string | undefined = user.recipient_phone;

            if (!recipientEmail)
                recipientEmail = recipientName.toLocaleLowerCase().split(' ').join('.') + "@14trees";

            recipients.push({
                recipientName,
                recipientEmail,
                recipientPhone,
                treesCount
            })

        }

        try {
            const { requestId } = await processGiftRequest({
                treesCount: trees,
                sponsorEmail: data.sponsor_email,
                sponsorName: data.sponsor_name,
                eventName: data.ocassion_name,
                eventType: data.ocassion_type,
                giftedBy: data.gifted_by ? data.gifted_by : data.sponsor_name,
                giftedOn: data.gifted_on ? data.gifted_on : new Date().toISOString().slice(0, 10),
                primaryMessage: data.ocassion_type === '1' ? defaultGiftMessages.birthday : data.ocassion_type === '2' ? defaultGiftMessages.memorial : defaultGiftMessages.primary,
                secondaryMessage: defaultGiftMessages.secondary,
                recipients: recipients
            }, (images: string[], requestId: number) => {
                console.log(requestId, images)
            })

            return `Successfully created gift request. Request Id is ${requestId}`;
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardController::quickServeGiftRequest", error);
            throw new Error("Failed to create gift request!")
        }
    }

})

// Function to get tools
export function getGiftingTools(): StructuredToolInterface[] {

    return [createGiftTreesRequestTool];
}
