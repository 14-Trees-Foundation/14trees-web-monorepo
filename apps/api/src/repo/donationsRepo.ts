import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { Donation, DonationAttributes, DonationCreationAttributes } from '../models/donation'
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { QueryTypes } from 'sequelize';
import { Tree } from '../models/tree';
import { SortOrder } from '../models/common';
export class DonationRepository {
   
    public static async getDonations(offset: number, limit: number, filters?: FilterItem[], orderBy?: SortOrder[]): Promise<PaginatedResponse<Donation>> {
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

            const sortOrderQuery = orderBy && orderBy.length > 0 ? orderBy.map(order => `d.${order.column} ${order.order}`).join(', ') : 'd.id DESC';
    
            const getQuery = `
                SELECT 
                    d.*,
                    u.name as user_name,
                    u.email as user_email,
                    u.phone as user_phone,
                    count(t.mapped_to_user) as booked,
                    count(t.assigned_to) as assigned
                FROM "14trees".donations d
                LEFT JOIN "14trees".users u ON u.id = d.user_id
                LEFT JOIN "14trees".trees t ON t.donation_id = d.id
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
                GROUP BY d.id, u.id
                ORDER BY ${sortOrderQuery} ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
            `;
    
            const countQuery = `
                SELECT COUNT(*) 
                FROM "14trees".donations d
                LEFT JOIN "14trees".users u ON u.id = d.user_id
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
            `;
    
            const [donations, donationsCount] = await Promise.all([
                sequelize.query(getQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT,
                }),
                sequelize.query(countQuery, {
                    replacements: replacements,
                    type: QueryTypes.SELECT
                })
            ]);
    
            return {
                offset: offset,
                total: parseInt((donationsCount[0] as any).count),
                results: donations as any[]
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

    public static async updateDonation(donationId: number, updateData: Partial<DonationAttributes>): Promise<Donation> {

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


    public static async getDonationTrees(offset: number, limit: number, filters: FilterItem[]): Promise<PaginatedResponse<Tree>> {

        let whereConditions: string = "";
        let replacements: any = {}

        if (filters && filters.length > 0) {
            filters.forEach(filter => {
                let columnField = "t." + filter.columnField
                if (filter.columnField === "recipient_name") {
                    columnField = "ru.name"
                } else if (filter.columnField === "assignee_name") {
                    columnField = "au.name"
                } else if (filter.columnField === "plant_type") {
                    columnField = "pt.name"
                }
                
                const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                whereConditions = whereConditions + " " + condition + " AND";
                replacements = { ...replacements, ...replacement }
            })
            whereConditions = whereConditions.substring(0, whereConditions.length - 3);
        }

        const getQuery = `
            SELECT t.id, t.sapling_id, t.assigned_to as assignee, t.gifted_to as recipient, t.assigned_to as assigned, pt.name as plant_type, pt.scientific_name,
            ru.name as recipient_name, ru.email as recipient_email, ru.phone as recipient_phone,
            au.name as assignee_name, au.email as assignee_email, au.phone as assignee_phone,
            ur.relation, du.mail_sent
            FROM "14trees".trees t
            LEFT JOIN "14trees".donation_users du on du.donation_id = t.donation_id AND du.recipient = t.gifted_to
            LEFT JOIN "14trees".users ru ON ru.id = t.gifted_to
            LEFT JOIN "14trees".users au ON au.id = t.assigned_to
            LEFT JOIN "14trees".user_relations ur ON ur.primary_user = t.gifted_to AND ur.secondary_user = t.assigned_to
            LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY t.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(t.id)
            FROM "14trees".trees t
            LEFT JOIN "14trees".donation_users du on du.donation_id = t.donation_id AND du.recipient = t.gifted_to
            LEFT JOIN "14trees".users ru ON ru.id = t.gifted_to
            LEFT JOIN "14trees".users au ON au.id = t.assigned_to
            LEFT JOIN "14trees".plant_types pt ON pt.id = t.plant_type_id    
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"};
        `

        const countData: any[] = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        return {
            offset: offset,
            total: parseInt(countData[0].count),
            results: data
        };
    }

    public static async getDonationTags(offset: number, limit: number): Promise<PaginatedResponse<string>> {
        try {
            const tags: string[] = [];

            const getUniqueTagsQuery = 
                `SELECT DISTINCT tag
                    FROM "14trees".donations d,
                    unnest(d.tags) AS tag
                    ORDER BY tag
                    OFFSET ${offset} LIMIT ${limit};`;

            const countUniqueTagsQuery = 
                `SELECT count(DISTINCT tag)
                    FROM "14trees".donations d,
                    unnest(d.tags) AS tag;`;

            const tagsResp: any[] = await sequelize.query(getUniqueTagsQuery, { type: QueryTypes.SELECT });
            tagsResp.forEach(r => tags.push(r.tag));

            const countResp: any[] = await sequelize.query(countUniqueTagsQuery, { type: QueryTypes.SELECT });
            const total = parseInt(countResp[0].count);
            return { offset: offset, total: total, results: tags };
        } catch (error) {
            console.error('[ERROR] DonationRepository::getDonationTags:', error);
            throw new Error('Failed to fetch donation tags');
        }
    }
}
