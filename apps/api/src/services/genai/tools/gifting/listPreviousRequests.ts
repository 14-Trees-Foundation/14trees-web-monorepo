import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { UserRepository } from "../../../../repo/userRepo";
import RazorpayService from "../../../razorpay/razorpay";
import { PaymentRepository } from "../../../../repo/paymentsRepo";

// Define Main Request Schema
const ListPreviousRequestsSchema = z.object({
    email_id: z.string().describe("The email address you/sponsor used to make gift trees requests")
});

const description = `
For a given user/Sponsor email list the previous gift trees request
`;

const listGiftTreesRequests = new DynamicStructuredTool({
    name: "list_gift_trees_request",
    description: description,
    schema: ListPreviousRequestsSchema,
    func: async (data): Promise<string> => {
        const Email = data.email_id;
        const offset = 0;
        const limit = 5;

        const userResp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: Email, operatorValue: 'equals' }])
        if (userResp.results.length === 0) {
            return "Didn't found any user which given email!"
        }

        const requests = await GiftCardsRepository.getGiftCardRequests(offset, limit, [{ columnField: 'user_id', value: userResp.results[0].id, operatorValue: 'equals' }]);

        const results: any[] = [];
        for (const request of requests.results) {
            let amountReceived = request.amount_received
            const totalAmount = request.no_of_cards * 1

            if (amountReceived != totalAmount) {
                const razorpayService = new RazorpayService();
                if (request.payment_id) {
                    const payment = await PaymentRepository.getPayment(request.payment_id);
                    if (payment && payment.qr_id) {
                        let amount = 0;
                        const payments = await razorpayService.getPayments(payment.qr_id);
                        payments?.forEach(payment => {
                            amount += Number(payment.amount) / 100
                        })

                        amountReceived = amount
                        await GiftCardsRepository.updateGiftCardRequests({ amount_received: amountReceived }, { id: request.id });
                    }
                }
            }

            const users = await GiftCardsRepository.getGiftRequestUsers(request.id);
            results.push({
                requestId: request.id,
                giftedTrees: request.no_of_cards,
                occasion: request.event_name ? request.event_name : undefined,
                giftedToPeople: users.length <= 2 ? users.map((user: any) => user.recipient_name) : (users[0] as any).recipient_name + ` +${users.length - 1} people`,
                giftedOn: request.created_at,
                paymentStatus: amountReceived != totalAmount ? 'Pending Payment' : 'Completed'
            })
        }

        return JSON.stringify({
            status: "complete",
            data: {
                requests: results,
                totalRequests: requests.total
            },
        });
    }

})

export default listGiftTreesRequests