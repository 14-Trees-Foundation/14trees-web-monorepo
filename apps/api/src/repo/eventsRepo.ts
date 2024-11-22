import { Op } from 'sequelize';
import { Event, EventAttributes, EventCreationAttributes } from '../models/events';
import { WhereOptions } from 'sequelize';
import { PaginatedResponse } from '../models/pagination';


export class EventRepository {
  public static async addEvent(data: EventCreationAttributes): Promise<Event> {
    data.created_at = data.updated_at = new Date();
    return await Event.create(data);
  }

  public static async getEvents(query: any, offset: number, limit: number  , whereClause: any): Promise<PaginatedResponse<Event>> {
    
    // const whereClause: Record<string, any> = {};
    if (query.name) {
      whereClause.name = { [Op.iLike]: `%${query.name}%` };
    }
    if (query.type) {
      whereClause.type = { [Op.iLike]: `%${query.type}%` };
    }

    const count = await Event.count({ where: whereClause });

    const events = await Event.findAll({
      where: whereClause,
      
      offset: offset,
      limit: limit
    })


    return {  results :  events ,total: count, offset: offset };
  }

  public static async updateEvent(eventData: EventAttributes): Promise<Event> {
    const event = await Event.findByPk(eventData.id);
    if (!event) {
        throw new Error('Event not found for given id');
    }

    const updatedEvent = event.update(eventData);
    return updatedEvent;
  }

  public static async updateEvents(fields: any, whereClause: WhereOptions<Event>): Promise<void> {
    await Event.update(fields, { where: whereClause });
  }

  public static async deleteEvent(id: string): Promise<void> {
    const resp = await Event.destroy({ where: { id: id }});
    console.log("Delete event response for event id: %s", id, resp);
  }
}

export default EventRepository;