import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

class RazorpayService {
    razorpay: Razorpay
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }

    verifySignature(orderId: string, paymentId: string, signature: string) {
        return validatePaymentVerification({
            "order_id": orderId,
            "payment_id": paymentId,
        }, signature, process.env.RAZORPAY_KEY_SECRET || '');
    }

    async createOrder(amount: number, notes?: Record<string, string>) {
        try {
            const options: Orders.RazorpayOrderCreateRequestBody = {
                amount: amount * 100,
                currency: "INR",
                notes: notes,
            };

            const order = await this.razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.log("[ERROR] RazorpayService.createOrder: ", error);
        }
    }

    async getPayments(orderId: string) {
        try {
            const payments = await this.razorpay.orders.fetchPayments(orderId);
            return payments.items;
        } catch (error) {
            console.log("[ERROR] RazorpayService.getPayments: ", error);
        }
    }
}

export default RazorpayService;