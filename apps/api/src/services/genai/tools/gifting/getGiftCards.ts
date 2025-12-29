import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { PaymentRepository } from "../../../../repo/paymentsRepo";
import RazorpayService from "../../../razorpay/razorpay";
import { PaymentCreationAttributes } from "../../../../models/payment";

// Define Main Request Schema
const GetTreeCardsRequestSchema = z.object({
    request_id: z.number()
});

const description = `
Retrieve the list of S3 URLs for tree card images associated with a specific Gift Trees Request.

Use this to:
- Access the personalized tree cards created for each recipient.
- Share or display the tree cards externally.

Requires the GiftTreesRequest ID to fetch the associated images.
`;


const getTreeCards = new DynamicStructuredTool({
    name: "get_tree_cards",
    description: description,
    schema: GetTreeCardsRequestSchema,
    func: async (data): Promise<string> => {
        const requestId = data.request_id;

        // const requestsResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: requestId }])
        // const request = requestsResp.results[0];

        // let amountReceived = request.amount_received
        // const totalAmount = request.no_of_cards * 1

        // let qrCodeUrl = '';
        // if (amountReceived != totalAmount) {
        //     const razorpayService = new RazorpayService();
        //     if (!request.payment_id) {
        //         const qrCode = await razorpayService.generatePaymentQRCode(request.no_of_cards * 1 * 100);
        //         qrCodeUrl = qrCode.image_url

        //         const paymentRequest: PaymentCreationAttributes = {
        //             pan_number: null,
        //             consent: false,
        //             order_id: null,
        //             qr_id: qrCode.id,
        //             amount: request.no_of_cards * 1 * 100,
        //             created_at: new Date(),
        //             updated_at: new Date()
        //         }
        //         const resp = await PaymentRepository.createPayment(paymentRequest);
        //         await GiftCardsRepository.updateGiftCardRequests({ payment_id: resp.id }, { id: requestId });

        //     } else {
        //         const payment = await PaymentRepository.getPayment(request.payment_id);
        //         if (payment && payment.qr_id) {
        //             let amount = 0;

        //             const payments = await razorpayService.getPayments(payment.qr_id);
        //             payments?.forEach(payment => {
        //                 amount += Number(payment.amount) / 100
        //             })

        //             const qrCode = await razorpayService.generatePaymentQRCodeForId(payment.qr_id)
        //             qrCodeUrl = qrCode.image_url;
                    
        //             amountReceived = amount
        //             await GiftCardsRepository.updateGiftCardRequests({ amount_received: amountReceived }, { id: requestId });
        //         }
        //     }
        // }

        // if (amountReceived !== totalAmount) {
        //     return JSON.stringify({
        //         status: 'Pending Payment',
        //         output: `You haven't paid for trees of request Id ${requestId}.`,
        //         next_step: {
        //             note: 'This must be sent as seperate media image to user using tool and not as hyper link!',
        //             payment_request: {
        //                 rq_code_image_url: qrCodeUrl,
        //                 image_caption: `You have requested *${request.no_of_cards === 1 ? '1 tree' : `${request.no_of_cards} trees`}* for gifting. Considering *per tree cost of INR 1/-*, your total cost is *INR ${request.no_of_cards * 1}/-*.`
        //             }
        //         }
        //     });
        // }

        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', value: requestId, operatorValue: 'equals' }]);
        const imageUrls = giftCards.results.map(card => card.card_image_url).filter(imageUrl => imageUrl);

        if (imageUrls.length !== giftCards.results.length) {
            return JSON.stringify({
                status: "incomplete",
                message: "Not all tree cards are generated yet. It may take 15-30mins to generate personalized cards. Please try again after some time.",
                generated_count: imageUrls.length,
                total_count: giftCards.results.length
            });
        }

        return JSON.stringify({
            status: "complete",
            message: "All tree cards have been generated successfully.",
            image_urls: imageUrls
        });
    }

})

export default getTreeCards