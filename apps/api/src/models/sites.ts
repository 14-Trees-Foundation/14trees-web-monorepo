import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface SiteAttributes {
    id: number;
    name_marathi: string | null;
    name_english: string | null;
    owner: string | null;
    land_type: string | null;
    land_strata: string | null;
    district: string | null;
    taluka: string | null;
    village: string | null;
    area_acres: number | null;
    length_km: number | null;
    tree_count: number | null;
    unique_id: string | null;
    photo_album: string | null;
    consent_letter: string | null;
    grove_type: string | null;
    map_to: string | null;
    notion_db_pictures: string | null;
    split_village_name_1: string;
    split_village_name_2: boolean | null;
    create_id: string | null;
    site_key: string | null;
    site_key_2: string | null;
    temp_backup_copy_of_old_site_name_english_marathi: string | null;
    temp_copy_of_old_site_key: string | null;
    temp_old_site_name_in_english: string | null;
    temp_old_site_name_in_marathi: string | null;
    created_at?: Date;
    updated_at?: Date;
}

interface SiteCreationAttributes extends Optional<SiteAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({ tableName: 'sites' })
class Site extends Model<SiteAttributes, SiteCreationAttributes> implements SiteAttributes {
    @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column(DataType.STRING)
    name_marathi!: string | null;

    @Column(DataType.STRING)
    name_english!: string | null;

    @Column(DataType.STRING)
    owner!: string | null;

    @Column(DataType.STRING)
    land_type!: string | null;

    @Column(DataType.STRING)
    land_strata!: string | null;

    @Column(DataType.STRING)
    district!: string | null;

    @Column(DataType.STRING)
    taluka!: string | null;

    @Column(DataType.STRING)
    village!: string | null;

    @Column(DataType.NUMBER)
    area_acres!: number | null;

    @Column(DataType.NUMBER)
    length_km!: number | null;

    @Column(DataType.NUMBER)
    tree_count!: number | null;

    @Column(DataType.STRING)
    unique_id!: string | null;

    @Column(DataType.STRING)
    photo_album!: string | null;

    @Column(DataType.STRING)
    consent_letter!: string | null;

    @Column(DataType.STRING)
    grove_type!: string | null;

    @Column(DataType.STRING)
    map_to!: string | null;

    @Column(DataType.STRING)
    notion_db_pictures!: string | null;

    @Column(DataType.STRING)
    split_village_name_1!: string;

    @Column(DataType.BOOLEAN)
    split_village_name_2!: boolean | null;

    @Column(DataType.STRING)
    create_id!: string | null;

    @Column(DataType.STRING)
    site_key!: string | null;

    @Column(DataType.STRING)
    site_key_2!: string | null;

    @Column(DataType.STRING)
    temp_backup_copy_of_old_site_name_english_marathi!: string | null;

    @Column(DataType.STRING)
    temp_copy_of_old_site_key!: string | null;

    @Column(DataType.STRING)
    temp_old_site_name_in_english!: string | null;

    @Column(DataType.STRING)
    temp_old_site_name_in_marathi!: string | null;

    @Column(DataType.DATE)
    created_at?: Date;

    @Column(DataType.DATE)
    updated_at?: Date;
}

export { Site };
export type { SiteAttributes, SiteCreationAttributes };
