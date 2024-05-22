// Model in postgreSQL db

import { Model, Table, Column, DataType, ForeignKey } from 'sequelize-typescript';
import {Tree}  from './tree';   //they can be used for foreign key purposes
import { Plot } from './plot';
import { Optional } from 'sequelize';

interface CorpEventAttributes {
  id: string,
  event_link: string,
  event_name: string,
  tree_ids: string[],
  plot_id: string,
  title: string,
  logo: string[],
  short_desc: string,
  long_desc: string,
  num_people: string,
  header_img: string,
  plot_desc: string,
  album: string[],
  plot_img: string,
  date_added: Date,
};

interface CorpEventCreationAttributes
	extends Optional<CorpEventAttributes, 'plot_img' | 'plot_desc'> {}

@Table({ tableName: 'corp_events' })
class CorpEvent extends Model<CorpEventAttributes, CorpEventCreationAttributes>
implements CorpEventAttributes {

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @Column({
    type: DataType.STRING,
  })
  event_link!: string;

  @Column({
    type: DataType.STRING,
  })
  event_name!: string;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER), // assuming IDs are integers, change if needed
  })
  @ForeignKey(() => Tree)
  tree_ids!: string[];

  @ForeignKey(() => Plot)
  @Column({
    type: DataType.INTEGER,
  })
  plot_id!: string;

  @Column({
    type: DataType.STRING,
  })
  title!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  logo!: string[];

  @Column({
    type: DataType.STRING,
  })
  short_desc!: string;

  @Column({
    type: DataType.STRING,
  })
  long_desc!: string;

  @Column({
    type: DataType.STRING,
  })
  num_people!: string;

  @Column({
    type: DataType.STRING,
  })
  header_img!: string;

  @Column({
    type: DataType.STRING,
  })
  plot_desc!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  album!: string[];

  @Column({
    type: DataType.STRING,
  })
  plot_img!: string;

  @Column({
    type: DataType.DATE,
  })
  date_added!: Date;
}

export { CorpEvent }
export type { CorpEventAttributes, CorpEventCreationAttributes }