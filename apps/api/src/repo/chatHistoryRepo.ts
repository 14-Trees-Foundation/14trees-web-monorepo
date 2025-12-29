import { ChatMessage } from '../models/chat_message';
import { WhereOptions } from 'sequelize';

export class ChatHistoryRepository {

    public static async addChatMessage(message: string, messageType: 'human' | 'ai', identifier: string, identifierType: 'phone' | 'id'): Promise<ChatMessage> {

        const newChatMessage = ChatMessage.create({
            message: message,
            message_type: messageType,
            user_phone: identifierType === 'phone' ? identifier : null,
            device_id: identifierType === 'id' ? identifier : null,
            timestamp: new Date(),
        });
        return newChatMessage;
    }


    public static async getChatMessages(whereClause: WhereOptions<ChatMessage>): Promise<ChatMessage[]> {
        
        return await ChatMessage.findAll({
            where: whereClause
        })
    }

}
