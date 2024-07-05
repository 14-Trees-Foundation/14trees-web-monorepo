import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface TreesSnapshotsAttributes {
	id: number;
	sapling_id: string;
	image: string;
	is_active: boolean;
	user_id: number;
    created_at: Date;
}

interface TreesSnapshotsCreationAttributes
	extends Optional<TreesSnapshotsAttributes, 'id'> {}

@Table({ tableName: 'trees_snapshots' })
class TreesSnapshots extends Model<TreesSnapshotsAttributes, TreesSnapshotsCreationAttributes>
implements TreesSnapshotsAttributes {

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

export { TreesSnapshots }
export type { TreesSnapshotsAttributes, TreesSnapshotsCreationAttributes }
