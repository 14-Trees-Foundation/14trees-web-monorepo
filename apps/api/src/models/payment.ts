//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface PaymentAttributes {
  id: number;
  amount: number;
  payment_method: string;
  payment_proof: string | null;
  payment_received_date: Date | null;
  pan_number: string | null;
  created_at: Date;
  updated_at: Date;  
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'payment_method' | 'payment_proof' | 'payment_received_date'> {}

@Table({ tableName: 'payments' })
class Payment extends Model<PaymentAttributes, PaymentCreationAttributes>
implements PaymentAttributes {

      @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.INTEGER  })
    amount!: number;

    @Column({ type: DataType.STRING })
    payment_method!: string;

    @Column({ type: DataType.STRING })
    payment_proof!: string | null;

    @Column({ type: DataType.DATE })
    payment_received_date!: Date | null;

    @Column({ type: DataType.STRING })
    pan_number!: string | null;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { Payment }
export type { PaymentAttributes, PaymentCreationAttributes }