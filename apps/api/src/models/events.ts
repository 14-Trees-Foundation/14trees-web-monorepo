import { Table, Column, Model, ForeignKey, DataType } from 'sequelize-typescript';
import { User } from './user';
import { Optional } from 'sequelize';

type EventLocation = 'onsite' | 'offsite'
type ThemeColor = 'yellow' | 'red' | 'green' | 'blue' | 'pink'

interface LocationCoordinate {
  lat: number;
  lng: number;
  address?: string;
}

interface EventAttributes {
	id: number;
  assigned_by: number;
  site_id: number | null;
  name: string;
	type: number;
  description?: string;
	tags?: string[];
  event_date: Date;
  memories?: string[];
  images: string[] | null;
  message: string | null;
  event_location: EventLocation;  // Keep as string: 'onsite' or 'offsite'
  // Optional detailed single-point location
  location?: LocationCoordinate | null;
  theme_color?: ThemeColor;
  event_poster?: string;
  created_at: Date;
  updated_at: Date;
}

interface EventCreationAttributes
	extends Optional<EventAttributes, 'tags' | 'memories' | 'images' | 'description' | 'message' | 'theme_color' | 'event_poster' | 'id' | 'created_at' | 'updated_at'> {}

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

  @Column({
    type: DataType.NUMBER,
    allowNull: true
  })
  site_id!: number | null;

  @Column(DataType.NUMBER)
  type!: number;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  event_location!: EventLocation;  // Stays as VARCHAR: 'onsite' or 'offsite'

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  theme_color?: ThemeColor;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  event_poster?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  location?: LocationCoordinate | null;

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  memories?: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  images!: string[] | null;

  @Column(DataType.TEXT)
  message!: string | null;

  @Column(DataType.DATE)
  event_date!: Date;

  @Column(DataType.STRING)
  link!: string;

  @Column({
    type: DataType.ENUM('illustrations', 'profile'),
    allowNull: true,
    defaultValue: 'profile'
  })
  default_tree_view_mode?: 'illustrations' | 'profile';

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export type {EventAttributes, EventCreationAttributes, ThemeColor, LocationCoordinate}