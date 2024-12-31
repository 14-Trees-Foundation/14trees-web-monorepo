//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface PaymentAttributes {
  id: number;
  amount: number;
  donor_type: string | null;
  pan_number: string | null;
  consent: boolean;
  order_id: string | null;
  created_at: Date;
  updated_at: Date;  
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'donor_type'> {}

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
    donor_type!: string;

    @Column({ type: DataType.STRING })
    pan_number!: string | null;

    @Column({ type: DataType.STRING })
    order_id!: string | null;

    @Column({ type: DataType.BOOLEAN })
    consent!: boolean;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { Payment }
export type { PaymentAttributes, PaymentCreationAttributes }