//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index } from 'sequelize-typescript';
import { Boundaries, Center } from './common';
import { Optional } from 'sequelize';

interface PlotAttributes {
  id: number;
  name: string;
  plot_id: string;
  tags?: string[];
  boundaries?: Boundaries;
  center?: Center;
  gat?: string;
  status?: string;
  land_type?: number;
  category?: number;
  created_at: Date;
  updated_at: Date;
}

interface PlotCreationAttributes
	extends Optional<PlotAttributes, 'id' | 'tags' | 'boundaries' | 'center' | 'gat' | 'status'> {}

@Table({ tableName: 'plots' })
class Plot
extends Model<PlotAttributes, PlotCreationAttributes>
implements PlotAttributes {
    @Column({
      type: DataType.NUMBER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      unique: true
    })
    id!: number;

    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Unique
    @Index
    @Column({ type: DataType.STRING, allowNull: false })
    plot_id!: string;

    @Column({ type: DataType.ARRAY(DataType.STRING) })
    tags?: string[];

    @Column({ type: DataType.JSON })
    boundaries?: Boundaries;

    @Column({ type: DataType.JSON })
    center?: Center;

    @Column({ type: DataType.STRING })
    gat!: string;

    @Column({ type: DataType.STRING })
    status!: string;

    @Column({ type: DataType.NUMBER })
    land_type?: number;

    @Column({ type: DataType.NUMBER })
    category?: number;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;

}

export { Plot }
export type { PlotAttributes, PlotCreationAttributes }