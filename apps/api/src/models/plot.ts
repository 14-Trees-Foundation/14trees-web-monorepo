//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index, BelongsTo, HasMany } from 'sequelize-typescript';
import { Boundaries, Center } from './common';
import { Optional } from 'sequelize';
import { Tree } from './tree';


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
  category: 'Public' | 'Foundation' | null;
  created_at: Date;
  updated_at: Date;
  site_id: number | null;
  label: string | null;
  accessibility_status: string | null;
  acres_area: number | null;
}

interface PlotCreationAttributes
	extends Optional<PlotAttributes, 'id' | 'tags' | 'boundaries' | 'center' | 'gat' | 'status' | 'label' | 'acres_area' | 'accessibility_status'> {}

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
    @Column({ type: DataType.STRING })
    plot_id!: string;

    @Column({ type: DataType.INTEGER })
    site_id!: number | null;

    @Column({ type: DataType.ARRAY(DataType.STRING) })
    tags?: string[];

    @Column({ type: DataType.JSON })
    boundaries?: Boundaries;

    @Column({ type: DataType.JSON })
    center?: Center;

    @Column({ type: DataType.STRING })
    gat!: string;

    @Column({ type: DataType.STRING })
    label!: string;

    @Column({ type: DataType.STRING })
    accessibility_status!: string;

    @Column({ type: DataType.STRING })
    status!: string;

    @Column({ type: DataType.NUMBER })
    land_type?: number;

    @Column({ type: DataType.STRING })
    category!: 'Public' | 'Foundation' | null;

    @Column({ type: DataType.DATE })
    created_at!: Date;

    @Column({ type: DataType.DATE })
    updated_at!: Date;

    @HasMany(() => Tree, 'plot_id') // Move HasMany decorator here
    trees!: Tree[];

    @Column({ type: DataType.REAL })
    acres_area!: number | null;
}

export { Plot }
export type { PlotAttributes, PlotCreationAttributes }