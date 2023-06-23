import { RazorpayResponse } from 'schema';
import createRazorpayInstance from './razorpayService';
import { Orders } from 'razorpay/dist/types/orders';

type PaymentOrderParams = {
    orderId?: string,
    trees: number,
    currency?: string,
}

export async function getPaymentOrder(orderData: PaymentOrderParams): Promise<Orders.RazorpayOrder> {
    const instance = createRazorpayInstance()
    if (orderData.orderId) {
        try {
            return await instance.orders.fetch(orderData.orderId)
        } catch (error) {
            // Handle the error appropriately
            throw error;
        }
    }

    if (orderData.trees <= 0) {
        // Handle invalid amount
        throw new Error("Invalid amount");
    }

    let options = {
        // amount is in smallest currency unit (paise for INR)
        amount: orderData.trees * 300000,
        currency: "INR",
        // notes are used to track/filter orders in Razorpay dashboard
        notes: { trees: orderData.trees, source: '14trees-web' }
    };

    try {
        return await instance.orders.create(options);
    } catch (error) {
        // Handle the error appropriately
        throw error;
    }
}
