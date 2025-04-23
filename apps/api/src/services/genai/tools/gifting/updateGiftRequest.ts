
import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";

// Define Main Request Schema
const UpdateGiftRequestSchema = z.object({
    request_id: z.number().describe("The request id of the gift"),
    gifted_by: z.string().optional().nullable().describe("The user id of the sponsor"),
    gifted_on: z.string().optional().nullable().describe("the date of the gift in YYYY-MM-DD format"),
    occasion_name: z.string().optional().nullable().describe("the occasion name"),
    occasion_type: z.enum(['birthday', 'memorial', 'general gift']).optional().nullable().describe("the occasion type:  Values can be birthday, memorial, or general gift."),
});

const description = `
Update occasion and gifting details for a gift request.
`;

const updateGiftRequest = new DynamicStructuredTool({
    name: "update_gift_request",
    description: description,
    schema: UpdateGiftRequestSchema,
    func: async (data): Promise<string> => {

        const eventTypeMap = {
            birthday: '1',
            memorial: '2',
            "general gift": '3',
        }

        const updateData: any = {};
        if (data.gifted_by) {
            updateData.planted_by = data.gifted_by;
        }
        if (data.gifted_on) {
            updateData.gifted_on = data.gifted_on;
        }
        if (data.occasion_name) {
            updateData.event_name = data.occasion_name;
        }
        if (data.occasion_type) {
            updateData.event_type = data.occasion_type ? eventTypeMap[data.occasion_type] || '3' : '3';
        }

        if (Object.keys(updateData).length === 0) {
            return JSON.stringify({
                status: "complete",
                data: {
                    message: "No updates were made to the gift request.",
                },
            });
        }
        const requestId = data.request_id;
        await GiftCardsRepository.updateGiftCardRequests(updateData, { id: requestId });

        return JSON.stringify({
            status: "complete",
            data: {
                message: "Gift request updated successfully.",
                request_id: requestId,
            },
        });
    }

})

export default updateGiftRequest;