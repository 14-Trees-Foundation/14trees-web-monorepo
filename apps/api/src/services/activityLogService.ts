import { QueryTypes } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { getSchema } from "../helpers/utils";

type ActivityEntityType = 'tree' | 'plant_type' | 'pond' | 'pit';
type ActivityAction = 'create' | 'update' | 'delete';

type LogActivityInput = {
    entity_type: ActivityEntityType;
    entity_id: number;
    action: ActivityAction;
    sapling_id?: string | null;
    plot_id?: number | null;
    plant_type_id?: number | null;
    planted_by?: number | null;
    metadata?: unknown;
    actor?: string | number | null;
}

export class ActivityLogService {
    static async logActivity(data: LogActivityInput): Promise<void> {
        const query = `
            INSERT INTO "${getSchema()}".activity_logs (
                entity_type,
                entity_id,
                action,
                sapling_id,
                plot_id,
                plant_type_id,
                planted_by,
                metadata,
                actor
            ) VALUES (
                :entity_type,
                :entity_id,
                :action,
                :sapling_id,
                :plot_id,
                :plant_type_id,
                :planted_by,
                :metadata,
                :actor
            );
        `;

        await sequelize.query(query, {
            replacements: {
                ...data,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                actor: data.actor === undefined || data.actor === null ? null : String(data.actor),
            },
            type: QueryTypes.INSERT,
        });
    }
}
