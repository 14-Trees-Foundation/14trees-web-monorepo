import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

type GroupType = 'visitor' | 'corporate' | 'family' | 'ngo' | 'onsite_staff' | 'alumni' | 'donors'

interface GroupAttributes {
	id: number;
	name: string;
	type: GroupType;
    description: string;
}

interface GroupCreationAttributes
	extends Optional<GroupAttributes, 'description'> {}

@Table({ tableName: 'groups' })
class Group extends Model<GroupAttributes, GroupCreationAttributes>
implements GroupAttributes {

  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  type!: GroupType;

  @Column(DataType.TEXT)
  description!: string;
}

export { Group }
export type { GroupAttributes, GroupCreationAttributes }