import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { User } from './user';
import { Optional } from 'sequelize';

interface EventMessageAttributes {
    id: number;
    user_id: number | null,
    user_name: string | null,
    event_id: number,
    message: string,
    created_at: Date;
    updated_at: Date;
}

interface EventMessageCreationAttributes
    extends Optional<EventMessageAttributes, 'id' | 'created_at' | 'updated_at'> { }

@Table({ tableName: 'event_messages' })
export class EventMessage extends Model<EventMessageAttributes, EventMessageCreationAttributes>
    implements EventMessageAttributes {

    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true
    })
    id!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    user_id!: number | null;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    user_name!: string | null;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    event_id!: number;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    message!: string;

    @Column(DataType.DATE)
    created_at!: Date;

    @Column(DataType.DATE)
    updated_at!: Date;
}

export type { EventMessageAttributes, EventMessageCreationAttributes }