//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface PaymentHistoryAttributes {
  id: number;
  payment_id: number;
  amount: number;
  payment_method: string;
  payment_proof: string | null;
  payment_received_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;  
}

interface PaymentHistoryCreationAttributes extends Optional<PaymentHistoryAttributes, 'id' | 'payment_proof'> {}

@Table({ tableName: 'payment_history' })
class PaymentHistory extends Model<PaymentHistoryAttributes, PaymentHistoryCreationAttributes>
implements PaymentHistoryAttributes {

      @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.INTEGER  })
    payment_id!: number;

    @Column({ type: DataType.INTEGER  })
    amount!: number;

    @Column({ type: DataType.STRING })
    payment_method!: string;

    @Column({ type: DataType.DATE })
    payment_received_date!: Date;

    @Column({ type: DataType.STRING })
    payment_proof!: string | null;

    @Column({ type: DataType.STRING })
    status!: string;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { PaymentHistory }
export type { PaymentHistoryAttributes, PaymentHistoryCreationAttributes }