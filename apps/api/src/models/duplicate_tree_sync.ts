import { Table, Model, Column, DataType, AutoIncrement, PrimaryKey } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DuplicateTreeSyncAttributes {
	id: number;
	sapling_id: string;
	plot_id: number;
	tree_id: number;
	synced_by: number;
	synced_at: Date;
}

interface DuplicateTreeSyncCreationAttributes 
    extends Optional<DuplicateTreeSyncAttributes, 'id' | 'synced_at'> { }

@Table({
    tableName: 'duplicate_trees_sync',
    timestamps: false,
})
class DuplicateTreeSync extends Model<DuplicateTreeSyncAttributes, DuplicateTreeSyncCreationAttributes>
    implements DuplicateTreeSyncAttributes {
    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    sapling_id!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    plot_id!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    tree_id!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    synced_by!: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    synced_at!: Date;
    
}

export default DuplicateTreeSync;
export type { DuplicateTreeSyncAttributes, DuplicateTreeSyncCreationAttributes }