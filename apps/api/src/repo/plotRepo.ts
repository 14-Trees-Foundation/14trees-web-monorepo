import {Sequelize } from 'sequelize';
import { Plot } from '../models/plot'
import  Op  from 'sequelize';

export async function updatePlot(shortname: string, boundaries: string): Promise<Plot> {
  try {
      const result = await Plot.findOne({
          where: { plot_code: shortname }
      });
      if (!result) {
          throw new Error("Plot doesn't exist");
      }
      // result.boundaries = boundaries;
      // await result.save();
      return result;
  } catch (error) {
      throw error;
  }
}

export async function addPlot(plotName: string, plotCode: string, boundaries: string, center: string): Promise<Plot> {
  try {
      const plot = await Plot.create({
          plot_name: plotName,
          plot_code: plotCode,
          boundaries: boundaries,
          center: center,
          date_added: new Date()
      });
      return plot;
  } catch (error) {
      throw error;
  }
}

export async function getPlots(name?: string, offset: number = 0, limit: number = 10): Promise<Plot[]> {
  try {
      const filters: any = {};
      // if (name) {
      //     filters.plot_name = { [Sequelize.Op.iLike]: `%${name}%` };
      // }
      const result = await Plot.findAll({
          where: filters,
          offset: offset,
          limit: limit
      });
      return result;
  } catch (error) {
      throw error;
  }
}

export async function deletePlot(id: number): Promise<void> {
  try {
      await Plot.destroy({
          where: { id: id }
      });
  } catch (error) {
      throw error;
  }
}