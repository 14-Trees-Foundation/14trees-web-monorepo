import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/postgreDB";

export class Contribution extends Model {
  public id!: number;
  public amount!: number;
  public currency!: string;
  public status!: string;
  public donorId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contribution.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    donorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "contributions",
  }
); 