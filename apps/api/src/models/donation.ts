//Model in postgresql db
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: number;
  user_id: number;
  payment_id: number | null;
  preference_option: 'Foundation' | 'Public';
  grove_type: 'Visitor\'s grove' | 'Family grove' | 'Memorial grove' | 'Social/professional group grove' | 'School/College alumni grove' | 'Corporate grove' | 'Conference grove' | 'Other';
  grove_type_other: string | null;
  tree_count: number;
  contribution_options: 'Planning visit' | 'CSR' | 'Volunteer' | 'Share';
  names_for_plantation: string | null;
  comments: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'payment_id' | 'grove_type_other' | 'names_for_plantation' | 'comments' | 'created_at' | 'updated_at'> { }

@Table({ tableName: 'donations' })
class Donation extends Model<DonationAttributes, DonationCreationAttributes>
  implements DonationAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.INTEGER })
  user_id!: number;

  @Column({ type: DataType.INTEGER })
  payment_id!: number | null;

  @Column({ type: DataType.ENUM('Foundation', 'Public') })
  preference_option!: 'Public' | 'Foundation';

  @Column({ type:  DataType.ENUM('Visitor\'s grove','Family grove',
'Memorial grove','Social/professional group grove','School/College alumni grove','Corporate grove','Conference grove','Other'), })
grove_type!: 'Visitor\'s grove' | 'Family grove' | 'Memorial grove' | 'Social/professional group grove' | 'School/College alumni grove' | 'Corporate grove' | 'Conference grove' | 'Other';

  @Column({ type: DataType.STRING(255) })
  grove_type_other!: string | null;

  @Column({type: DataType.INTEGER})
  tree_count!: number;

  @Column({ type: DataType.ENUM('Planning visit', 'CSR', 'Volunteer', 'Share') })
  contribution_options!: 'Planning visit' | 'CSR' | 'Volunteer' | 'Share';

  @Column({  type: DataType.STRING(250) })
  names_for_plantation!: string | null;

  @Column({  type: DataType.STRING(250) })
  comments!: string | null;

  @Column({ type: DataType.DATE })
  created_at!: Date;

  @Column({ type: DataType.DATE })
  updated_at!: Date;
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }