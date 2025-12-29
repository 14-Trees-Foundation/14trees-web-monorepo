// Model in postgresql db

import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface AuthTokenAttributes {
  id: number;
  user_id: number;
  token: string;
  token_id: string;
  token_id_created_at: number; // Epoch timestamp for token_id creation
  expires_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface AuthTokenCreationAttributes
  extends Optional<AuthTokenAttributes, 'id' | 'created_at' | 'updated_at' | 'token_id' | 'token_id_created_at'> {}

@Table({ tableName: 'auth_tokens' })
class AuthToken extends Model<AuthTokenAttributes, AuthTokenCreationAttributes>
implements AuthTokenAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ 
    type: DataType.INTEGER, 
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  })
  user_id!: number;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false, 
  })
  token!: string;

  @Column({ 
    type: DataType.UUID, 
    allowNull: false, 
    unique: true,
    defaultValue: DataType.UUIDV4
  })
  token_id!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: () => Date.now()
  })
  token_id_created_at!: number;

  @Column({ 
    type: DataType.DATE, 
    allowNull: false 
  })
  expires_at!: Date;

  @Column(DataType.DATE)
  created_at?: Date;

  @Column(DataType.DATE)
  updated_at?: Date;
}

export { AuthToken }
export type { AuthTokenAttributes, AuthTokenCreationAttributes }