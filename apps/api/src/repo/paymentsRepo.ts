import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Payment , PaymentAttributes, PaymentCreationAttributes} from '../models/payment'
import { PaymentHistory, PaymentHistoryCreationAttributes } from '../models/payment_history';

export class PaymentRepository {

    public static async getPayment(id: number): Promise<Payment | null> {
        const query = `
            SELECT p.*, COALESCE(json_agg(ph) FILTER (WHERE ph.id IS NOT NULL), '[]') AS payment_history
            FROM "14trees".payments p
            LEFT JOIN "14trees".payment_history ph ON ph.payment_id = p.id
            WHERE p.id = :id
            GROUP BY p.id;
        `

        const payments: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { id }
        })

        return payments.length > 0 ? payments[0] : null;
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

    public static async createPaymentHistory(paymentHistoryData: PaymentHistoryCreationAttributes): Promise<any> {
        return PaymentHistory.create(paymentHistoryData);
    }

    public static async getPaymentHistory(paymentHistoryId: number): Promise<PaymentHistory | null> {
        return PaymentHistory.findOne({ where: { id: paymentHistoryId } });
    }
}
