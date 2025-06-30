import { QueryTypes } from 'sequelize';
import { Pond, PondAttributes, PondCreationAttributes } from '../models/pond';
import { UploadFileToS3 } from "../controllers/helper/uploadtos3";
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { sequelize } from '../config/postgreDB';
import { getSchema } from '../helpers/utils';

export class PondRepository {
  public static async addPond(data: any, files?: Express.Multer.File[]): Promise<Pond> {

    let pondImageUrl: string | null = null;
    if (files && files.length !== 0) {
      const location = await UploadFileToS3(files[0].filename, "ponds", data.name);
      if (location !== "") pondImageUrl = location;
    }

    let obj: PondCreationAttributes = {
      name: data.name,
      site_id: data.site_id,
      length_ft: data.length_ft,
      depth_ft: data.depth_ft,
      width_ft: data.width_ft,
      type: data.type,
      tags: data.tags,
      boundaries: data.boundaries,
      image: pondImageUrl,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const pondRes = await Pond.create(obj);

    const pondResp = await this.getPonds(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: pondRes.id.toString() }])
    return pondResp.results[0] || pondRes;
  }

  public static async updatePond(data: PondAttributes, files?: Express.Multer.File[]): Promise<Pond> {

    if (files && files.length !== 0) {
      const location = await UploadFileToS3(files[0].filename, "ponds", data.name);
      if (location !== "") data.image = location
    }

    const pond = await Pond.findByPk(data.id);
    if (!pond) {
      throw new Error("Pond not found")
    }
    const updatedPond = await pond.update(data);
    const pondResp = await this.getPonds(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: updatedPond.id.toString() }])
    return pondResp.results[0] || updatedPond;
  }

  public static async getPonds(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<Pond>> {
    let whereCondition = "";
    let replacements: any = {}
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "p." + filter.columnField
        if (filter.columnField === 'site_name') columnField = 's.name_english';
        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
        whereCondition = whereCondition + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereCondition = whereCondition.substring(0, whereCondition.length - 3);
    }

    const query = `
        SELECT p.*,
            s.name_english as site_name
        FROM "${getSchema()}".ponds p
        LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"}
        ORDER BY p.id DESC
        OFFSET ${offset} ${limit === -1 ? "" : `LIMIT ${limit}`};
        `

    const countPondsQuery =
      `SELECT count(p.id)
        FROM "${getSchema()}".ponds AS p
        LEFT JOIN "${getSchema()}".sites s ON p.site_id = s.id
        WHERE ${whereCondition !== "" ? whereCondition : "1=1"};`

    const ponds: any = await sequelize.query(query, {
      replacements: replacements,
      type: QueryTypes.SELECT
    })

    const countPonds: any = await sequelize.query(countPondsQuery, {
      replacements: replacements,
      type: QueryTypes.SELECT
    })
    const totalResults = parseInt(countPonds[0].count)

    return { offset: offset, total: totalResults, results: ponds as Pond[] };
  }

  public static async deletePond(pondId: string): Promise<number> {
    return await Pond.destroy({ where: { id: pondId } });
  }

  public static async pondsCount(): Promise<number> {
    return await Pond.count()
  }
}
