import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface TagAttributes {
	id: number;
	tag: string;
    type: 'SYSTEM_DEFINED' | 'USER_DEFINED'
    created_at: Date;
    updated_at: Date;
}

interface TagCreationAttributes
	extends Optional<TagAttributes, 'id'> {}

@Table({ tableName: 'tags' })
class Tag extends Model<TagAttributes, TagCreationAttributes>
implements TagAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  tag!: string;

  @Column({ type: DataType.ENUM, values: ['SYSTEM_DEFINED', 'USER_DEFINED'] })
  type!: 'SYSTEM_DEFINED' | 'USER_DEFINED';

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export { Tag }
export type { TagAttributes, TagCreationAttributes }
