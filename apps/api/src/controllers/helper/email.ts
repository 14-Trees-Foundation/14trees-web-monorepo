import mail from '../../services/sendgridService'

export async function sendEmail(): Promise<boolean> {
    try {
        const sendgridTemplateId = "d-2d49001eb114492d96d18903319a1009"
        const emailResponse = await mail.send({
            from: { email: 'contact@14trees.org', name: '14Trees Foundation' },
            to: 'dsmoradiya22@gmail.com',
            text: 'Sample email',
            subject: 'Test mail',
            templateId: undefined
            // personalizations: [{
            //     to: [{ email: 'dsmoradiya22@gmail.com' }],
            //     dynamicTemplateData: {
            //         first_name: 'Dhruvin',
            //         name: `${'Dhruvin'} ${'Moradiya'}`,
            //         campaign: null,
            //         amount:  `INR 100`,
            //         details: "-",
            //     }
            // }],
            // templateId: sendgridTemplateId
        })

        console.log(emailResponse)
        return Promise.resolve(true);
    } catch(error: any) {
        console.log(error.response.body);
        return Promise.resolve(false);
    }
}