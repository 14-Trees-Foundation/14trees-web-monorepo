import { WAChatMessage } from '../models/wa_chat_message';
import { WhereOptions } from 'sequelize';

export class WAChatHistoryRepository {

    public static async addWAChatMessage(message: string, messageType: 'human' | 'ai', userPhone: string): Promise<WAChatMessage> {

        const newWAChatMessage = WAChatMessage.create({
            message: message,
            message_type: messageType,
            user_phone: userPhone,
            timestamp: new Date(),
        });
        return newWAChatMessage;
    }


    public static async getWAChatMessages(whereClause: WhereOptions<WAChatMessage>): Promise<WAChatMessage[]> {
        
        return await WAChatMessage.findAll({
            where: whereClause
        })
    }

}
