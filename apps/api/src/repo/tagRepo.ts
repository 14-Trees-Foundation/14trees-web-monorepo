
import { WhereOptions } from "sequelize";
import { PaginatedResponse } from "../models/pagination";
import { Tag, TagCreationAttributes } from "../models/tag";

export class TagRepository {

    static async createTags(tags: { tag: string, type: 'SYSTEM_DEFINED' | 'USER_DEFINED' }[]): Promise<Tag[]> {
        const data = tags.map(item => {
            return {
                tag: item.tag,
                type: item.type,
                created_at: new Date(),
                updated_at: new Date(),
            } as TagCreationAttributes
        })

        return await Tag.bulkCreate(data);
    }

    static async getTags(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<Tag>> {
        return {
            offset: offset,
            results: await Tag.findAll({ where: whereClause, offset: offset, limit: limit, order: [['id', 'DESC']] }),
            total: await Tag.count({ where: whereClause }),
        }
    }

}
