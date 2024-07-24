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
    tags: string[],
    location: Center,
    planted_by?: string,
    mapped_to_user?: number | null,
    mapped_to_group?: number | null,
    mapped_at?: Date | null,
    sponsored_by_user?: number,
    sponsored_by_group?: number,
    gifted_by?: number,
    gifted_to?: number,
    assigned_at: Date | null,
    assigned_to: number | null,
    user_tree_image?: string | null,
    user_card_image?: string | null,
    memory_images?: string[] | null,
    event_id?: number,
    visit_id: number | null,
    description?: string,
    tree_status?: string;
    status?: string;
    status_message?: string[];
    last_system_updated_at?: Date;
    created_at?: Date;
    updated_at?: Date;
};

interface TreeCreationAttributes
	extends Optional<TreeAttributes, 'id' | 'tags' | 'location' | 'planted_by' | 'mapped_to_user' | 'mapped_to_group' | 'mapped_at' | 'description' | 'assigned_at' | 'assigned_to' | 'user_tree_image' | 'user_card_image' | 'visit_id'> {}

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

  @Column(DataType.ARRAY(DataType.STRING))
  tags!: string[];

  @Column(DataType.JSON)
  location!: Center;

  @ForeignKey(() => User)
  @Column
  mapped_to_user!: number;

  @ForeignKey(() => Group)
  @Column
  mapped_to_group!: number;
  
  @Column(DataType.DATE)
  mapped_at!: Date;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.DATE)
  assigned_at!: Date;

  @ForeignKey(() => User)
  @Column(DataType.NUMBER)
  assigned_to!: number;

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

  @ForeignKey(() => Event)
  @Column(DataType.NUMBER)
  event_id!: number;

  @ForeignKey(() => Visit)
  @Column(DataType.NUMBER)
  visit_id!: number;

  @Column(DataType.STRING)
  user_tree_image!: string;

  @Column(DataType.STRING)
  user_card_image!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  memory_images!: string[];

  @Column({type: DataType.ENUM('alive', 'dead', 'lost'), defaultValue: 'alive'})
  tree_status!: string;

  @Column(DataType.ENUM('system_invalidated', 'user_validated'))
  status!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  status_message!: string[];

  @Column(DataType.DATE)
  last_system_updated_at!: Date;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}


export { Tree }
export type { TreeAttributes, TreeCreationAttributes }