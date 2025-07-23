import { PaymentCreationAttributes } from "../models/payment";
import { PaymentRepository } from "../repo/paymentsRepo";
import RazorpayService from "../services/razorpay/razorpay";

class PaymentService {

    public static async createPayment(
        amount: number,
        donorType?: string,
        panNUmber?: string,
        consent?: boolean,
        notes?: Record<string, string | number>,
    ) {

        let orderId: string | null = null;
        const razorpayService = new RazorpayService();
        if (amount <= 500000) {
            const order = await razorpayService.createOrder(amount, notes).catch((error) => {
                console.log("[ERROR] PaymentService.createPayment: ", error);
            });

            if (!order) {
                throw new Error("Failed to create order with Razorpay");
            }

            orderId = order.id;
        }

        const request: PaymentCreationAttributes = {
            amount: amount,
            donor_type: donorType || null,
            pan_number: panNUmber || null,
            order_id: orderId,
            consent: consent || false,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await PaymentRepository.createPayment(request).catch((error) => {
            console.log("[ERROR] PaymentService.createPayment: ", error);
        });

        if (!result) throw new Error("Failed to create payment record");

        return result;
    }
}

export default PaymentService;