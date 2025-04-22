import { z } from "zod";
import { DynamicStructuredTool, Tool } from "langchain/tools";
import { defaultGiftMessages, processGiftRequest } from "../../../../controllers/helper/giftRequestHelper";
import RazorpayService from "../../../razorpay/razorpay";
import { PaymentCreationAttributes } from "../../../../models/payment";
import { PaymentRepository } from "../../../../repo/paymentsRepo";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";

// Define Enum for Occasion Type
export enum OccasionType {
    BIRTHDAY = "1",
    MEMORIAL = "2",
    GENERAL_GIFT = "3",
}

// Define Recipient Schema
export const RecipientSchema = z.object({
    recipient_name: z.string().describe("Full name of the recipient"),
    recipient_email: z.string().optional().nullable().describe("Optional: email address of the recipient. This will be used to share tree cards and personalised dashboard links to recipient!"),
    recipient_phone: z.string().optional().nullable().describe("Optional contact number of the recipient"),
    trees_count: z.number().default(1).describe("Number of trees to gift"),
});

// Define Main Request Schema
const CreateGiftTreesRequestSchema = z.object({
    recipients_count: z.number(),
    recipients: z.array(RecipientSchema),
    sponsor_name: z.string(),
    sponsor_email: z.string(),
    ocassion_type: z.nativeEnum(OccasionType).default(OccasionType.GENERAL_GIFT),
    ocassion_name: z.string().optional().nullable(),
    gifted_by: z.string().optional().nullable(),
    gifted_on: z.string().optional().nullable(),
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
            let recipientEmail: string | null | undefined = user.recipient_email;
            const recipientPhone: string | null | undefined = user.recipient_phone;

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
                recipients: recipients,
                source: 'WhatsApp'
            }, (images: string[], requestId: number) => {
                console.log(requestId, images)
            })

            const razorpayService = new RazorpayService();
            const qrCode = await razorpayService.generatePaymentQRCode(trees * 1 * 100);

            const paymentRequest: PaymentCreationAttributes = {
                pan_number: null,
                consent: false,
                order_id: null,
                qr_id: qrCode.id,
                amount: trees * 1 * 100,
                created_at: new Date(),
                updated_at: new Date()
            }
            const resp = await PaymentRepository.createPayment(paymentRequest);
            await GiftCardsRepository.updateGiftCardRequests({ payment_id: resp.id }, { id: requestId });

            return JSON.stringify({
                status: 'Success',
                output: `Successfully created gift request. Request Id is ${requestId}.`,
                next_step: {
                    note: 'This must be sent as seperate media image to user using tool and not as hyper link!',
                    payment_request: {
                        rq_code_image_url: qrCode.image_url,
                        image_caption: `You have requested *${trees === 1 ? '1 tree' : `${trees} trees`}* for gifting. Considering *per tree cost of INR 1/-*, your total cost is *INR ${trees * 1}/-*.`
                    }
                }
            });
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardController::quickServeGiftRequest", error);
            throw new Error("Failed to create gift request!")
        }
    }

})

export default createGiftTreesRequestTool