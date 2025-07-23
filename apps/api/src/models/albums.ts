import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface AlbumAttributes {
	id: number;
	album_name: string;
	user_id: number;
  images: string[];
  status: 'active' | 'unused';
  created_at?: Date;
  updated_at?: Date;
}

interface AlbumCreationAttributes
	extends Optional<AlbumAttributes, 'id'> {}

@Table({ tableName: 'albums' })
class Album extends Model<AlbumAttributes, AlbumCreationAttributes>
implements AlbumAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  album_name!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id!: number;

  @Column(DataType.STRING)
  status!: 'active' | 'unused';

  @Column(DataType.ARRAY(DataType.STRING))
  images!: string[];

  @Column(DataType.DATE)
  created_at?: Date;

  @Column(DataType.DATE)
  updated_at?: Date;
}

export { Album }
export type { AlbumAttributes, AlbumCreationAttributes }
