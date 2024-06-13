import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type GroupType = 'visitor' | 'corporate' | 'family' | 'ngo' | 'onsite_staff' | 'alumni' | 'donors'

interface GroupAttributes {
	id: number;
	name: string;
	type: GroupType;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

interface GroupCreationAttributes
	extends Optional<GroupAttributes, 'id'> {}

@Table({ tableName: 'groups' })
class Group extends Model<GroupAttributes, GroupCreationAttributes>
implements GroupAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ 
    type: DataType.ENUM('visitor', 'corporate', 'family', 'ngo', 'onsite_staff', 'alumni', 'donors'), 
    allowNull: false 
  })
  type!: GroupType;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.DATE)
  created_at!: Date;

  @Column(DataType.DATE)
  updated_at!: Date;
}

export { Group }
export type { GroupAttributes, GroupCreationAttributes }