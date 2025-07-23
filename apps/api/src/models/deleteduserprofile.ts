//Model in postgresql db

import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { Tree } from './tree';
import { User } from './user';
import { Org } from './org';
import { Optional } from 'sequelize';

interface DeletedProfileUserTreeAttributes {
    id: string;
    treeId: string;
    userId: string;
    orgId: string;
    donatedById: string;
    profileImage: string[];
    giftedBy: string;
    plantedBy: string;
    memories: string[];
    plantationType: string;
    dateAdded: Date;
    dateDeleted: Date;
}

interface DeletedProfileUserTreeCreationAttributes
	extends Optional<DeletedProfileUserTreeAttributes, 'memories'> {}

@Table({ tableName: 'deleted_user_tree_reg' })
class DeletedProfileUserTree extends Model<DeletedProfileUserTreeAttributes, DeletedProfileUserTreeCreationAttributes>
implements DeletedProfileUserTreeAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @ForeignKey(() => Tree)
  @Column(DataType.STRING)
  treeId!: string;

  @ForeignKey(() => User)
  @Column(DataType.STRING)
  userId!: string;

  @ForeignKey(() => Org)
  @Column(DataType.STRING)
  orgId!: string;

  @ForeignKey(() => User)
  @Column(DataType.STRING)
  donatedById!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  profileImage!: string[];

  @Column(DataType.STRING)
  giftedBy!: string;

  @Column(DataType.STRING)
  plantedBy!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  memories!: string[];

  @Column(DataType.STRING)
  plantationType!: string;

  @Column(DataType.DATE)
  dateAdded!: Date;

  @Column(DataType.DATE)
  dateDeleted!: Date;

  @BelongsTo(() => Tree)
  tree!: Tree;

  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Org)
  organization!: Org;

  @BelongsTo(() => User, { foreignKey: 'donatedById' })
  donatedBy!: User;
}

export { DeletedProfileUserTree }
export type { DeletedProfileUserTreeAttributes, DeletedProfileUserTreeCreationAttributes }