// Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType, AllowNull, Unique } from 'sequelize-typescript';

interface OnsiteStaffAttributes {
	id: string;
	name: string;
	user_id: string;
  phone?: number;
  email: string;
  image?: string;
  role?: string;
  permissions?: string[];
  date_added: Date;
  dob?: Date;
}

interface OnsiteStaffCreationAttributes
	extends Optional<OnsiteStaffAttributes, 'dob' | 'role' | 'permissions' | 'image'> {}

@Table({ tableName: 'onsitestaffs' })
class OnsiteStaff extends Model<OnsiteStaffAttributes, OnsiteStaffCreationAttributes>
implements OnsiteStaffAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  user_id!: string;

  @Column(DataType.BIGINT)
  phone!: number;

  @Column(DataType.STRING)
  image!: string;

  @Unique
  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.STRING)
  role!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  permissions!: string[];

  @Column(DataType.DATE)
  dob!: Date;

  @Column(DataType.DATE)
  date_added!: Date;
}

export { OnsiteStaff }
export type { OnsiteStaffAttributes, OnsiteStaffCreationAttributes }

