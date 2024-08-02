//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: number;
  date_received: string;
  name: string;
  donor_type: string;
  phone: string;
  email_address: string;
  pan: string;
  pledged: string;
  land_type: string;
  zone: string;
  grove: string;
  plantation_land_type: string;
  dashboard_status: string;
  assigned_plot: string;
  tree_planted: string;
  assigner_dashboard: string;
  remarks_for_inventory: string;
  created_at: Date;
  updated_at: Date;  
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'phone' | 'donor_type' | 'land_type' | 'zone' | 'dashboard_status' | 'assigned_plot' | 'tree_planted' | 'assigner_dashboard' | 'remarks_for_inventory' | 'date_received'> {}

@Table({ tableName: 'donations' })
class Donations extends Model<DonationAttributes, DonationCreationAttributes>
implements DonationAttributes {

      @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.STRING, allowNull: true })
    date_received!: string;

    @Column({ type: DataType.STRING, allowNull: true  })
    name!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    phone!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    donor_type!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    email_address!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    pan!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    pledged!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    land_type!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    zone!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    grove!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    plantation_land_type!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    dashboard_status!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    assigned_plot!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    tree_planted!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    assigner_dashboard!: string;

    @Column({ type: DataType.STRING, allowNull: true })
    remarks_for_inventory!: string;

    @Column({ type: DataType.DATE, allowNull: true })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: true })
    updated_at!: Date;
}

export { Donations }
export type { DonationAttributes, DonationCreationAttributes }