import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import { Payments } from "razorpay/dist/types/payments";
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

    async getPayments(id: string) {
        try {
            let result: Payments.RazorpayPayment[] = []
            if (id.startsWith("qr")) {
                const payments = await this.razorpay.qrCode.fetchAllPayments(id);
                result = payments.items;
            } else if (id.startsWith("order")) {
                const payments = await this.razorpay.orders.fetchPayments(id);
                result = payments.items;
            }

            return result;
        } catch (error) {
            console.log("[ERROR] RazorpayService.getPayments: ", error);
        }
    }

    async generatePaymentQRCode(amount: number) {
        try {
            const qrResp = await this.razorpay.qrCode.create({
                type: 'upi_qr',
                usage: 'single_use',
                fixed_amount: true,
                payment_amount: amount,
            })

            return qrResp;
        } catch (error) {
            console.log("[ERROR] RazorpayService.generatePaymentQRCode: ", error);
            throw error;
        }
    }

    async generatePaymentQRCodeForId(qrId: string) {
        try {
            const qrResp = await this.razorpay.qrCode.fetch(qrId)
            return qrResp;
        } catch (error) {
            console.log("[ERROR] RazorpayService.generatePaymentQRCodeForId: ", error);
            throw error;
        }
    }

}

export default RazorpayService;