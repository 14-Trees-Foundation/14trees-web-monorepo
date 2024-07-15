
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
    consent_document_link:  string| null;
    google_earth_link: string|null;
    trees_planted: Number|null;
    account: string|null;
    data_errors: string|null;
    date_planted: Date|null;
    site_data_check: Enumerator|null;

    album: string | null;
    album_contains: string | null;
    tags: string[] | null;
    status: string | null;
    remark: string | null;
    hosted_at: string | null;
    created_at?: Date;
    updated_at?: Date;
    maintenance_type: Enumerator  | null;
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
    consent_document_link!: string | null;

    @Column(DataType.STRING)
    google_earth_link!: string | null;

    @Column(DataType.NUMBER)
    trees_planted!: number | null;

    @Column(DataType.STRING)
    account!: string | null;

    
    @Column(DataType.STRING)
    data_errors!: string | null;

    @Column(DataType.DATE)
    date_planted!: Date | null;

    @Column({type:DataType.ENUM , values:["Yes" , "No"]})
    site_data_check!: Enumerator | null;

   

    @Column(DataType.STRING)
    album!: string | null;

    @Column(DataType.STRING)
    album_contains!: string | null;

    @Column(DataType.STRING)
    tags!: string[] | null;

    @Column(DataType.STRING)
    status!: string | null;

    @Column(DataType.STRING)
    remark!: string | null;

    @Column(DataType.STRING)
    hosted_at!: string | null;

    @Column(DataType.DATE)
    created_at?: Date;

    @Column(DataType.DATE)
    updated_at?: Date;

    @Column({type : DataType.ENUM , values: ['FULL_MAINTENANCE',
	'PLANTATION_ONLY',
	'DISTRIBUTION_ONLY']})
    maintenance_type!: Enumerator | null;

}

export { Site };
export type { SiteAttributes, SiteCreationAttributes };
