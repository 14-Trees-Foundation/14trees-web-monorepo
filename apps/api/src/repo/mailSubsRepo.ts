import { MailSub } from '../models/mail_sub';
import { WhereOptions } from 'sequelize';

export class MailSubsRepository {

    public static async addMailSub(messageId: string, threadId: string): Promise<MailSub> {

        const newMailSub = MailSub.create({
            message_id: messageId,
            thread_id: threadId,
            created_at: new Date(),
        });
        return newMailSub;
    }


    public static async getMailSubs(whereClause: WhereOptions<MailSub>): Promise<MailSub[]> {
        
        return await MailSub.findAll({
            where: whereClause
        })
    }

}
