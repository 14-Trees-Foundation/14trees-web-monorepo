
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface OrgAttributes {
  id: string;
  name: string;
  type?: string;
  desc?: string;
  date_added?: Date;
}

interface OrgCreationAttributes
	extends Optional<OrgAttributes, 'type' | 'desc' > {}

@Table({ tableName: 'organizations' })
class Org
extends Model<OrgAttributes, OrgCreationAttributes>
implements OrgAttributes {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "_id",
    primaryKey: true,
    unique: true
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.STRING })
  type?: string;

  @Column({ type: DataType.STRING })
  desc?: string;

  @Column({ type: DataType.DATE })
  date_added?: Date;
}

export { Org }
export type { OrgAttributes, OrgCreationAttributes }