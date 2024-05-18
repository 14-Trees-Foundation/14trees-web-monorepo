
import {OnSiteStaff} from '../models/onsitestaff'


export class OnSiteStaffRepository {
  constructor(private model: typeof OnSiteStaff) {}

  public async getOnSiteStaffs(offset: number, limit: number, filters: any): Promise<OnSiteStaff[]> {
    return this.model.findAll({
      where: filters,
      offset,
      limit,
    });
  }

  public async addOnSiteStaff(data: any): Promise<OnSiteStaff> {
    return this.model.create(data);
  }

  public async updateOnSiteStaff(id: number, data: any): Promise<[number, OnSiteStaff[]]> {
    return this.model.update(data, {
      where: { id },
      returning: true,
    });
  }

  public async deleteOnSiteStaff(id: number): Promise<number> {
    return this.model.destroy({
      where: { id },
    });
  }
}