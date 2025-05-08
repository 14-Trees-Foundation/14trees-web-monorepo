// src/models/buyer.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface BuyerAttributes {
  code: string;
  buyer_name: string;
  contact_person?: string | null;
  email?: string | null;
  country?: string | null;
  adaptor_license_key?: string | null;
  web_link?: string | null;
  import_path?: string | null;
  export_path?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface BuyerCreationAttributes extends Optional<BuyerAttributes, 
  | 'contact_person' 
  | 'email'
  | 'country'
  | 'adaptor_license_key'
  | 'web_link'
  | 'import_path'
  | 'export_path'
  | 'created_at'
  | 'updated_at'> {}

@Table({ 
  tableName: 'buyers',
  schema: '14trees_2',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
class Buyer extends Model<BuyerAttributes, BuyerCreationAttributes> 
  implements BuyerAttributes {

  @Column({
    type: DataType.STRING(50),
    primaryKey: true,
    allowNull: false
  })
  code!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'buyer_name' // Maps to buyer_name column in DB
  })
  buyer_name!: string;

  @Column({
    type: DataType.STRING(100),
    field: 'contact_person'
  })
  contact_person!: string | null;

  @Column(DataType.STRING(100))
  email!: string | null;

  @Column(DataType.STRING(100))
  country!: string | null;

  @Column({
    type: DataType.STRING(255),
    field: 'adaptor_license_key'
  })
  adaptor_license_key!: string | null;

  @Column({
    type: DataType.STRING(255),
    field: 'web_link'
  })
  web_link!: string | null;

  @Column({
    type: DataType.STRING(255),
    field: 'import_path'
  })
  import_path!: string | null;

  @Column({
    type: DataType.STRING(255),
    field: 'export_path'
  })
  export_path!: string | null;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at'
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'updated_at'
  })
  updated_at!: Date;
}

export { Buyer };
export type { BuyerAttributes, BuyerCreationAttributes };