import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/postgreDB';
import { Payment , PaymentAttributes, PaymentCreationAttributes} from '../models/payment'

export class PaymentRepository {

    public static async getPayment(id: number): Promise<Payment | null> {
        const query = `
            SELECT p.*, array_agg(ph.*) as payment_history
            FROM "14trees_2".payments p
            JOIN "14trees_2".payment_history ph ON ph.payment_id = p.id
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
}
