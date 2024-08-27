import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface VisitUsersAttributes {
	
  visit_id: number;
  user_id: number;
	created_at: Date;
}

interface VisitUsersCreationAttributes
	extends VisitUsersAttributes {}

  @Table({ tableName: 'visit_users' })
  class VisitUsers extends Model<VisitUsersAttributes, VisitUsersCreationAttributes>
  implements VisitUsersAttributes {
  

    @Column({
      type: DataType.NUMBER,
      primaryKey: true,
      
    })
    visit_id!: number;

    @Column({
      type: DataType.NUMBER,
      primaryKey: true,
      
    })
    user_id!: number;
  
  
    @Column(DataType.DATE)
    created_at!: Date;
  }
  
 export { VisitUsers }
export type { VisitUsersAttributes, VisitUsersCreationAttributes }