import { QueryTypes } from "sequelize";
import { sequelize } from "../config/postgreDB";
import { getSchema } from "../helpers/utils";

type ActivityEntityType = 'tree' | 'plant_type' | 'pond' | 'pit';
type ActivityAction = 'create' | 'update' | 'delete';

type LogActivityInput = {
    entity_type: ActivityEntityType;
    action: ActivityAction;
    actor?: string | number | null;
    sapling_id?: string | null;
    plot_id?: number | null;
    plant_type_id?: number | null;
    planted_by?: number | null;
    metadata?: unknown;
}

export class ActivityLogService {
    static async logActivity(data: LogActivityInput): Promise<void> {
        const query = `
            INSERT INTO "${getSchema()}".activity_logs (
                entity_type,
                action,
                actor,
                plot_id,
                sapling_id,
                plant_type_id,
                planted_by,
                metadata
            ) VALUES (
                :entity_type,
                :action,
                :actor,
                :plot_id,
                :sapling_id,
                :plant_type_id,
                :planted_by,
                :metadata
            );
        `;

        const replacements = {
            entity_type: data.entity_type,
            action: data.action,
            actor: data.actor === undefined || data.actor === null ? null : String(data.actor),
            plot_id: data.plot_id ?? null,
            sapling_id: data.sapling_id ?? null,
            plant_type_id: data.plant_type_id ?? null,
            planted_by: data.planted_by ?? null,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        };

        await sequelize.query(query, {
            replacements,
            type: QueryTypes.INSERT,
        });
    }
}
