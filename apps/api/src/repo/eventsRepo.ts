import { Op } from 'sequelize';
import { Event, EventAttributes, EventCreationAttributes } from '../models/events';
import { WhereOptions } from 'sequelize';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getWhereOptions } from '../controllers/helper/filters';


export class EventRepository {
  public static async addEvent(data: EventCreationAttributes): Promise<Event> {
    data.created_at = data.updated_at = new Date();
    return await Event.create(data);
  }

  public static async getEvents(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<Event>> {

    let whereClause = {};
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
      })
    }

    const count = await Event.count({ where: whereClause });
    const events = await Event.findAll({
      where: whereClause,
      offset: offset,
      limit: limit
    })

    return { results: events, total: count, offset: offset };
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
    const resp = await Event.destroy({ where: { id: id } });
    console.log("Delete event response for event id: %s", id, resp);
  }
}

export default EventRepository;