import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Tree } from './tree';
import { Optional } from 'sequelize';

interface TreeUpdateAttributes {
  id: number;
  tree_id: number;
  photo_update: Array<{
    image: string;
    date_added: string;
  }>;
  created_at?: Date;
  updated_at?: Date;
}

interface TreeUpdateCreationAttributes extends Optional<TreeUpdateAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({
  tableName: 'tree_update_photos',
  timestamps: true,
})
export class TreeUpdate extends Model<TreeUpdateAttributes, TreeUpdateCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Tree)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  tree_id!: number;

  @BelongsTo(() => Tree)
  tree!: Tree;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  photo_update!: Array<{
    image: string;
    date_added: string;
  }>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at?: Date;
} 