import { Shift, ShiftAttributes, ShiftCreationAttributes } from '../models/shift';
import { WhereOptions } from 'sequelize'
export class ShiftRepository {

    static async addShift(data: ShiftCreationAttributes): Promise<Shift> {
        return await Shift.create(data);
    }

    static async updateSift(data: Shift): Promise<Shift> {
        const shift = await Shift.findByPk(data.id);
        if (!shift) {
            throw new Error("Shift not found")
        }

        const updatedShift = await shift.update(data);
        return updatedShift;
    }

    static async getShifts(whereClause: WhereOptions): Promise<Shift[]> {
        return await Shift.findAll({ where: whereClause, order: [['id', 'DESC']] });
    }
}
