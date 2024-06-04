// Model in postgresql db

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { PlantType } from './plant_type'
import { Plot } from '../models/plot'
import { User } from './user'
import { Center } from './common';
import { Optional } from 'sequelize';
import { Group } from './group';
import { Event } from './events';


interface TreeAttributes {
    id: number,
    sapling_id: string,
    tree_type_id: number,
    plot_id: number,
    images: string[],
    tags: string[],
    location: Center,
    planted_by?: string,
    mapped_to_user: number,
    mapped_to_group: number,
    mapped_at: Date,
    sponsored_by_user?: number,
    sponsored_by_group?: number,
    gifted_by?: number,
    gifted_to?: number,
    assigned_at?: Date,
    assigned_to?: number,
    user_tree_images: string[],
    event_id?: number,
    description: string,
};

interface TreeCreationAttributes
	extends Optional<TreeAttributes, 'id' | 'tags' | 'location' | 'planted_by' | 'mapped_to_user' | 'mapped_to_group' | 'mapped_at' | 'description' | 'assigned_at' | 'assigned_to' | 'images' | 'user_tree_images'> {}

@Table({ tableName: 'trees' })
class Tree extends Model<TreeAttributes, TreeCreationAttributes>
implements TreeAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  sapling_id!: string;

  @ForeignKey(() => PlantType)
  @Column
  tree_type_id!: number;

  @ForeignKey(() => Plot)
  @Column
  plot_id!: number;

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];

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

  @Column(DataType.ARRAY(DataType.STRING))
  user_tree_images!: string[];
}


export { Tree }
export type { TreeAttributes, TreeCreationAttributes }