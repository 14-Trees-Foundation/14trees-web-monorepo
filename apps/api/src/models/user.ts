//Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface UserAttributes {
	id: number;
	name: string;
	user_id: string;
  phone: string;
  email: string;
  birth_date?: Date;
}

interface UserCreationAttributes
	extends Optional<UserAttributes, 'birth_date'> {}

@Table({ tableName: 'users' })
class User extends Model<UserAttributes, UserCreationAttributes>
implements UserAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  user_id!: string;

  @Column(DataType.STRING)
  phone!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.DATE)
  birth_date?: Date;
}

export { User }
export type { UserAttributes, UserCreationAttributes }