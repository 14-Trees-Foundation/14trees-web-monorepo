//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index } from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface DonationAttributes {
  id: number;
  Date_Recieved: string;
  Name: string;
  Donor_type: string;
  Phone: string;
  Email_Address: string;
  PAN: string;
  Pledged: string;
  Land_type: string;
  Zone: string;
  Grove: string;
  PlantationLandType: string;
  DashboardStatus: string;
  Assigned_plot: string;
  Tree_planted: string;
  Assigner_dashboard: string;
  Remarks_for_inventory: string;
    
}

interface DonationCreationAttributes extends Optional<DonationAttributes,  'Date_Recieved'> {}

@Table({ tableName: 'donations' })
class Donations extends Model<DonationAttributes, DonationCreationAttributes>
implements DonationAttributes {

      @Column({
        type: DataType.NUMBER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    })
    id!: number;

    @Column({
      type: DataType.STRING,
      allowNull: true,
      field: 'Date received'
    })
    Date_Recieved!: string;

    @Column({ type: DataType.STRING, allowNull: true , field: 'Name' })
    Name!: string;


    @Column({ type: DataType.STRING, allowNull: true  , field: 'Phone'})
    Phone!: string;


    @Column({ type: DataType.STRING, allowNull: true  , field: 'Donor Type'})
    Donor_type!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Email Address' })
    Email_Address!: string;


    @Column({ 
      type: DataType.STRING, 
      allowNull: true,
      field: 'PAN number needed to qualify for 80G benefit (and  for audit an' 
    
    })
    PAN!: string;


    @Column({ type: DataType.STRING, allowNull: true  , field: 'Pledged'})
    Pledged!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Land type' })
    Land_type!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Zone' })
    Zone!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Grove' })
    Grove!: string;


    @Column({ type: DataType.STRING, allowNull: true ,field: 'Please select your preference (if you want to spread your trees' })
    PlantationLandType!: string;

    
   
    @Column({ type: DataType.STRING, allowNull: true  , field: 'Status'})
    DashboardStatus!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Assigned plot' })
    Assigned_plot!: string;


    @Column({ type: DataType.STRING, allowNull: true , field: 'Tree planted' })
    Tree_planted!: string;



    @Column({ type: DataType.STRING, allowNull: true  , field:  `Assigner's dashboard`})
    Assigner_dashboard!: string;



    @Column({ type: DataType.STRING, allowNull: true  , field:`Remarks for inventory`})
    Remarks_for_inventory!: string;


    
}

export { Donations }
export type { DonationAttributes, DonationCreationAttributes }