
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface ReferenceAttributes {
    id: number;
    rfr: string;
    c_key: string;
    created_at: Date;
    updated_at: Date;
}

interface ReferenceCreationAttributes
    extends Optional<ReferenceAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({ tableName: 'references' })
class Reference extends Model<ReferenceAttributes, ReferenceCreationAttributes>
    implements ReferenceAttributes {

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
    })
    rfr!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    c_key!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { Reference }
export type { ReferenceAttributes, ReferenceCreationAttributes }