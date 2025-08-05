import { Table, Column, Model, ForeignKey, DataType, BelongsTo } from 'sequelize-typescript';
import { Event } from './events';
import { Optional } from 'sequelize';

interface EventImageAttributes {
  id: number;
  event_id: number;
  image_url: string;
  sequence: number;
  created_at: Date;
  updated_at: Date;
}

interface EventImageCreationAttributes
  extends Optional<EventImageAttributes, 'id' | 'sequence' | 'created_at' | 'updated_at'> {}

@Table({ 
  tableName: 'event_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export class EventImage extends Model<EventImageAttributes, EventImageCreationAttributes>
  implements EventImageAttributes {
  
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
  })
  id!: number;

  @ForeignKey(() => Event)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  event_id!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false
  })
  image_url!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  sequence!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  updated_at!: Date;

  // Associations
  @BelongsTo(() => Event)
  event!: Event;
}

export type { EventImageAttributes, EventImageCreationAttributes };