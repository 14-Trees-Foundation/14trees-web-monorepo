import { Optional } from 'sequelize';
import { Column, DataType, Table, Model } from 'sequelize-typescript';

interface SiteAttributes {
  created_at?: Date;
  site_name_marathi?: string;
  site_name_english?: string;
  owner?: string;
  land_type?: string;
  land_strata?: string;
  district?: string;
  taluka?: string;
  village?: string;
  area_in_acres?: number;
  length_in_kms?: number;
  Trees?: number;
  UniqueId?: string;
  photo_album?: string;
  संमती_पत्र?: string;
  Grove_type?: string;
  Map_to?: string;
  Notion_dBPictures?: string;
  Split_Village_name_1: string; 
  CreateId?: string;
  SiteKey?: string;
  SiteKey2?: string;
}

interface SiteCreationAttributes
	extends Optional<SiteAttributes, 'Map_to'> {}

@Table({ tableName: 'sites' })
class Site extends Model<SiteAttributes, SiteCreationAttributes> implements SiteAttributes {
    
    @Column(DataType.DATE)
    created_at?: Date;

    @Column(DataType.STRING)
    site_name_marathi?: string;

    @Column(DataType.STRING)
    site_name_english?: string;

    @Column(DataType.STRING)
    owner?: string;

    @Column(DataType.STRING)
    land_type?: string;

    @Column(DataType.STRING)
    land_strata?: string;

    @Column(DataType.STRING)
    district?: string;

    @Column(DataType.STRING)
    taluka?: string;

    @Column(DataType.STRING)
    village?: string;

    @Column(DataType.NUMBER)
    area_in_acres?: number;

    @Column(DataType.NUMBER)
    length_in_kms?: number;

    @Column(DataType.NUMBER)
    Trees_?: number;

    @Column(DataType.STRING)
    Unique_Id?: string;

    @Column(DataType.STRING)
    photo_album?: string;

    @Column(DataType.STRING)
    संमती_पत्र?: string;

    @Column(DataType.STRING)
    Grove_type?: string;

    @Column(DataType.STRING)
    Map_to?: string;

    @Column(DataType.STRING)
    Notion_dBPictures?: string;

    @Column({ type: DataType.STRING, allowNull: false })
    Split_Village_name_1!: string;

    @Column(DataType.STRING)
    Create_Id?: string;

    @Column(DataType.STRING)
    Site_Key?: string;

    @Column(DataType.STRING)
    Site_Key_2?: string;
}

export { Site };
export type { SiteAttributes, SiteCreationAttributes };