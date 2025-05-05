import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface ChatMessageAttributes {
  id: number;
  user_phone: string | null;
  device_id: string | null;
  message: string;
  message_type: 'human' | 'ai';
  timestamp: Date;
}


interface ChatMessageCreationAttributes
  extends Optional<ChatMessageAttributes, 'id'> { }

@Table({ tableName: 'chat_history' })
class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes {
  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  user_phone!: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  device_id!: string | null;

  @Column({ type: DataType.STRING })
  message!: string;

  @Column({ type: DataType.STRING })
  message_type!: 'human' | 'ai';

  @Column({ type: DataType.DATE })
  timestamp!: Date;
}

export { ChatMessage }
export type { ChatMessageAttributes, ChatMessageCreationAttributes }