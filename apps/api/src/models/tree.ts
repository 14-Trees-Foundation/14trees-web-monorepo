// Model in postgresql db

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'; 
import { PlantType } from './plant_type'
import { Plot } from '../models/plot'
import { User } from './user'
import { Center } from './common';
import { Optional } from 'sequelize';
import { Group } from './group';
import { Event } from './events';
import { Visit } from './visits';


interface TreeAttributes {
    id: number,
    sapling_id: string,
    plant_type_id: number,
    plot_id: number,
    image: string | null,
    tags: string[] | null,
    location: Center,
    planted_by: string | null,
    mapped_to_user: number | null,
    mapped_to_group: number | null,
    mapped_at: Date | null,
    sponsored_by_user: number | null,
    sponsored_by_group: number | null,
    gifted_by: number | null,
    gifted_by_name: string | null,
    gifted_to: number | null,
    assigned_at: Date | null,
    assigned_to: number | null,
    user_tree_image: string | null,
    user_card_image: string | null,
    memory_images: string[] | null,
    event_id: number | null,
    donation_id: number | null,
    visit_id: number | null,
    description: string | null,
    event_type: string | null,
    tree_status?: string;
    status?: string;
    status_message?: string[] | null;
    last_system_updated_at?: Date;
    deleted_at: Date | null;
    created_at?: Date;
    updated_at?: Date;
    dashboard_image: string | null;
};

interface TreeCreationAttributes
	extends Optional<TreeAttributes, 'id' | 'tags' | 'location' | 'planted_by' | 'mapped_to_user' | 'mapped_to_group' | 'mapped_at' | 'description' | 'assigned_at' | 'assigned_to' | 'user_tree_image' | 'user_card_image' | 'visit_id' | 'donation_id' | 'event_type' | 'gifted_by_name' | 'gifted_to' | 'gifted_by' | 'sponsored_by_user' | 'sponsored_by_group' | 'event_id' | 'memory_images' | 'deleted_at' | 'dashboard_image'> {}

@Table({ tableName: 'trees' })
class Tree extends Model<TreeAttributes, TreeCreationAttributes>
implements TreeAttributes {

  @Column({
    type: DataType.NUMBER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  sapling_id!: string;

  @ForeignKey(() => PlantType)
  @Column
  plant_type_id!: number;

  @ForeignKey(() => Plot)
  @Column
  plot_id!: number;

  @BelongsTo(() => Plot, 'plot_id')
  plot!: Plot;

  @Column(DataType.STRING)
  image!: string;

  @Column(DataType.STRING)
  planted_by!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    set(value: string[] | null) {
      this.setDataValue('tags', value || []); // Converts `null` to `[]`
    },
    defaultValue: [], // Ensures new records start with empty array
  })
  tags!: string[];

  @Column(DataType.JSON)
  location!: Center;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  mapped_to_user!: number | null;

  @ForeignKey(() => Group)
  @Column(DataType.INTEGER)
  mapped_to_group!: number | null;
  
  @Column(DataType.DATE)
  mapped_at!: Date;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.DATE)
  assigned_at!: Date;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  assigned_to!: number | null;

  @ForeignKey(() => Group)
  @Column(DataType.NUMBER)
  sponsored_by_group!: number;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  sponsored_by_user!: number;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  gifted_by!: number;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  gifted_to!: number;

  @Column(DataType.STRING)
  gifted_by_name!: string;

  @ForeignKey(() => Event)
  @Column(DataType.NUMBER)
  event_id!: number;

  @Column(DataType.STRING)
  event_type!: string;

  @Column(DataType.NUMBER)
  donation_id!: number | null;

  @ForeignKey(() => Visit)
  @Column(DataType.NUMBER)
  visit_id!: number;

  @Column(DataType.STRING)
  user_tree_image!: string;

  @Column(DataType.STRING)
  user_card_image!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    set(value: string[] | null) {
      this.setDataValue('memory_images', value || []);
    },
    defaultValue: [],
  })
  memory_images!: string[];

  @Column({type: DataType.ENUM('healthy', 'dead', 'lost'), defaultValue: 'healthy'})
  tree_status!: string;

  @Column(DataType.ENUM('system_invalidated', 'user_validated'))
  status!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    set(value: string[] | null) {
      this.setDataValue('status_message', value || []); // or `null` if you prefer
    },
    defaultValue: [], // or `null` if needed
  })
  status_message!: string[] | null; 

  @Column(DataType.DATE)
  last_system_updated_at!: Date;

  @Column(DataType.DATE)
  deleted_at!: Date | null;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,  // Can be null until screenshot is captured
    defaultValue: null
})
dashboard_image!: string | null;
}


export { Tree }
export type { TreeAttributes, TreeCreationAttributes }