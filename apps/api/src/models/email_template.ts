import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type TemplateType = 'sponsor-single-tree' | 'sponsor-multi-trees' | 'receiver-single-tree' | 'receiver-multi-trees';

interface EmailTemplateAttributes {
	id: number;
	event_type: string;
	event_name: string;
	template_type: TemplateType;
	template_name: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EmailTemplateCreationAttributes
	extends Optional<EmailTemplateAttributes, 'id'> {}

@Table({ tableName: 'email_templates' })
class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes>
implements EmailTemplateAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  event_type!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  event_name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  template_type!: TemplateType;

  @Column({ type: DataType.STRING, allowNull: false })
  template_name!: string;

  @Column(DataType.DATE)
  created_at?: Date;

  @Column(DataType.DATE)
  updated_at?: Date;
}

export { EmailTemplate }
export type { EmailTemplateAttributes, EmailTemplateCreationAttributes }
