import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { Donation, DonationAttributes, DonationCreationAttributes } from '../models/donation'
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { QueryTypes } from 'sequelize';

export class DonationRepository {
   
    public static async getDonations(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<Donation>> {
        try {
            let whereConditions: string = "";
            let replacements: any = {};
    
            if (filters && filters.length > 0) {
                filters.forEach(filter => {
                    let columnField = "d." + filter.columnField;
                    if (filter.columnField === "user_name") {
                        columnField = "u.name";
                    }
                    const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                    whereConditions = whereConditions + " " + condition + " AND";
                    replacements = { ...replacements, ...replacement };
                });
                whereConditions = whereConditions.substring(0, whereConditions.length - 3);
            }
    
            const getQuery = `
                SELECT 
                    d.*,
                    u.name as user_name,
                    u.email as user_email,
                    u.phone as user_phone
                FROM "14trees_2".donations d
                LEFT JOIN "14trees_2".users u ON u.id = d.user_id
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
                ORDER BY d.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
            `;
    
            const countQuery = `
                SELECT COUNT(*) 
                FROM "14trees_2".donations d
                LEFT JOIN "14trees_2".users u ON u.id = d.user_id
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
            `;
    
            const [donations, donationsCount] = await Promise.all([
                sequelize.query(getQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT,
                    model: Donation // Add this line
                }),
                sequelize.query(countQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT
                })
            ]);
    
            return {
                offset: offset,
                total: parseInt((donationsCount[0] as any).count),
                results: donations as Donation[]
            };
        } catch (error) {
            console.error('[ERROR] DonationRepository::getDonations:', error);
            throw new Error('Failed to fetch donations');
        }
    }

    public static async getDonation(donationId: number): Promise<Donation> {
        const donationsResp = await this.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId }])
        if (donationsResp.results.length !== 1)
            throw new Error("Donation request for given id not found.")
        
        return donationsResp.results[0];
    }

    public static async createdDonation(donationData: DonationCreationAttributes): Promise<Donation> {
        try {
            donationData.created_at = new Date();
            donationData.updated_at = new Date();
    
            // Create donation with explicit field mapping
            const donation = await Donation.create(donationData);
            return donation;
        } catch (error: any) {
            console.error('[ERROR] DonationRepository::createdDonation:', error);
            throw new Error(`Failed to create donation: ${error.message}`);
        }
    }

    public static async deleteDonation(donationId: number): Promise<number> {
        try {
            // First check if donation exists
            const donation = await Donation.findByPk(donationId);
            if (!donation) {
                throw new Error('Donation not found');
            }
    
            // Delete the donation
            const result = await Donation.destroy({
                where: { id: donationId }
            });
    
            return result;
        } catch (error) {
            console.error('[ERROR] DonationRepository::deleteDonation:', error);
            throw new Error(`Failed to delete donation:`);
        }
    }

    public static async updateDonation(donationId: number, updateData: any): Promise<Donation> {

        try {
            // Find the donation by its primary key (id)
            const donation = await Donation.findByPk(donationId);
            if (!donation) {
                throw new Error('Donation not found for given id');
            }

            // Update the donation with provided data
            const [numRowsUpdated, updatedDonations] = await Donation.update(updateData, {
                where: { id: donationId},
                returning: true, // Ensure Sequelize returns the updated record(s)
            });

            if (numRowsUpdated === 0) {
                throw new Error('Failed to update donation');
            }

            return updatedDonations[0];
        } catch (error: any) {
            throw new Error(`Error updating donation: ${error.message}`);
        }
    }
}
