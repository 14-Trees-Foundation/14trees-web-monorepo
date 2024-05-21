//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface UserAttributes {
	id: string;
	name: string;
	userid: string;
  phone: number;
  email: string;
  date_added: Date;
  dob: Date;
}

interface UserCreationAttributes
	extends Optional<UserAttributes, 'dob'> {}

@Table({ tableName: 'users' })
class User extends Model<UserAttributes, UserCreationAttributes>
implements UserAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  userid!: string;

  @Column(DataType.INTEGER)
  phone!: number;

  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.DATE)
  dob!: Date;

  @Column(DataType.DATE)
  date_added!: Date;
}

export { User }
export type { UserAttributes, UserCreationAttributes }