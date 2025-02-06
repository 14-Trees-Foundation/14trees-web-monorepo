import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface WAChatMessageAttributes {
  id: number;
  user_phone: string;
  message: string;
  message_type: 'human' | 'ai';
  timestamp: Date;
}


interface WAChatMessageCreationAttributes
  extends Optional<WAChatMessageAttributes, 'id'> { }

@Table({ tableName: 'wa_chat_history' })
class WAChatMessage
  extends Model<WAChatMessageAttributes, WAChatMessageCreationAttributes>
  implements WAChatMessageAttributes {
  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  user_phone!: string;

  @Column({ type: DataType.STRING })
  message!: string;

  @Column({ type: DataType.STRING })
  message_type!: 'human' | 'ai';

  @Column({ type: DataType.DATE })
  timestamp!: Date;
}

export { WAChatMessage }
export type { WAChatMessageAttributes, WAChatMessageCreationAttributes }