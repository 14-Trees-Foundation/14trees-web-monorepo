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
  status?: string;
  status_message?: string[];
  last_system_updated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes
	extends Optional<UserAttributes, 'birth_date' | 'id'> {}

@Table({ tableName: 'users' })
class User extends Model<UserAttributes, UserCreationAttributes>
implements UserAttributes {

  @Column({
    type: DataType.NUMBER,
    autoIncrement: true,
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

  @Column(DataType.ENUM('system_invalidated', 'user_validated'))
  status?: string;

  @Column(DataType.ARRAY(DataType.STRING))
  status_message?: string[];

  @Column(DataType.DATE)
  last_system_updated_at?: Date;

  @Column(DataType.DATE)
  created_at?: Date;

  @Column(DataType.DATE)
  updated_at?: Date;
}

export { User }
export type { UserAttributes, UserCreationAttributes }