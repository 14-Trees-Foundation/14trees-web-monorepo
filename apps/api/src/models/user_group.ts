import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface UserGroupAttributes {
	user_id: number;
	group_id: number;
	created_at: Date;
    updated_at: Date;
}

interface UserGroupCreationAttributes
	extends Optional<UserGroupAttributes, 'updated_at' > {}

@Table({ tableName: 'user_groups' })
class UserGroup extends Model<UserGroupAttributes, UserGroupCreationAttributes>
implements UserGroupAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
  })
  group_id!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updated_at!: Date;
}

export { UserGroup }
export type { UserGroupAttributes, UserGroupCreationAttributes }