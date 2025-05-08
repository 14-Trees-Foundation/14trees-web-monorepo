import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface SupplierAttributes {
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  email?: string | null;
  country?: string | null;
  company_group_code?: string | null;
  import_path?: string | null;
  export_path?: string | null;
  supplier_formats?: string[] | null;
  server?: string | null;
  created_at?: Date;
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes, 
  'address' | 'city' | 'email' | 'country' | 'company_group_code' |
  'import_path' | 'export_path' | 'supplier_formats' | 'server' | 'created_at'> {}

@Table({ tableName: 'suppliers', schema: '14trees_2' })
class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> 
  implements SupplierAttributes {

  @Column({
    type: DataType.STRING(50),
    primaryKey: true,
    allowNull: false
  })
  code!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name!: string;

  @Column(DataType.TEXT)
  address!: string | null;

  @Column(DataType.STRING(100))
  city!: string | null;

  @Column(DataType.STRING(100))
  email!: string | null;

  @Column(DataType.STRING(100))
  country!: string | null;

  @Column(DataType.STRING(50))
  company_group_code!: string | null;

  @Column(DataType.STRING(255))
  import_path!: string | null;

  @Column(DataType.STRING(255))
  export_path!: string | null;

  @Column(DataType.ARRAY(DataType.STRING))
  supplier_formats!: string[] | null;

  @Column(DataType.STRING(100))
  server!: string | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW
  })
  created_at!: Date;
}

export { Supplier }
export type { SupplierAttributes, SupplierCreationAttributes }