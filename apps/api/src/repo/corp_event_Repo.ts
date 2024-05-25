import { CorpEvent, CorpEventCreationAttributes } from '../models/corp_events';

import { UploadFileToS3 } from '../controllers/helper/uploadtos3'; // Assuming you have an upload helper
import { Tree } from '../models/tree';
import { Plot } from '../models/plot';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

class CorpEventRepository {

    public static async addCorpEvent(fields: any): Promise<CorpEvent> {

        const saplingIds = fields.sapling_ids.split(/[ ,]+/);
        if (!fields.event_name || !fields.event_link || !fields.long_desc) {
            throw new Error("Required fields are missing");
        }

        let logoUrls: string[] = [];
        if (fields.logos) {
            const logos = fields.logos.split(",");
            for (const logo of logos) {
                const location = await UploadFileToS3(logo, "logos");
                if (location) logoUrls.push(location);
            }
        }

        let headerImageUrls: string[] = [];
        if (fields.header_img) {
            const headerImages = fields.header_img.split(",");
            for (const headerImage of headerImages) {
                const location = await UploadFileToS3(headerImage, "logos");
                if (location) headerImageUrls.push(location);
            }
        }

        let memoryImageUrls: string[] = [];
        if (fields.memoryimages) {
            const memoryImages = fields.memoryimages.split(",");
            for (const memoryImage of memoryImages) {
                const location = await UploadFileToS3(memoryImage, "memories");
                if (location) memoryImageUrls.push(location);
            }
        }

        const trees = await Tree.findAll({ where: { sapling_id: { [Op.in]: saplingIds } } });
        const treeIds = trees.map((tree) => { return tree.id });

        const corpEventData: CorpEventCreationAttributes = {
            id: "",
            event_link: fields.event_link,
            event_name: fields.event_name,
            tree_ids: treeIds,
            plot_id: fields.plot_id,
            title: fields.title,
            logo: logoUrls,
            short_desc: fields.short_desc,
            long_desc: fields.long_desc,
            album: memoryImageUrls,
            header_img: headerImageUrls[0],
            num_people: fields.num_people || 1,
            date_added: fields.date_org ? new Date(fields.date_org) : new Date(),
        };

        const corpEvent = await CorpEvent.create(corpEventData);
        return corpEvent;
    }

    public static async getCorpEvent(eventId: string) {
        return await CorpEvent.findOne({
            where: { event_link: eventId },
            include: [
                {
                    model: Tree,
                    include: [
                        {
                            model: Plot,
                            attributes: ['name'],
                        },
                    ],
                },
            ]
        });
    }

    public static async updateCorpEvent(eventId: string, fields: any): Promise<CorpEvent> {

        const event = await CorpEvent.findByPk(eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        if (fields.logos) {
            const logos = fields.logos.split(",");
            const logoUrls = await UploadFileToS3(logos, "logos");
            event.logo = Array.isArray(logoUrls) ? logoUrls : [logoUrls];
        }

        if (fields.header_img) {
            const headerImages = fields.header_img.split(",");
            const headerImgUrls = await UploadFileToS3(headerImages, "logos");
            event.header_img = headerImgUrls;
        }

        if (fields.memoryimages) {
            const memoryImages = fields.memoryimages.split(",");
            const memoryImgUrls = await UploadFileToS3(memoryImages, "memories");
            event.album = Array.isArray(memoryImgUrls) ? memoryImgUrls : [memoryImgUrls];
        }

        if (fields.event_link) event.event_link = fields.event_link;
        if (fields.event_name) event.event_name = fields.event_name;
        if (fields.sampling_ids) {
            const saplingIds = fields.sapling_ids.split(/[ ,]+/);
            const treeIds: string[] = [];
            for (const saplingId of saplingIds) {
                const tree = await Tree.findOne({ where: { sapling_id: saplingId } });
                if (tree) treeIds.push(tree.id);
            }
            event.tree_ids = treeIds;
        }
        if (fields.plot_id) event.plot_id = fields.plot_id;
        if (fields.title) event.title = fields.title;
        if (fields.short_desc) event.short_desc = fields.short_desc;
        if (fields.long_desc) event.long_desc = fields.long_desc;
        if (fields.num_people) event.num_people = fields.num_people;

        const updatedEvent = await event.save();
        return updatedEvent;
    }

    public static async deleteCorpEvent(id: string): Promise<void> {
        const resp = await CorpEvent.destroy({ where: { id: id } });
        console.log("Delete corp event response for corp event id: %s", id, resp);
    }
}

export default CorpEventRepository;