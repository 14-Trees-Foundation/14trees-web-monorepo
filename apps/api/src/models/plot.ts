//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index } from 'sequelize-typescript';
import { Boundaries, Center } from './common';
import { Optional } from 'sequelize';

interface PlotAttributes {
  id: string;
  name: string;
  plot_id: string;
  tags?: string[];
  boundaries?: Boundaries;
  center?: Center;
  date_added?: Date;
}

interface PlotCreationAttributes
	extends Optional<PlotAttributes, 'id' | 'tags' | 'boundaries' | 'center'> {}

@Table({ tableName: 'plots' })
class Plot
extends Model<PlotAttributes, PlotCreationAttributes>
implements PlotAttributes {
    @Column({
      type: DataType.STRING,
      allowNull: false,
      field: "_id",
      primaryKey: true,
      unique: true
    })
    id!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Unique
    @Index
    @Column({ type: DataType.STRING, allowNull: false })
    plot_id!: string;

    @Column({ type: DataType.ARRAY(DataType.STRING) })
    tags?: string[];

    @Column({ type: DataType.JSONB })
    boundaries?: { type: string; coordinates: number[][][] };

    @Column({ type: DataType.JSONB })
    center?: { type: string; coordinates: number[] };

    @Column({ type: DataType.DATE })
    date_added?: Date;
}

export { Plot }
export type { PlotAttributes, PlotCreationAttributes }