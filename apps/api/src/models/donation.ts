//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: number;
  user_id: number;
  category: 'Public' | 'Foundation';
  grove: string | null;
  pledged: number;
  user_visit: boolean,
  donor_type: "Foreign Donor" | "Indian Citizen";
  payment_method: string;
  payment_proof: string | null;
  payment_received_date: Date | null;
  pan_number: string | null;
  feedback: string | null;
  remarks_for_inventory: string | null;
  associated_tag: string;
  created_at: Date;
  updated_at: Date;  
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'donor_type' | 'payment_method' | 'remarks_for_inventory' | 'feedback' | 'associated_tag'> {}

@Table({ tableName: 'donations' })
class Donation extends Model<DonationAttributes, DonationCreationAttributes>
implements DonationAttributes {

      @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.INTEGER  })
    user_id!: number;

    @Column({ type: DataType.STRING })
    category!: 'Public' | 'Foundation';

    @Column({ type: DataType.STRING })
    grove!: string;

    @Column({ type: DataType.INTEGER })
    pledged!: number;

    @Column({ type: DataType.BOOLEAN })
    user_visit!: boolean;

    @Column({ type: DataType.STRING })
    donor_type!: "Foreign Donor" | "Indian Citizen";

    @Column({ type: DataType.STRING })
    payment_method!: string;

    @Column({ type: DataType.STRING })
    payment_proof!: string | null;

    @Column({ type: DataType.DATE })
    payment_received_date!: Date | null;

    @Column({ type: DataType.STRING })
    pan_number!: string | null;

    @Column({ type: DataType.TEXT })
    feedback!: string | null;

    @Column({ type: DataType.TEXT })
    remarks_for_inventory!: string | null;

    @Column({ type: DataType.STRING })
    associated_tag!: string;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }