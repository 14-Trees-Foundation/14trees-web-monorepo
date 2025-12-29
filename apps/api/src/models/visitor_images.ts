import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface VisitorImageAttributes {
	id: number;
	sapling_id: string;
	visitor_id?: number;
	visit_id?: number;
	type: 'user_tree_image' | 'user_card_image';
	image_url: string;
	original_name?: string;
	mime?: string;
	size?: number;
	created_at: Date;
	updated_at: Date;
}

interface VisitorImageCreationAttributes
	extends Optional<VisitorImageAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'visitor_images' })
class VisitorImage extends Model<VisitorImageAttributes, VisitorImageCreationAttributes>
implements VisitorImageAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  sapling_id!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  visitor_id?: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  visit_id?: number;

  @Column({
    type: DataType.ENUM('user_tree_image', 'user_card_image'),
    allowNull: false
  })
  type!: 'user_tree_image' | 'user_card_image';

  @Column({ type: DataType.TEXT })
  image_url!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  original_name?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  mime?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  size?: number;

  @Column({ type: DataType.DATE })
  created_at!: Date;

  @Column({ type: DataType.DATE })
  updated_at!: Date;
}

export { VisitorImage }
export type { VisitorImageAttributes, VisitorImageCreationAttributes }