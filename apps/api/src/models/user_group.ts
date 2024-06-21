import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface UserGroupAttributes {
	user_id: number;
	group_id: number;
	created_at: Date;
}

interface UserGroupCreationAttributes
	extends UserGroupAttributes {}

@Table({ tableName: 'user_groups' })
class UserGroup extends Model<UserGroupAttributes, UserGroupCreationAttributes>
implements UserGroupAttributes {

  @Column({
    type: DataType.NUMBER,
    primaryKey: true,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.NUMBER,
    primaryKey: true,
    allowNull: false,
  })
  group_id!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;
}

export { UserGroup }
export type { UserGroupAttributes, UserGroupCreationAttributes }