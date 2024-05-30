import { Op } from 'sequelize';
import { Event, EventCreationAttributes } from '../models/events';
// import { UserTree } from '../models/UserTree';
// import { User } from '../models/User';
// import { Tree } from '../models/Tree';
// import uploadHelper from '../helpers/uploadHelper';
import { Request, Response } from 'express';

export class EventRepository {
  public async addEvent(fields: any): Promise<Event> {
    if (fields.type === "1" || fields.type === "2" || fields.type === "3") {

      const event = await Event.create({
        name: fields.name,
        assigned_by: fields.assigned_by,
        plot_id: fields.plot_id as number,
        type: fields.type,
        description: fields.description,
        event_location: fields.event_location ?? 'onsite',
        site_id: fields.site_id,
        event_date: fields.event_date ?? new Date(),
      } as EventCreationAttributes);

      return event;
    } else {
      throw new Error("Invalid event type");
    }
  }

  public static async getEvents(query: any, offset: number, limit: number): Promise<Event[]> {
    const whereClause: Record<string, any> = {};
    if (query.name) {
      whereClause.name = { [Op.iLike]: `%${query.name}%` };
    }
    if (query.type) {
      whereClause.type = { [Op.iLike]: `%${query.type}%` };
    }

    const events = await Event.findAll({
      where: whereClause,
      offset: offset,
      limit: limit
    })
    return events;
  }

  public static async deleteEvent(id: string): Promise<void> {
    const resp = await Event.destroy({ where: { id: id }});
    console.log("Delete event response for event id: %s", id, resp);
  }
}

export default EventRepository;