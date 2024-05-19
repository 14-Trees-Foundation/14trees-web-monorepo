import { CorpEvent } from '../models/corp_events';

import { UploadFileToS3} from '../controllers/helper/uploadtos3'; // Assuming you have an upload helper
import { Tree } from '../models/tree';
import { Plot } from '../models/plot';
import { Request, Response } from 'express';

class CorpEventRepository {
  async addCorpEvent(req: Request, res: Response): Promise<void> {
    const fields = req.body;
    const saplingIds = fields.sapling_ids.split(/[ ,]+/);

    if (!fields.event_name || !fields.event_link || !fields.long_desc) {
      res.status(400).send({ error: "Required fields are missing" });
      return;
    }

    try {
      let treeIds: number[] = [];
      let logoUrls: string[] = [];

      if (req.body.logos) {
        const logos = req.body.logos.split(",");
        for (const logo of logos) {
          const location = await UploadFileToS3(logo, "logos");
          if (location) logoUrls.push(location);
        }
      }

      let headerImageUrls: string[] = [];
      if (req.body.header_img) {
        const headerImages = req.body.header_img.split(",");
        for (const headerImage of headerImages) {
          const location = await UploadFileToS3(headerImage, "logos");
          if (location) headerImageUrls.push(location);
        }
      }

      let memoryImageUrls: string[] = [];
      if (req.body.memoryimages) {
        const memoryImages = req.body.memoryimages.split(",");
        for (const memoryImage of memoryImages) {
          const location = await UploadFileToS3(memoryImage, "memories");
          if (location) memoryImageUrls.push(location);
        }
      }

      for (const saplingId of saplingIds) {
        const tree = await Tree.findOne({ where: { sapling_id: saplingId } });
        if (tree) treeIds.push(tree.id);
      }

      const event = await CorpEvent.create({
        
        event_link: req.body.event_link,
        event_name: req.body.event_name,
        tree_ids: treeIds,
        plot_id: req.body.plot_id,
        title: req.body.title,
        logo: logoUrls,
        short_desc: req.body.short_desc,
        long_desc: req.body.long_desc,
        album: memoryImageUrls,
        header_img: headerImageUrls,
        num_people: req.body.num_people || 1,
        date_added: req.body.date_org ? new Date(req.body.date_org) : new Date(),
      
      });
        
      

      res.status(201).send({ result: event });
    } catch (error: any) {
      console.error(error);
      res.status(500).send(error);
    }
  }

  async getCorpEvent(req: Request, res: Response): Promise<void> {
    const { offset, limit } = req.query;
    const event_id = req.query.event_id as string;
    
    if (!req.query.event_id) {
      res.status(400).send({ error: "Event ID required" });
      return;
    }

    try {
      const corpEvent = await CorpEvent.findOne({
        where: { event_link: event_id },
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
        ],
        offset: Number(offset),
        limit: Number(limit),
      });

      if (!corpEvent) {
        res.status(404).send({ error: "Event not found" });
        return;
      }

      res.status(200).json({ event: corpEvent });
    } catch (error) {
      res.status(500).send(error);
    }
  }

  async updateCorpEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.id;
      const fields = req.body;

      const event = await CorpEvent.findByPk(eventId);
      if (!event) {
        res.status(404).send({ error: "Event not found" });
        return;
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
        const treeIds: number[] = [];
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
      res.status(200).send({ event: updatedEvent });
    } catch (error) {
      console.error("Corp event update error:", error);
      res.status(500).send(error);
    }
  }

  async deleteCorpEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = await CorpEvent.findByPk(req.params.id);
      if (!event) {
        res.status(404).send({ error: "Event not found" });
        return;
      }

      await event.destroy();
      res.status(200).json({ message: "Corp event deleted successfully" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
}


