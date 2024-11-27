import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface PlantTypeCardTemplateAttributes {
    id: number;
    plant_type: string;
    template_id: string;
    created_at: Date;
    updated_at: Date;
}

interface PlantTypeCardTemplateCreationAttributes
    extends Optional<PlantTypeCardTemplateAttributes, 'id'> {}

@Table({ tableName: 'plant_type_card_templates' })
class PlantTypeCardTemplate extends Model<PlantTypeCardTemplateAttributes, PlantTypeCardTemplateCreationAttributes>
    implements PlantTypeCardTemplateAttributes {

    @Column({
        type: DataType.NUMBER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id!: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    plant_type!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    template_id!: string;

    @Column({ type: DataType.DATE, allowNull: false })
    created_at!: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    updated_at!: Date;
}

export { PlantTypeCardTemplate }
export type { PlantTypeCardTemplateAttributes, PlantTypeCardTemplateCreationAttributes }