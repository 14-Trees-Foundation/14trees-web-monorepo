
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

        const existingTags = await Tag.findAll({
            where: {
                tag: data.map(item => item.tag),
            },
            attributes: ['tag'],
        });

        const existingTagNames = existingTags.map(tag => tag.tag);

        const newTags = data.filter(item => !existingTagNames.includes(item.tag));
        if (newTags.length > 0) {
            return await Tag.bulkCreate(newTags);
        }

        return [];
    }

    static async getTags(offset: number, limit: number, whereClause: WhereOptions): Promise<PaginatedResponse<Tag>> {
        return {
            offset: offset,
            results: await Tag.findAll({ where: whereClause, offset: offset, limit: limit, order: [['id', 'DESC']] }),
            total: await Tag.count({ where: whereClause }),
        }
    }

}
