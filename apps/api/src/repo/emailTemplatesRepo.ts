import { WhereOptions } from 'sequelize';
import { EmailTemplate, EmailTemplateAttributes, EmailTemplateCreationAttributes } from '../models/email_template';

export class EmailTemplateRepository {

    static async getEmailTemplates(whereClause: WhereOptions<EmailTemplate>): Promise<EmailTemplate[]> {
        return await EmailTemplate.findAll( { where: whereClause });
    }

    static async addEmailTemplate(data: EmailTemplateCreationAttributes): Promise<EmailTemplate> {
        data.created_at = data.updated_at = new Date();
        return await EmailTemplate.create(data);
    }

    static async updateEmailTemplate(emailTemplateData: EmailTemplateAttributes): Promise<EmailTemplate> {
        const emailTemplate = await EmailTemplate.findByPk(emailTemplateData.id);
        if (!emailTemplate) {
            throw new Error('EmailTemplate not found for given id');
        }
        emailTemplateData.updated_at = new Date();

        return await emailTemplate.update(emailTemplateData);
    }

    static async deleteEmailTemplate(emailTemplateId: number): Promise<number> {
        return await EmailTemplate.destroy({ where: { id: emailTemplateId } });
    }
}
