import { Optional } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

interface VisitAttributes {
  id: number;
  visit_name: string;
  visit_date: Date;

}


interface VisitCreationAttributes 
    extends Optional<VisitAttributes, 'id'> {}

 @Table({ tableName: 'visits' })
 class Visit
 extends Model<VisitAttributes, VisitCreationAttributes>
 implements VisitAttributes {
     @Column({
       type: DataType.NUMBER,
       allowNull: false,
       autoIncrement: true,
       primaryKey: true,
       unique: true
     })
     id!: number;
 
     @Column({ type: DataType.STRING})
     visit_name!: string;
 
     
     @Column({ type: DataType.DATE })
     visit_date!: Date;
 
    }  

    export { Visit }
export type { VisitAttributes, VisitCreationAttributes }