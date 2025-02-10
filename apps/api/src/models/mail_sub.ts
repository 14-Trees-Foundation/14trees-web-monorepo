import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface MailSubAttributes {
  id: number;
  message_id: string;
  thread_id: string;
  created_at: Date;
}


interface MailSubCreationAttributes
  extends Optional<MailSubAttributes, 'id'> { }

@Table({ tableName: 'mail_subs' })
class MailSub
  extends Model<MailSubAttributes, MailSubCreationAttributes>
  implements MailSubAttributes {
  @Column({
    type: DataType.NUMBER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING })
  message_id!: string;

  @Column({ type: DataType.STRING })
  thread_id!: string;

  @Column({ type: DataType.DATE })
  created_at!: Date;
}

export { MailSub }
export type { MailSubAttributes, MailSubCreationAttributes }