import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface TreesSnapshotAttributes {
	id: number;
	sapling_id: string;
	image: string;
	is_active: boolean;
	user_id: number;
    created_at: Date;
}

interface TreesSnapshotCreationAttributes
	extends Optional<TreesSnapshotAttributes, 'id'> {}

@Table({ tableName: 'trees_snapshots' })
class TreesSnapshot extends Model<TreesSnapshotAttributes, TreesSnapshotCreationAttributes>
implements TreesSnapshotAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  sapling_id!: string;

  @Column({ type: DataType.STRING })
  image!: string;

  @Column({ type: DataType.BOOLEAN })
  is_active!: boolean;

  @Column({ type: DataType.DATE })
  created_at!: Date;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

}

export { TreesSnapshot }
export type { TreesSnapshotAttributes, TreesSnapshotCreationAttributes }
