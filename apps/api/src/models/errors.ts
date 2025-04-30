// src/models/error.model.ts
import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface ErrorAttributes {
  log_date: Date;
  server_name: string;
  processor_name: string;
  error_audit: string;
  module: string;
  doc_type: string | null;
  buyer_code: string | null;
  supplier_code: string | null;
  key_ref: string | null;
  remarks: string | null;
  file_name: string | null;
  problem: string | null;
  solution: string | null;
  details: string | null;
  errors_to_assign: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

interface ErrorCreationAttributes extends Optional<ErrorAttributes,
  | 'doc_type'
  | 'buyer_code'
  | 'supplier_code'
  | 'key_ref'
  | 'remarks'
  | 'file_name'
  | 'problem'
  | 'solution'
  | 'details'
  | 'errors_to_assign'
  | 'created_at'
  | 'updated_at'> {}

@Table({
  tableName: 'errors',
  schema: 'LightHouse',
  timestamps: false // Since we're manually handling created_at/updated_at
})
class Error extends Model<ErrorAttributes, ErrorCreationAttributes>
  implements ErrorAttributes {

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'log_date'
  })
  log_date!: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'server_name'
  })
  server_name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'processor_name'
  })
  processor_name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'error_audit'
  })
  error_audit!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  module!: string;

  @Column({
    type: DataType.STRING(50),
    field: 'doc_type'
  })
  doc_type!: string | null;

  @Column({
    type: DataType.STRING(50),
    field: 'buyer_code'
  })
  buyer_code!: string | null;

  @Column({
    type: DataType.STRING(50),
    field: 'supplier_code'
  })
  supplier_code!: string | null;

  @Column(DataType.TEXT)
  key_ref!: string | null;

  @Column(DataType.TEXT)
  remarks!: string | null;

  @Column(DataType.TEXT)
  file_name!: string | null;

  @Column(DataType.TEXT)
  problem!: string | null;

  @Column(DataType.TEXT)
  solution!: string | null;

  @Column(DataType.TEXT)
  details!: string | null;

  @Column({
    type: DataType.TEXT,
    field: 'errors_to_assign'
  })
  errors_to_assign!: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  status!: string;

  @Column({
    type: DataType.INTEGER,
    field: 'created_at'
  })
  created_at!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'updated_at'
  })
  updated_at!: number;
}

export { Error };
export type { ErrorAttributes, ErrorCreationAttributes };