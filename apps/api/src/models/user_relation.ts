import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface UserRelationAttributes {
    id: number;
    primary_user: number;
    secondary_user: number;
    relation: string;
    created_at: Date;
    updated_at: Date;
}

interface UserRelationCreationAttributes
    extends Optional<UserRelationAttributes, 'id'> { }

@Table({ tableName: 'user_relations' })
class UserRelation extends Model<UserRelationAttributes, UserRelationCreationAttributes>
    implements UserRelationAttributes {

    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({ type: DataType.STRING, allowNull: false })
    primary_user!: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    secondary_user!: number;

    @Column({ type: DataType.STRING, allowNull: false })
    relation!: string;

    @Column(DataType.DATE)
    created_at!: Date;

    @Column(DataType.DATE)
    updated_at!: Date;
}

export { UserRelation }
export type { UserRelationAttributes, UserRelationCreationAttributes }
