import { z } from "zod";
import { DynamicStructuredTool, Tool } from "langchain/tools";
import { defaultGiftMessages, processGiftRequest } from "../../../../controllers/helper/giftRequestHelper";
import RazorpayService from "../../../razorpay/razorpay";
import { PaymentCreationAttributes } from "../../../../models/payment";
import { PaymentRepository } from "../../../../repo/paymentsRepo";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { OccasionType, RecipientSchema } from "./createGiftRequest";
import { parseCsv } from "../../../../helpers/utils";


// Define Main Request Schema
const CreateGiftTreesRequestSchema = z.object({
    recipients_count: z.number().optional().nullable().describe("Only required if csv file is not provided"),
    recipients: z.array(RecipientSchema).optional().nullable().describe("Only required if csv file is not provided"),
    recipients_csv_file: z.object({
        attachmentId: z.string().describe("This will be string attachmentId of email attachment.\nSample csv file attachment which can be sent to user for reference: \n{ filename: 'GiftRecipientDetails.csv', path: 'https://14treesplants.s3.ap-south-1.amazonaws.com/cards/samples/GiftRecipientDetails.csv' }"),
        messageId: z.string().describe("Email message id. required to fetch data of attachment using attachmentId")
    }).optional().nullable().describe("Only required if recipients are not provided. Consider providing csv file when gifting trees to morethan 5 recipients."),
    sponsor_name: z.string(),
    sponsor_email: z.string(),
    sponsor_group: z.string().optional().nullable().describe("Exect name of the corporate who is sponsoring trees. If any"),
    sponsor_logo_file: z.object({
        attachmentId: z.string().describe("This will be string attachmentId of email attachment.\nLogo size will be 183x70 pixels"),
        messageId: z.string().describe("Email message id. required to fetch data of attachment using attachmentId")
    }).optional().nullable().describe("Corporate logo image, which will be displayed on tree cards"),
    ocassion_type: z.nativeEnum(OccasionType).nullable().default(OccasionType.GENERAL_GIFT),
    ocassion_name: z.string().optional().nullable(),
    gifted_by: z.string().optional().nullable().describe("Any spesific name(s) to put on dashboard. Default: sponsor's name. Corporate/Sponsor user"),
    gifted_on: z.string().optional().nullable().describe("Occasion date or the date of gifting. Default: today's date"),
});

const description = `
Create a tree gifting request for someone special.

This tool allows sponsors to:
- Reserve trees for one or more recipients.
- Automatically generate personalized tree cards and dashboards for each recipient.

Upon successful creation, a **Gift Request ID** is returned.
Sponsors can use this ID to view and manage all related gifting details.

Use this tool when the user wants to gift trees to someone.
`;

const createCorporateGiftTreesRequestTool = new DynamicStructuredTool({
    name: "create_corporate_gift_trees_request",
    description: description,
    schema: CreateGiftTreesRequestSchema,
    func: async (data): Promise<String> => {

        console.log(JSON.stringify(data, null, 2))

        const { trees, recipients } = await getRecipientsData(data);
        if (trees <= 0 || recipients.length === 0) {
            return "Warning: Recipient details are not provided. Also didn't found recipients details in csv file!"
        }

        let logoData: string | undefined = undefined
        // if (data.sponsor_logo_file) {
        //     const logoBuffer = await getAttachmentData(data.sponsor_logo_file.messageId, data.sponsor_logo_file.attachmentId)
        //     if (logoBuffer) logoData = logoBuffer.toString('base64');
        // }

        try {
            const { requestId } = await processGiftRequest({
                treesCount: trees,
                sponsorEmail: data.sponsor_email,
                sponsorName: data.sponsor_name,
                groupName: data.sponsor_group,
                groupLogo: logoData,
                eventName: data.ocassion_name,
                eventType: data.ocassion_type,
                giftedBy: data.gifted_by ? data.gifted_by : data.sponsor_name,
                giftedOn: data.gifted_on ? data.gifted_on : new Date().toISOString().slice(0, 10),
                primaryMessage: data.ocassion_type === '1' ? defaultGiftMessages.birthday : data.ocassion_type === '2' ? defaultGiftMessages.memorial : defaultGiftMessages.primary,
                secondaryMessage: defaultGiftMessages.secondary,
                recipients: recipients,
                source: 'Email'
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

            return "Gift request create"
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardController::quickServeGiftRequest", error);
            throw new Error("Failed to create gift request!")
        }
    }

})

async function getRecipientsData(payload: (typeof CreateGiftTreesRequestSchema._type)) {
    let trees = 0;
    let recipients: any[] = [];

    const recipientNameField = 'Recipient Name'
    const recipientEmailField = 'Recipient Email'
    const recipientCommEmailField = 'Recipient Communication Email (optional)'
    const recipientPhoneField = 'Recipient Phone (optional)'
    const assigneeNameField = 'Assignee Name'
    const assigneeEmailField = 'Assignee Email (optional)'
    const assigneeCommEmailField = 'Assignee Communication Email (optional)'
    const assigneePhoneField = 'Assignee Phone (optional)'
    const countField = 'Number of trees to assign'
    const imageNameField = 'Image Name (optional)'

    if (payload.recipients_csv_file) {
        const { messageId, attachmentId } = payload.recipients_csv_file
        // const data = await getAttachmentData(messageId, attachmentId);
        const data = null;
        if (data) {
            const csvData = await parseCsv(data);

            for (let i = 0; i < csvData.length; i++) {
                const user = csvData[i];
                if (user[recipientNameField]) {
                    const parsedUser = {
                        recipientName: (user[recipientNameField] as string).trim(),
                        recipientPhone: (user[recipientPhoneField] as string).trim(),
                        recipientEmail: (user[recipientEmailField] as string).trim(),
                        recipientCommEmail: (user[recipientCommEmailField] as string).trim(),
                        assigneeName: (user[assigneeNameField] as string).trim(),
                        assigneePhone: (user[assigneePhoneField] as string).trim(),
                        assigneeEmail: (user[assigneeEmailField] as string).trim(),
                        assigneeCommEmail: (user[assigneeCommEmailField] as string).trim(),
                        image_name: user[imageNameField] ? user[imageNameField] : undefined,
                        relation: user['Relation with person'] ? user['Relation with person'] : undefined,
                        treesCount: Number(user[countField]) ? Number(user[countField]) : 1,
                    };

                    if (!(user[assigneeNameField] as string).trim()) {
                        parsedUser.assigneeName = parsedUser.recipientName
                        parsedUser.assigneePhone = parsedUser.recipientPhone
                        parsedUser.assigneeEmail = parsedUser.recipientEmail
                        parsedUser.assigneeCommEmail = parsedUser.recipientCommEmail
                    }

                    if (!parsedUser.recipientEmail) parsedUser.recipientEmail = parsedUser.recipientName.split(" ").join('.') + "@14trees"
                    if (!parsedUser.assigneeEmail) parsedUser.assigneeEmail = parsedUser.assigneeName.split(" ").join('.') + "@14trees"
                    
                    recipients.push(parsedUser);
                    trees += Number(parsedUser.treesCount)
                }
            }
        }
    } else if (payload.recipients && payload.recipients.length !== 0) {
        for (const user of payload.recipients) {
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
    }

    return { trees, recipients }
}

export default createCorporateGiftTreesRequestTool