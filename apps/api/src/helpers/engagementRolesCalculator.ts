import { sequelize } from '../config/postgreDB';
import { QueryTypes } from 'sequelize';
import { EngagementRoles } from '../models/user';

/**
 * Calculate engagement roles for a specific user
 * Returns an object with boolean flags for different engagement types
 */
export async function calculateUserEngagementRoles(userId: number): Promise<EngagementRoles> {
    const query = `
        SELECT
            -- Sponsor: sponsored trees directly OR created gift card requests
            (EXISTS (SELECT 1 FROM trees WHERE sponsored_by_user = $1) OR
             EXISTS (SELECT 1 FROM gift_card_requests WHERE user_id = $1)) AS is_sponsor,

            -- Gifter: gifted trees OR created gift card requests with request_type = 'Gift Cards'
            (EXISTS (SELECT 1 FROM trees WHERE gifted_by = $1) OR
             EXISTS (SELECT 1 FROM gift_card_requests WHERE user_id = $1 AND request_type = 'Gift Cards')) AS is_gifter,

            -- Gift recipient: received gifted trees OR recipient in gift card requests where request_type = 'Gift Cards'
            (EXISTS (SELECT 1 FROM trees WHERE gifted_to = $1) OR
             EXISTS (SELECT 1 FROM gift_request_users gru
                     JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                     WHERE gru.recipient = $1 AND gcr.request_type = 'Gift Cards')) AS is_gift_recipient,

            -- Donation recipient: received trees from donations
            EXISTS (SELECT 1 FROM donation_users WHERE recipient = $1) AS is_donation_recipient,

            -- Visitor: gift_request_users with request_type = 'Visit' OR
            --          trees with assigned_to and 'visit' in description (historical)
            (EXISTS (SELECT 1 FROM gift_request_users gru
                     JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                     WHERE gru.recipient = $1 AND gcr.request_type = 'Visit') OR
             EXISTS (SELECT 1 FROM trees
                     WHERE assigned_to = $1
                     AND LOWER(description) LIKE '%visit%')) AS is_visitor,

            -- Normal assignment recipient: gift_request_users with request_type = 'Normal Assignment'
            EXISTS (SELECT 1 FROM gift_request_users gru
                    JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                    WHERE gru.recipient = $1 AND gcr.request_type = 'Normal Assignment') AS is_normal_assignment_recipient,

            -- Gift card gifter (assignee): gift_request_users with request_type = 'Gift Cards'
            EXISTS (SELECT 1 FROM gift_request_users gru
                    JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                    WHERE gru.assignee = $1 AND gcr.request_type = 'Gift Cards') AS is_gift_card_assignee
    `;

    const result = await sequelize.query<EngagementRoles>(query, {
        bind: [userId],
        type: QueryTypes.SELECT,
    });

    return result[0];
}

/**
 * Update engagement roles for a specific user
 * Calculates and stores the roles in the users table
 */
export async function updateUserEngagementRoles(userId: number): Promise<void> {
    const roles = await calculateUserEngagementRoles(userId);

    await sequelize.query(
        `UPDATE users SET engagement_roles = $1 WHERE id = $2`,
        {
            bind: [JSON.stringify(roles), userId],
            type: QueryTypes.UPDATE,
        }
    );
}

/**
 * Update engagement roles for all users
 * Used by cron job to periodically refresh all user engagement roles
 */
export async function updateAllUsersEngagementRoles(): Promise<{ updated: number }> {
    const updateQuery = `
        UPDATE users u
        SET engagement_roles = (
            SELECT json_build_object(
                'is_sponsor',
                (EXISTS (SELECT 1 FROM trees WHERE sponsored_by_user = u.id) OR
                 EXISTS (SELECT 1 FROM gift_card_requests WHERE user_id = u.id)),

                'is_gifter',
                (EXISTS (SELECT 1 FROM trees WHERE gifted_by = u.id) OR
                 EXISTS (SELECT 1 FROM gift_card_requests WHERE user_id = u.id AND request_type = 'Gift Cards')),

                'is_gift_recipient',
                (EXISTS (SELECT 1 FROM trees WHERE gifted_to = u.id) OR
                 EXISTS (SELECT 1 FROM gift_request_users gru
                         JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                         WHERE gru.recipient = u.id AND gcr.request_type = 'Gift Cards')),

                'is_donation_recipient',
                EXISTS (SELECT 1 FROM donation_users WHERE recipient = u.id),

                'is_visitor',
                (EXISTS (SELECT 1 FROM gift_request_users gru
                         JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                         WHERE gru.recipient = u.id AND gcr.request_type = 'Visit') OR
                 EXISTS (SELECT 1 FROM trees
                         WHERE assigned_to = u.id
                         AND LOWER(description) LIKE '%visit%')),

                'is_normal_assignment_recipient',
                EXISTS (SELECT 1 FROM gift_request_users gru
                        JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                        WHERE gru.recipient = u.id AND gcr.request_type = 'Normal Assignment'),

                'is_gift_card_assignee',
                EXISTS (SELECT 1 FROM gift_request_users gru
                        JOIN gift_card_requests gcr ON gru.gift_request_id = gcr.id
                        WHERE gru.assignee = u.id AND gcr.request_type = 'Gift Cards')
            )::jsonb
        )
    `;

    const result = await sequelize.query(updateQuery, {
        type: QueryTypes.UPDATE,
    });

    // result[1] contains the number of affected rows
    const updatedCount = Array.isArray(result) && result[1] !== undefined ? result[1] : 0;

    return { updated: updatedCount as number };
}
