import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { User } from './user';
import { Optional } from 'sequelize';

type EventLocation = 'onsite' | 'offsite'

interface EventAttributes {
	id: number;
  assigned_by: number;
  site_id: number;
  name: string;
	type: number;
  description?: string;
	tags?: string[];
  event_date: Date;
  memories?: string[];
  event_location: EventLocation;
}

interface EventCreationAttributes
	extends Optional<EventAttributes, 'tags' | 'memories' | 'description' | 'id'> {}

@Table({ tableName: 'events' })
export class Event extends Model<EventAttributes, EventCreationAttributes>
implements EventAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  assigned_by!: number;

  @Column(DataType.NUMBER)
  site_id!: number;

  @Column(DataType.NUMBER)
  type!: number;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  event_location!: EventLocation;

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  memories?: string[];

  @Column(DataType.DATE)
  event_date!: Date;
}

export type {EventAttributes, EventCreationAttributes}