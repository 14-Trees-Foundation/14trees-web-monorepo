import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Payment , PaymentAttributes, PaymentCreationAttributes} from '../models/payment'
import { PaymentHistory, PaymentHistoryCreationAttributes } from '../models/payment_history';
import { getSchema } from '../helpers/utils';

export class PaymentRepository {

    public static async getPayment(id: number): Promise<Payment | null> {
        const query = `
            SELECT p.*, COALESCE(json_agg(ph) FILTER (WHERE ph.id IS NOT NULL), '[]') AS payment_history
            FROM "${getSchema()}".payments p
            LEFT JOIN "${getSchema()}".payment_history ph ON ph.payment_id = p.id
            WHERE p.id = :id
            GROUP BY p.id;
        `

        const payments: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { id }
        })

        return payments.length > 0 ? payments[0] : null;
    }

    public static async getPaymentsByIds(ids: number[]): Promise<Map<number, Payment>> {
        if (ids.length === 0) {
            return new Map();
        }

        const query = `
            SELECT p.*, COALESCE(json_agg(ph) FILTER (WHERE ph.id IS NOT NULL), '[]') AS payment_history
            FROM "${getSchema()}".payments p
            LEFT JOIN "${getSchema()}".payment_history ph ON ph.payment_id = p.id
            WHERE p.id IN (:ids)
            GROUP BY p.id;
        `

        const payments: any[] = await sequelize.query(query, {
            type: QueryTypes.SELECT,
            replacements: { ids }
        })

        const paymentMap = new Map<number, Payment>();
        payments.forEach(payment => {
            paymentMap.set(payment.id, payment);
        });

        return paymentMap;
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
        paymentData.donor_type = paymentData.donor_type || null;
        paymentData.pan_number = paymentData.pan_number || null;
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
