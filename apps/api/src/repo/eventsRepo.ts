import { Op, QueryTypes } from 'sequelize';
import { Event, EventAttributes, EventCreationAttributes } from '../models/events';
import { WhereOptions } from 'sequelize';
import { FilterItem, PaginatedResponse } from '../models/pagination';
import { getSqlQueryExpression } from '../controllers/helper/filters';
import { EventMessage, EventMessageCreationAttributes } from '../models/event_message';
import { sequelize } from '../config/postgreDB';
import { getSchema } from '../helpers/utils';
import { Tree } from '../models/tree';
import { User } from '../models/user';
import { EventView } from '../models/eventViews';


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

  public static async updateEvent(eventData: Partial<EventAttributes> & { id: number }): Promise<Event> {
    const event = await Event.findByPk(eventData.id);
    if (!event) {
      throw new Error('Event not found for given id');
    }

    const updatedEvent = await event.update(eventData);
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
      where: { event_id: eventId },
      include: [
        {
          model: User,
          attributes: ['name'],
          required: false // LEFT JOIN to handle messages without users
        }
      ],
      order: [['sequence', 'ASC'], ['created_at', 'ASC']]
    });

    // Map the results to include user_name from the joined User model
    return messages.map(message => {
      const messageData = message.toJSON() as any;
      if (messageData.User && messageData.User.name) {
        messageData.user_name = messageData.User.name;
      } else {
        messageData.user_name = messageData.user_name ??  'System';
      }
      delete messageData.User; // Remove the nested User object
      return messageData;
    });
  }

  public static async createEventMessage(eventId: number, message: string, userId: number, user_name: string): Promise<EventMessage> {
    try {
      // Get the current max sequence for this event
      const maxSequenceResult = await EventMessage.findOne({
        where: { event_id: eventId },
        order: [['sequence', 'DESC']],
        attributes: ['sequence']
      });

      const nextSequence = maxSequenceResult ? maxSequenceResult.sequence + 1 : 0;

      // Get the user name
      let userName = user_name ?? '';
      if(userId) {
        const user = await User.findByPk(userId, { attributes: ['name'] });
        userName = user ? user.name : 'System';
      }


      const messageData: EventMessageCreationAttributes = {
        event_id: eventId,
        message: message,
        user_id: userId ?? null,
        user_name: userName,
        sequence: nextSequence
      };

      const createdMessage = await EventMessage.create(messageData);
      return createdMessage;
    } catch (error) {
      console.error('[ERROR] EventRepository::createEventMessage', error);
      throw error;
    }
  }

  public static async updateEventMessage(messageId: number, message: string): Promise<EventMessage> {
    try {
      const eventMessage = await EventMessage.findByPk(messageId);
      if (!eventMessage) {
        throw new Error('Event message not found');
      }

      eventMessage.message = message;
      await eventMessage.save();
      return eventMessage;
    } catch (error) {
      console.error('[ERROR] EventRepository::updateEventMessage', error);
      throw error;
    }
  }

  public static async deleteEventMessage(messageId: number): Promise<void> {
    try {
      const result = await EventMessage.destroy({
        where: { id: messageId }
      });
      
      if (result === 0) {
        throw new Error('Event message not found');
      }
    } catch (error) {
      console.error('[ERROR] EventRepository::deleteEventMessage', error);
      throw error;
    }
  }

  public static async reorderEventMessages(eventId: number, messageSequences: {id: number, sequence: number}[]): Promise<void> {
    try {
      // Update each message's sequence
      for (const item of messageSequences) {
        await EventMessage.update(
          { sequence: item.sequence },
          { 
            where: { 
              id: item.id,
              event_id: eventId // Ensure we only update messages for this event
            }
          }
        );
      }
    } catch (error) {
      console.error('[ERROR] EventRepository::reorderEventMessages', error);
      throw error;
    }
  }

  // Tree Association Methods
  public static async getEventTrees(eventId: number): Promise<Tree[]> {
    try {
      const trees = await Tree.findAll({
        where: { event_id: eventId },
        order: [['id', 'ASC']]
      });
      return trees;
    } catch (error) {
      console.error('[ERROR] EventRepository::getEventTrees', error);
      throw error;
    }
  }

  public static async associateTreesToEvent(eventId: number, treeIds: number[]): Promise<void> {
    try {
      await Tree.update(
        { event_id: eventId },
        { 
          where: { 
            id: {
              [Op.in]: treeIds
            }
          }
        }
      );
    } catch (error) {
      console.error('[ERROR] EventRepository::associateTreesToEvent', error);
      throw error;
    }
  }

  public static async dissociateTreesFromEvent(eventId: number, treeIds: number[]): Promise<void> {
    try {
      await Tree.update(
        { event_id: null },
        {
          where: {
            id: {
              [Op.in]: treeIds
            },
            event_id: eventId // Ensure we only update trees currently associated with this event
          }
        }
      );
    } catch (error) {
      console.error('[ERROR] EventRepository::dissociateTreesFromEvent', error);
      throw error;
    }
  }

  // View Tracking Methods
  public static async trackEventView(
    eventId: number,
    visitorId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Try to insert the view record
      // If it already exists (same event + visitor), it will be ignored due to unique constraint
      const [viewRecord, created] = await EventView.findOrCreate({
        where: {
          event_id: eventId,
          visitor_id: visitorId
        },
        defaults: {
          event_id: eventId,
          visitor_id: visitorId,
          ip_address: ipAddress,
          user_agent: userAgent
        }
      });

      // Always increment total_views
      await Event.increment('total_views', { where: { id: eventId } });

      // Only increment unique_views if this is a new visitor
      if (created) {
        await Event.increment('unique_views', { where: { id: eventId } });
      }
    } catch (error) {
      console.error('[ERROR] EventRepository::trackEventView', error);
      throw error;
    }
  }
}

export default EventRepository;