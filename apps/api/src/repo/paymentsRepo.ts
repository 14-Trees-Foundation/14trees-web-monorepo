import { Payment , PaymentAttributes, PaymentCreationAttributes} from '../models/payment'

export class PaymentRepository {

    public static async getPayment(id: number): Promise<Payment | null> {
        return await Payment.findByPk(id);
    }

    public static async createPayment(paymentData: PaymentCreationAttributes ): Promise<Payment> {
        const payment = Payment.create(paymentData);
        return payment;
    }

    public static async deletePayment(paymentId: number): Promise<number>{
        const result = await Payment.destroy({ where : {id : paymentId} });
        return result;
    }

    public static async updatePayment(paymentData: PaymentAttributes): Promise<Payment>{  
        const payment = await Payment.findByPk(paymentData.id);
        if (!payment) {
            throw new Error('Payment not found for given id');
        }

        const updatedPayment = await payment.update(paymentData);
        return updatedPayment;
    }
}
