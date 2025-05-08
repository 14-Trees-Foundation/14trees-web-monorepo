//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { LandCategory } from './common';

export type ContributionOption = 'Planning visit' | 'CSR' | 'Volunteer' | 'Share';
export const ContributionOption_VISIT: ContributionOption = 'Planning visit';
export const ContributionOption_CSR: ContributionOption = 'CSR';
export const ContributionOption_VOLUNTEER: ContributionOption = 'Volunteer';
export const ContributionOption_SHARE: ContributionOption = 'Share';


interface DonationAttributes {
  id: number;
  user_id: number;
  payment_id: number | null;
  category: LandCategory;
  grove: string;
  grove_type_other: string | null;
  trees_count: number;
  pledged_area_acres: number| null;
  contribution_options: ContributionOption[] | null;
  names_for_plantation: string | null;
  comments: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  tags: string[] | null;
  notes: string | null;
  album_id: number | null;
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'payment_id' | 'grove_type_other' | 'names_for_plantation' | 'comments' | 'created_at' | 'updated_at' | 'tags' | 'notes' | 'album_id'> { }

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
    type: DataType.STRING,
    allowNull: true
  })
  notes!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  album_id!: number | null;
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }