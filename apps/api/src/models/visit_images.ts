import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface VisitImageAttributes {
	id: number;
	visit_id: number;
	image_url: string;
  created_at: Date;
}

interface VisitImageCreationAttributes
	extends Optional<VisitImageAttributes, 'id'> {}

@Table({ tableName: 'visit_images' })
class VisitImage extends Model<VisitImageAttributes, VisitImageCreationAttributes>
implements VisitImageAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.INTEGER })
  visit_id!: number;

  @Column({ type: DataType.STRING })
  image_url!: string;

  @Column({ type: DataType.DATE })
  created_at!: Date;
}

export { VisitImage }
export type { VisitImageAttributes, VisitImageCreationAttributes }
