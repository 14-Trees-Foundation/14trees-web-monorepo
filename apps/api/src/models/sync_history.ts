
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface SyncHistoryAttributes {
    id: number;
    trees: string;
    tree_images: string;
    visit_images: string;
    synced_at: Date;
    upload_time: number | null;
    upload_error: string | null;
    user_id: number,
    created_at?: Date;
    updated_at?: Date;
}

interface SyncHistoryCreationAttributes
    extends Optional<SyncHistoryAttributes, 'id'> {}

@Table({ tableName: 'sync_history' })
class SyncHistory extends Model<SyncHistoryAttributes, SyncHistoryCreationAttributes>
    implements SyncHistoryAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.STRING })
    trees!: string;

    @Column({ type: DataType.STRING })
    tree_images!: string;

    @Column({ type: DataType.STRING })
    visit_images!: string;

    @Column(DataType.DATE)
    synced_at!: Date;

    @Column({ type: DataType.STRING })
    upload_error!: string;

    @Column({ type: DataType.INTEGER })
    upload_time!: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    user_id!: number;

    @Column(DataType.DATE)
    created_at?: Date;

    @Column(DataType.DATE)
    updated_at?: Date;
}

export { SyncHistory }
export type { SyncHistoryAttributes, SyncHistoryCreationAttributes }