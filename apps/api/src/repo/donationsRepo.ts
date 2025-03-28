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

    public static async createdDonation(donationData: DonationCreationAttributes): Promise<Donation> {
        try {
            // Validate required fields
            if (!donationData.user_id || 
                !donationData.preference_option || 
                !donationData.tree_count || 
                !donationData.contribution_options) {
                throw new Error('Missing required fields');
            }
    
            // Create donation with explicit field mapping
            const new_donation = await Donation.create({
                user_id: donationData.user_id,
                payment_id: donationData.payment_id || null,
                preference_option: donationData.preference_option,
                grove_type: donationData.grove_type,
                grove_type_other: donationData.grove_type_other,
                tree_count: donationData.tree_count,
                contribution_options: donationData.contribution_options,
                names_for_plantation: donationData.names_for_plantation || null,
                comments: donationData.comments || null
            });
    
            return new_donation;
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
