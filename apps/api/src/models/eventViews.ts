import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { Event } from './events';

interface EventViewAttributes {
  id: number;
  event_id: number;
  visitor_id: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: Date;
}

interface EventViewCreationAttributes extends Omit<EventViewAttributes, 'id' | 'viewed_at'> {}

@Table({ tableName: 'event_views', timestamps: false })
export class EventView extends Model<EventViewAttributes, EventViewCreationAttributes> implements EventViewAttributes {

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @ForeignKey(() => Event)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  event_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  visitor_id!: string;

  @Column({
    type: DataType.STRING(45),
    allowNull: true
  })
  ip_address?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  user_agent?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW
  })
  viewed_at!: Date;
}

export type { EventViewAttributes, EventViewCreationAttributes };
