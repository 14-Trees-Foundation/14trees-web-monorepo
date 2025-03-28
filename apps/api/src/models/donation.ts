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
}

interface DonationCreationAttributes extends Optional<DonationAttributes, 'id' | 'payment_id' | 'grove_type_other' | 'names_for_plantation' | 'comments'> { }

@Table({ 
    tableName: 'donations',
    timestamps: false, // Add this line to disable timestamps
    schema: '14trees_2' // Add schema
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
  preference_option!: 'Foundation' | 'Public';

  @Column({ 
    type: DataType.TEXT,
    allowNull: true
  })
  grove_type!: 'Visitor\'s grove' | 'Family grove' | 'Memorial grove' | 'Social/professional group grove' | 'School/College alumni grove' | 'Corporate grove' | 'Conference grove' | 'Other';

  @Column({ 
    type: DataType.STRING,
    allowNull: true
  })
  grove_type_other!: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  tree_count!: number;

  @Column({ 
    type: DataType.TEXT,
    allowNull: false
  })
  contribution_options!: 'Planning visit' | 'CSR' | 'Volunteer' | 'Share';

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
}

export { Donation }
export type { DonationAttributes, DonationCreationAttributes }