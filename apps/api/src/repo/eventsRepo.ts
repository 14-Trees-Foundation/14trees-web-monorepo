import { Op, QueryTypes } from 'sequelize';
import { Event, EventAttributes, EventCreationAttributes } from '../models/events';
import { WhereOptions } from 'sequelize';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { EventMessage } from '../models/event_message';
import { sequelize } from '../config/postgreDB';
import { getSchema } from '../helpers/utils';


export class EventRepository {
  public static async addEvent(data: EventCreationAttributes): Promise<Event> {
    data.created_at = data.updated_at = new Date();
    return await Event.create(data);
  }

  public static async getEvents(offset: number, limit: number, filters?: FilterItem[]): Promise<PaginatedResponse<Event>> {

    let whereConditions: string = "";
    let replacements: any = {}

    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        let columnField = "e." + filter.columnField
        if (filter.columnField === "site_name") {
          columnField = "s.name_english"
        }
        const { condition, replacement } = getSqlQueryExpression(columnField, filter.operatorValue, filter.columnField, filter.value);
        whereConditions = whereConditions + " " + condition + " AND";
        replacements = { ...replacements, ...replacement }
      })
      whereConditions = whereConditions.substring(0, whereConditions.length - 3);
    }

    const getQuery = `
      SELECT e.*, s.name_english as site_name
      FROM "${getSchema()}".events e
      LEFT JOIN "${getSchema()}".sites s ON s.id = e.site_id
      WHERE e."name" IS NOT NULL AND e.link IS NOT NULL AND ${whereConditions !== "" ? whereConditions : "1=1"}
      ORDER BY e.id DESC ${limit === -1 ? "" : `LIMIT ${limit} OFFSET ${offset}`};
    `

    const countQuery = `
      SELECT COUNT(*) 
      FROM "${getSchema()}".events e
      LEFT JOIN "${getSchema()}".sites s ON s.id = e.site_id
      WHERE e."name" IS NOT NULL AND e.link IS NOT NULL AND ${whereConditions !== "" ? whereConditions : "1=1"};
    `

    const events: any[] = await sequelize.query(getQuery, {
      type: QueryTypes.SELECT,
      replacements: replacements,
    })

    const countResp: any[] = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements: replacements,
    })

    const totalResults = parseInt(countResp[0].count)

    return {
      offset: offset,
      total: totalResults,
      results: events
    };
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

  public static async getEventMessages(eventId: number): Promise<EventMessage[]> {

    const messages = await EventMessage.findAll({
      where: { event_id: eventId }
    });

    return messages;
  }
}

export default EventRepository;