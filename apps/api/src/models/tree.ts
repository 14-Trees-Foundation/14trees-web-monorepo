// Model in postgresql db

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TreeType } from '../models/treetype'
import { Plot } from '../models/plot'
import { OnsiteStaff } from "../models/onsitestaff";
import { User } from './user'
import { Center } from './common';
import { Optional } from 'sequelize';


interface TreeAttributes {
    id: string,
    sapling_id: string,
    tree_id: string,
    plot_id: string,
    user_id: string,
    image: string[],
    height: number,
    date_added: Date,
    tags: string[],
    location: Center,
    link: string,
    mapped_to: string,
    event_type: string,
    desc: string,
    date_assigned: Date,
};

interface TreeCreationAttributes
	extends Optional<TreeAttributes, 'tags' | 'location' | 'link' | 'mapped_to' | 'event_type' | 'desc' | 'date_assigned' | 'image' | 'user_id' | 'height'> {}

@Table({ tableName: 'trees' })
class Tree extends Model<TreeAttributes, TreeCreationAttributes>
implements TreeAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  sapling_id!: string;

  @ForeignKey(() => TreeType)
  @Column
  tree_id!: string;

  @ForeignKey(() => Plot)
  @Column
  plot_id!: string;

  @ForeignKey(() => OnsiteStaff)
  @Column
  user_id!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  image!: string[];

  @Column(DataType.FLOAT)
  height!: number;

  @Column(DataType.DATE)
  date_added!: Date;

  @Column(DataType.ARRAY(DataType.STRING))
  tags!: string[];

  @Column(DataType.JSON)
  location!: { type: string, coordinates: number[] };

  @ForeignKey(() => User)
  @Column
  mapped_to!: string;

  @Column(DataType.STRING)
  link!: string;

  @Column(DataType.STRING)
  event_type!: string;

  @Column(DataType.STRING)
  desc!: string;

  @Column(DataType.DATE)
  date_assigned!: Date;

  @BelongsTo(() => TreeType)
  treeType!: TreeType;

  @BelongsTo(() => Plot)
  plot!: Plot;

  @BelongsTo(() => OnsiteStaff)
  onSiteStaff!: OnsiteStaff;

  @BelongsTo(() => User)
  user!: User;
}


export { Tree }
export type { TreeAttributes, TreeCreationAttributes }