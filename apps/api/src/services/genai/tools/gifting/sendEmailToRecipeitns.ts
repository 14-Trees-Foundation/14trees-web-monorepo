import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { sendMailsToReceivers } from "../../../../controllers/helper/giftRequestHelper";

// Define Main Request Schema
const SendEmailRequestSchema = z.object({
    request_id: z.number()
});

const description = `
Send personalized tree dashboard's Link and tree cards to recipients of gifted trees via email.
`;

const sendRecipientsEmail = new DynamicStructuredTool({
    name: "send_recipients_email",
    description: description,
    schema: SendEmailRequestSchema,
    func: async (data): Promise<string> => {
        const requestId = data.request_id;

        const giftRequestsResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: requestId }]);
        const giftRequest = giftRequestsResp.results[0];
    
        // get gift cards
        const cards = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftRequest.id);
    
        await sendMailsToReceivers(giftRequest, cards, giftRequest.event_type === '1' ? 'birthday' : 'default', true);

        return `Successfully sent emails to recipients`
    }

})

export default sendRecipientsEmail