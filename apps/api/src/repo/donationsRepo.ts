import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { Donation, DonationAttributes, DonationCreationAttributes } from '../models/donation'
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { QueryTypes } from 'sequelize';

export class DonationRepository {

    public static async getDonations(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<Donation>> {
        let whereConditions: string = "";
        let replacements: any = {}
    
        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "d." + filter.columnField
                if (filter.columnField === "user_name") {
                    columnField = "u.name"
                }
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }
    
        const getQuery = `
            SELECT 
                d.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                p.status as payment_status
            FROM "14trees_2".donations d
            LEFT JOIN "14trees_2".users u ON u.id = d.user_id
            LEFT JOIN "14trees_2".payments p ON p.id = d.payment_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY d.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `
    
        const countQuery = `
            SELECT COUNT(*) 
            FROM "14trees_2".donations d
            LEFT JOIN "14trees_2".users u ON u.id = d.user_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `
    
        try {
            const donations: any[] = await sequelize.query(getQuery, {
                replacements: replacements,
                type: QueryTypes.SELECT
            });
    
            const donationsCount: any = await sequelize.query(countQuery, {
                replacements: replacements,
                type: QueryTypes.SELECT
            });
    
            const totalResults = parseInt(donationsCount[0].count);
    
            return {
                offset: offset,
                total: totalResults,
                results: donations
            };
        } catch (error) {
            console.error('[ERROR] DonationRepository::getDonations:', error);
            throw new Error('Failed to fetch donations');
        }
    }

    public static async createdDonation(donationData: DonationCreationAttributes): Promise<Donation> {
        const new_donation = Donation.create(donationData);
        return new_donation;
    }

    public static async deleteDonation(donationId: number): Promise<number> {
        const result = await Donation.destroy({ where: { id: donationId } });
        return result;
    }

    public static async updateDonation(DonationData: DonationAttributes): Promise<Donation> {

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
