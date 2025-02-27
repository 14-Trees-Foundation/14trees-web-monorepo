
import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface ViewAttributes {
    id: number;
    view_id: string;
    name: string;
    path: string;
    metadata: any;
    created_at: Date;
    updated_at: Date;
}

interface ViewPermissionAttributes {
    id: number;
    view_id: number;
    user_id: number;
    created_at: Date;
    updated_at: Date;
}

interface ViewCreationAttributes extends Optional<ViewAttributes, 'id'> { }
interface ViewPermissionCreationAttributes extends Optional<ViewPermissionAttributes, 'id'> { }

@Table({ tableName: 'views' })
class View extends Model<ViewAttributes, ViewCreationAttributes>
    implements ViewAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    view_id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    path!: string;

    @Column({
        type: DataType.JSONB,
    })
    metadata!: any;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

@Table({ tableName: 'view_permissions' })
class ViewPermission extends Model<ViewPermissionAttributes, ViewPermissionCreationAttributes>
    implements ViewPermissionAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    view_id!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    user_id!: number;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;
}

export { View, ViewPermission }
export type { ViewAttributes, ViewCreationAttributes, ViewPermissionAttributes, ViewPermissionCreationAttributes }