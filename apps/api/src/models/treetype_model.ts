import { Model, Table, Column, DataType } from "sequelize-typescript";


//Create a table in database
@Table({
  tableName: "Tree_Type"
})

export class TreeType extends Model {
  public static TableName = "Tree_Type" ;
  public static ID = "id" ;
  public static saplingID = "saplingid" ;
  // public static TreeType_NAME = "name" ;
  // public static TreeType_DESCRIPTION = "description" ;
  // public static TreeType_scientific_name = "scientific_name" ;
  // public static TreeType_treetype_id = "treetype_id" ;
  // public static TreeType_image = "image" ;
  // public static TreeType_family = "family" ;
  // public static TreeType_habit = "habit" ;
  // public static TreeType_remarkable_char = "remarkable_char" ;
  // public static TreeType_med_use = "med_use" ;
  // public static TreeType_other_use = "other_use" ;
  // public static TreeType_food = "food" ;
  // public static TreeType_eco_value = "eco_value" ;
  // public static TreeType_parts_userd = "parts_userd" ;
  // public static TreeType_tags = "tags" ;
  // public static TreeType_desc = "desc" ;





  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: TreeType.ID,
  })
  id!: number;

  
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: TreeType.saplingID,
  })
  saplingid!: number;

//   @Column({
//     type: DataType.STRING(100),
//     field: TreeType.TreeType_NAME,
//   })
//   name!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_DESCRIPTION,
//   })
//   description!: string;



//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_scientific_name,
//   })
//   scientific_name!: string;

//   @Column({
//     type: DataType.INTEGER,
//     field: TreeType.TreeType_treetype_id
//   })
//   treetype_id!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_image,
//   })
//   image!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_family,
//   })
//   family!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_habit,
//   })
//   habit!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_remarkable_char,
//   })
//   remarkable_char!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_med_use,
//   })
//   med_use!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_other_use,
//   })
//   other_use!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_food,
//   })
//   food!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_eco_value,
//   })
//   eco_value!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_parts_userd,
//   })
//   parts_userd!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_tags,
//   })
//   tags!: string;

//   @Column({
//     type: DataType.STRING(255),
//     field: TreeType.TreeType_desc,
//   })
//   desc!: string;
// }
}