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
	link?: string;
	tags?: string[];
  event_date: Date;
  memories?: string[];
  images: string[] | null;
  message: string | null;
  event_location: EventLocation;  // Keep as string: 'onsite' or 'offsite'
  // Optional detailed single-point location
  location?: LocationCoordinate | null;
  default_tree_view_mode?: 'illustrations' | 'profile';
  theme_color?: ThemeColor;
  event_poster?: string;
  landing_image_s3_path?: string;
  landing_image_mobile_s3_path?: string;
  show_blessings?: boolean;
  blessings_cta_text?: string | null;
  total_views?: number;
  unique_views?: number;
  created_at: Date;
  updated_at: Date;
}

interface EventCreationAttributes
	extends Optional<EventAttributes, 'tags' | 'memories' | 'images' | 'description' | 'message' | 'theme_color' | 'event_poster' | 'link' | 'default_tree_view_mode' | 'show_blessings' | 'blessings_cta_text' | 'total_views' | 'unique_views' | 'id' | 'created_at' | 'updated_at'> {}

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
    allowNull: true,
  })
  link?: string;

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
    type: DataType.TEXT,
    allowNull: true,
  })
  landing_image_s3_path?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  landing_image_mobile_s3_path?: string;

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

  @Column({
    type: DataType.ENUM('illustrations', 'profile'),
    allowNull: true,
    defaultValue: 'profile'
  })
  default_tree_view_mode?: 'illustrations' | 'profile';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true
  })
  show_blessings?: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  blessings_cta_text?: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0
  })
  total_views?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0
  })
  unique_views?: number;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export type {EventAttributes, EventCreationAttributes, ThemeColor, LocationCoordinate}