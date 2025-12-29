//Model in postgresDB
import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../models/user';
import { Tree } from '../models/tree';
import { Org } from '../models/org';
import { Optional } from 'sequelize';

interface UserTreeAttributes {
	id: string;
	tree: Tree;
	user: User;
  orgid: string;
  donated_by: string;
  profile_image: string[];
  gifted_by: string;
  planted_by: string;
  memories: string[];
  plantation_type: string;
  date_added: Date;
}

interface UserTreeCreationAttributes
	extends Optional<UserTreeAttributes, 'memories' | 'planted_by' | 'gifted_by' | 'profile_image'> {}

@Table({ tableName: 'user_tree_regs' })
class UserTree extends Model<UserTreeAttributes, UserTreeCreationAttributes>
implements UserTreeAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @ForeignKey(() => Tree)
  @Column
  tree_id!: number;

  @BelongsTo(() => Tree)
  tree!: Tree;

  @ForeignKey(() => User)
  @Column
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Org)
  @Column
  orgid!: string;

  @BelongsTo(() => Org)
  organization!: Org;

  @ForeignKey(() => User)
  @Column
  donated_by!: string;

  @BelongsTo(() => User, 'donated_by')
  donatedBy!: User;

  @Column(DataType.ARRAY(DataType.STRING))
  profile_image!: string[];

  @Column(DataType.STRING)
  gifted_by!: string;

  @Column(DataType.STRING)
  planted_by!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  memories!: string[];

  @Column(DataType.STRING)
  plantation_type!: string;

  @Column(DataType.DATE)
  date_added!: Date;
}

export { UserTree }
export type { UserTreeAttributes,  UserTreeCreationAttributes }