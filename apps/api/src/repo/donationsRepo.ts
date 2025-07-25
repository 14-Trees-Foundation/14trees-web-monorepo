import { sequelize } from '../config/postgreDB';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { Donation, DonationAttributes, DonationCreationAttributes } from '../models/donation'
import { FilterItem, PaginatedResponse } from "../models/pagination";
import { QueryTypes, WhereOptions } from 'sequelize';
import { Tree } from '../models/tree';
import { SortOrder } from '../models/common';
import { getSchema } from '../helpers/utils';

export class DonationRepository {

    public static async getDonations(offset: number, limit: number, filters?: FilterItem[], orderBy?: SortOrder[]): Promise<PaginatedResponse<Donation>> {
        try {
            let whereConditions: string = "";
            let replacements: any = {};
    
            if (filters && filters.length > 0) {
                filters.forEach(filter => {
                    let columnField = "d." + filter.columnField;
                    // Handle both donor user_name and processor user_name
                    if (filter.columnField === "user_name") {
                        columnField = "u.name"; // This is for the donor's name
                    } else if (filter.columnField === "processed_by_name") {
                        columnField = "pu.name"; // This is for the processor's name
                    } else if (filter.columnField === "id") {
                        // Handle id field - convert to text for string operations
                        columnField = "d.id::text";
                        // Convert id value to string for consistent comparison
                        filter.value = String(filter.value);
                    } else if (filter.columnField === "email_status") {
                        // Handle email status filter with custom logic
                        let emailConditions: string[] = [];
                        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
                        
                        values.forEach((value, index) => {
                            const placeholder = `email_status_${index}`;
                            if (value === "Mail sent to Sponsor") {
                                emailConditions.push(`(d.mail_status IS NOT NULL AND d.mail_status @> ARRAY[:${placeholder}]::varchar[])`);
                                replacements[placeholder] = 'DashboardsSent';
                            } else if (value === "Mail sent to Recipient") {
                                emailConditions.push(`(dus.mailed_count > 0 AND dus.mailed_count = dus.users_count)`);
                            } else if (value === "Mail sent to Sponsor, Mail sent to Recipient") {
                                emailConditions.push(`(d.mail_status IS NOT NULL AND d.mail_status @> ARRAY[:${placeholder}_sponsor]::varchar[] AND dus.mailed_count > 0 AND dus.mailed_count = dus.users_count)`);
                                replacements[`${placeholder}_sponsor`] = 'DashboardsSent';
                            } else if (value === "-") {
                                emailConditions.push(`((d.mail_status IS NULL OR NOT (d.mail_status @> ARRAY[:${placeholder}_sponsor]::varchar[])) AND (dus.mailed_count IS NULL OR dus.mailed_count = 0 OR dus.mailed_count < dus.users_count))`);
                                replacements[`${placeholder}_sponsor`] = 'DashboardsSent';
                            }
                        });
                        
                        if (emailConditions.length > 0) {
                            const emailCondition = filter.operatorValue === 'isAnyOf' ? 
                                `(${emailConditions.join(' OR ')})` : 
                                emailConditions.join(' AND ');
                            whereConditions = whereConditions + " " + emailCondition + " AND";
                        }
                        return; // Skip the normal processing for email_status
                    }
                    const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
                    whereConditions = whereConditions + " " + condition + " AND";
                    replacements = { ...replacements, ...replacement };
                });
                whereConditions = whereConditions.substring(0, whereConditions.length - 3);
            }

            const sortOrderQuery = orderBy && orderBy.length > 0 ? orderBy.map(order => `d.${order.column} ${order.order}`).join(', ') : 'd.id DESC';
    
            const getQuery = `
                WITH tree_counts AS (
                    SELECT 
                        donation_id,
                        COUNT(*) AS booked,
                        COUNT(assigned_to) AS assigned  -- NULLs ignored automatically
                    FROM "${getSchema()}".trees
                    GROUP BY donation_id
                ),
                donation_user_stats AS (
                    SELECT 
                        donation_id,
                        COUNT(DISTINCT id) AS users_count,
                        SUM(CASE WHEN mail_sent THEN 1 ELSE 0 END) AS mailed_count
                    FROM "${getSchema()}".donation_users
                    GROUP BY donation_id
                )

                SELECT 
                    d.*,
                    u.name AS user_name,
                    u.email AS user_email,
                    u.phone AS user_phone,
                    pu.name AS processed_by_name,
                    p.order_id AS order_id,
                    COALESCE(dus.mailed_count, 0) AS mailed_count,
                    COALESCE(dus.users_count, 0) AS users_count,
                    COALESCE(tc.booked, 0) AS booked,
                    COALESCE(tc.assigned, 0) AS assigned
                FROM "${getSchema()}".donations d
                LEFT JOIN "${getSchema()}".users u ON u.id = d.user_id
                LEFT JOIN "${getSchema()}".users pu ON pu.id = d.processed_by
                LEFT JOIN "${getSchema()}".payments p ON p.id = d.payment_id
                LEFT JOIN donation_user_stats dus ON dus.donation_id = d.id
                LEFT JOIN tree_counts tc ON tc.donation_id = d.id
                WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
                ORDER BY ${sortOrderQuery} ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
            `;
    
            const countQuery = `
                WITH donation_user_stats AS (
                    SELECT 
                        donation_id,
                        COUNT(DISTINCT id) AS users_count,
                        SUM(CASE WHEN mail_sent THEN 1 ELSE 0 END) AS mailed_count
                    FROM "${getSchema()}".donation_users
                    GROUP BY donation_id
                )
                SELECT COUNT(*) 
                FROM "${getSchema()}".donations d
                LEFT JOIN "${getSchema()}".users u ON u.id = d.user_id
                LEFT JOIN "${getSchema()}".users pu ON pu.id = d.processed_by
                LEFT JOIN "${getSchema()}".payments p ON p.id = d.payment_id
                LEFT JOIN donation_user_stats dus ON dus.donation_id = d.id
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
        const donationsResp = await this.getDonations(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: donationId.toString() }])
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
        const [numRowsUpdated, updatedDonations] = await Donation.update(updateData, {
            where: { id: donationId},
            returning: true,
        });

        if (numRowsUpdated === 0) {
            throw new Error('Donation not found or no changes made');
        }

        return updatedDonations[0];
    }

    public static async updateDonations(updateData: Partial<DonationAttributes>, whereClause: WhereOptions<Donation>): Promise<number> {
        const [affectedCount] = await Donation.update(updateData, {
            where: whereClause,
            returning: false,
        });

        return affectedCount;
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
            FROM "${getSchema()}".trees t
            LEFT JOIN "${getSchema()}".donation_users du on du.donation_id = t.donation_id AND du.recipient = t.gifted_to
            LEFT JOIN "${getSchema()}".users ru ON ru.id = t.gifted_to
            LEFT JOIN "${getSchema()}".users au ON au.id = t.assigned_to
            LEFT JOIN "${getSchema()}".user_relations ur ON ur.primary_user = t.gifted_to AND ur.secondary_user = t.assigned_to
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id
            WHERE ${whereConditions !== "" ? whereConditions : "1=1"}
            ORDER BY t.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
        `

        const data: any[] = await sequelize.query(getQuery, {
            type: QueryTypes.SELECT,
            replacements
        })

        const countQuery = `
            SELECT count(t.id)
            FROM "${getSchema()}".trees t
            LEFT JOIN "${getSchema()}".donation_users du on du.donation_id = t.donation_id AND du.recipient = t.gifted_to
            LEFT JOIN "${getSchema()}".users ru ON ru.id = t.gifted_to
            LEFT JOIN "${getSchema()}".users au ON au.id = t.assigned_to
            LEFT JOIN "${getSchema()}".plant_types pt ON pt.id = t.plant_type_id    
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
                    FROM "${getSchema()}".donations d,
                    unnest(d.tags) AS tag
                    ORDER BY tag
                    OFFSET ${offset} LIMIT ${limit};`;

            const countUniqueTagsQuery =
                `SELECT count(DISTINCT tag)
                    FROM "${getSchema()}".donations d,
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
