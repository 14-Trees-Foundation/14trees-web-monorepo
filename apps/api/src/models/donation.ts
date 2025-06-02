//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { LandCategory } from './common';

export type ContributionOption = 'Planning visit' | 'CSR' | 'Volunteer' | 'Share';
export type DonationType = 'adopt' | 'donate';
export type DonationMethod = 'trees' | 'amount';
export const ContributionOption_VISIT: ContributionOption = 'Planning visit';
export const ContributionOption_CSR: ContributionOption = 'CSR';
export const ContributionOption_VOLUNTEER: ContributionOption = 'Volunteer';
export const ContributionOption_SHARE: ContributionOption = 'Share';

export type DonationStatus = 'UserSubmitted' | 'OrderFulfilled';
export const DonationStatus_UserSubmitted: DonationStatus = 'UserSubmitted';
export const DonationStatus_OrderFulfilled: DonationStatus = 'OrderFulfilled';

export type DonationMailStatus = 'AckSent' | 'DashboardsSent' | 'BackOffice' | 'Accounts' | 'Volunteer' | 'CSR';
export const DonationMailStatus_AckSent: DonationMailStatus = 'AckSent';
export const DonationMailStatus_DashboardsSent: DonationMailStatus = 'DashboardsSent';
export const DonationMailStatus_BackOffice: DonationMailStatus = 'BackOffice';
export const DonationMailStatus_Accounts: DonationMailStatus = 'Accounts';
export const DonationMailStatus_Volunteer: DonationMailStatus = 'Volunteer';
export const DonationMailStatus_CSR: DonationMailStatus = 'CSR';

interface DonationAttributes {
  id: number;
  user_id: number;
  payment_id: number | null;
  category: LandCategory;
  grove: string;
  grove_type_other: string | null;
  trees_count: number;
  pledged_area_acres: number | null;
  contribution_options: ContributionOption[] | null;
  names_for_plantation: string | null;
  comments: string | null;
  created_by: number;
  amount_donated: number | null;
  visit_date: Date | null;
  created_at: Date;
  updated_at: Date;
  tags: string[] | null;
  donation_type: DonationType;
  donation_method: DonationMethod | null;
  status: DonationStatus;
  mail_status: DonationMailStatus[] | null;
  mail_error: string | null;
  processed_by: number | null;
  rfr_id: number | null;
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'payment_id' | 'grove_type_other' | 'names_for_plantation' | 'comments' | 'created_at' | 'updated_at' | 'tags' | 'amount_donated' | 'visit_date' | 'donation_method' | 'status' | 'mail_error' | 'mail_status' | 'processed_by' | 'rfr_id'> { }

@Table({
  tableName: 'donations',
  timestamps: false,
})
class Donation extends Model<DonationAttributes, DonationCreationAttributes>
  implements DonationAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  user_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  payment_id!: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  category!: LandCategory;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  grove!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  grove_type_other!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  trees_count!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  pledged_area_acres!: number | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false
  })
  contribution_options!: ContributionOption[] | null;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  names_for_plantation!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  comments!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  created_by!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  rfr_id!: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  updated_at!: Date;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true
  })
  tags!: string[] | null;

  @Column({
    type: DataType.ENUM('adopt', 'donate'),
    allowNull: false
  })
  donation_type!: DonationType;

  @Column({
    type: DataType.ENUM('trees', 'amount'),
    allowNull: true
  })
  donation_method!: DonationMethod | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true
  })
  amount_donated!: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  visit_date!: Date | null;

  @Column({
    type: DataType.ENUM('UserSubmitted', 'OrderFulfilled'),
    allowNull: false,
    defaultValue: DonationStatus_UserSubmitted,
  })
  status!: DonationStatus;

  @Column({
    type: DataType.ARRAY(DataType.ENUM('AckSent', 'DashboardsSent', 'BackOffice', 'Accounts', 'Volunteer', 'CSR')),
    allowNull: true
  })
  mail_status!: DonationMailStatus[] | null;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  mail_error!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'ID of backoffice user who processed this donation'
  })
  processed_by!: number | null;

}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }