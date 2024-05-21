
import { OnsiteStaff, OnsiteStaffCreationAttributes } from '../models/onsitestaff'


export class OnsiteStaffRepository {

  public static async getOnsiteStaffs(offset: number, limit: number): Promise<OnsiteStaff[]> {
    return OnsiteStaff.findAll({
      offset,
      limit,
    });
  }

  public static async addOnsiteStaff(data: any): Promise<OnsiteStaff> {
    const staffObj: OnsiteStaffCreationAttributes = {
        id: "",
        name: data.name,
        email: data.email,
        user_id: data.user_id,
        phone: data.phone,
        permissions: data.permissions,
        role: data.role,
        dob: data.dob,
        date_added: new Date(),
    }
    return OnsiteStaff.create(staffObj);
  }

  public static async updateOnsiteStaff(data: any): Promise<OnsiteStaff> {
    const staff = await OnsiteStaff.findByPk(data.id);
    if (!staff) {
      throw new Error("OnsiteStaff not found")
    }
    const updatedStaff = await staff.update(data);
    return updatedStaff;
  }

  public static async deleteOnsiteStaff(id: string): Promise<number> {
    return OnsiteStaff.destroy({
      where: { id: id },
    });
  }
}