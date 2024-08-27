import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { Donation , DonationAttributes, DonationCreationAttributes} from '../models/donation'
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { QueryTypes } from 'sequelize';

export class DonationRepository {
 
    public static async getDonations(offset: number = 0, limit: number = 20 , filters: FilterItem[]): Promise<PaginatedResponse<Donation>> {
        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "d." + filter.columnField
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const query = `
            SELECT d.*, count(t.id) as assigned_trees
            FROM "14trees".donations as d
            LEFT JOIN "14trees".trees as t on t.donation_id = d.id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            GROUP BY d.id
            ORDER BY d.id DESC
            OFFSET ${offset} LIMIT ${limit};
        `

        const countQuery = `
            SELECT count(*)
            FROM "14trees".donations as d
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const donations: any = await sequelize.query(query, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })

        const countDonations: any = await sequelize.query(countQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        })
        const totalResults = parseInt(countDonations[0].count)

        return {
            results: donations,
            total: totalResults,
            offset: offset
        }
       
    }

    public static async addDonation(donationData: DonationCreationAttributes ): Promise<Donation> {
        const new_donation = Donation.create(donationData);
        return new_donation;
    }

    public static async deleteDonation(donationId: string): Promise<number>{
           const result = await Donation.destroy({ where : {id : donationId} });
           return result;
    }

    public static async updateDonation(DonationData: DonationAttributes): Promise<Donation>{
       
        try {
            // Find the donation by its primary key (id)
            const donation = await Donation.findByPk(DonationData.id);
    
            if (!donation) {
                throw new Error('Donation not found for given id');
            }
    
            // Update the donation with provided data
            const [numRowsUpdated, updatedDonations] = await Donation.update(DonationData, {
                where: { id: DonationData.id }, // Specify the condition for which record(s) to update
                returning: true, // Ensure Sequelize returns the updated record(s)
            });
    
            if (numRowsUpdated === 0) {
                throw new Error('Failed to update donation');
            }
    
            // Sequelize returns an array when using returning: true, so we take the first element
            return updatedDonations[0];
        } catch (error: any) {
            throw new Error(`Error updating donation: ${error.message}`);
        }
    }
}
