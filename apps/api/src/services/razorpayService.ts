import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { RazorpayResponse } from "schema";

const key_id = process.env.RAZORPAY_KEY_ID || "";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

let instance: Razorpay;
export default function createRazorpayInstance(): Razorpay {
    if (instance) {
        return instance;
    }

    if (!key_id || !key_secret) {
        throw new Error("Razorpay key_id or key_secret not set");
    }
    instance = new Razorpay({
        key_id,
        key_secret,
    });

    return instance;
}

export function verifySignature(payload: RazorpayResponse): boolean {
    return validatePaymentVerification({
        "order_id": payload.razorpay_order_id,
        "payment_id": payload.razorpay_payment_id
    }, payload.razorpay_signature, key_secret);
}

