// import mongoose from "mongoose";
// import { MONGO_CREATE_INDEX_MAX_TIMEOUT } from "../services/mongo";

// const Schema = mongoose.Schema;

// const plotSchema = new Schema({
//   name: { type: String, required: true },
//   plot_id: { type: String, required: true, index: true, unique: true },
//   tags: [{ type: String }],
//   desc: { type: String },
//   boundaries: {
//     type: { type: String, default: "Polygon" },
//     coordinates: { type: [[[Number]]] },
//   },
//   center: {
//     type: { type: String, default: "Point" },
//     coordinates: { type: [Number], default: [0, 0] },
//   },
//   date_added: { type: Date },
// });

// const plotModel = mongoose.model("plots", plotSchema);

// plotModel.createIndexes({ maxTimeMS: MONGO_CREATE_INDEX_MAX_TIMEOUT }); //create index

// module.exports = plotModel;





//Model in postgresql db
import { Table, Column, Model, DataType, Unique, Index } from 'sequelize-typescript';

@Table({ 
  tableName: 'plots' 
}) // Set the table name


export class Plot extends Model {
    @Column({ type: DataType.STRING, allowNull: false })
    name!: string;

    @Unique
    @Index
    @Column({ type: DataType.STRING, allowNull: false })
    plot_id!: string;

    @Column({ type: DataType.ARRAY(DataType.STRING) })
    tags?: string[];

    @Column({ type: DataType.STRING })
    desc?: string;

    @Column({ type: DataType.JSONB })
    boundaries?: { type: string; coordinates: number[][][] };

    @Column({ type: DataType.JSONB })
    center?: { type: string; coordinates: number[] };

    @Column({ type: DataType.DATE })
    date_added?: Date;
}
