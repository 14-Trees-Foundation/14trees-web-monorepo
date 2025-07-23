import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../../repo/giftCardsRepo";
import { FilterItem } from "../../../../models/pagination";
import { Op } from "sequelize";

// Define Main Request Schema
const GetAvailableGiftTreesCountSchema = z.object({
    group_id: z.number().nullable().optional().describe("The group id of the sponsor"),
    user_id: z.number().nullable().optional().describe("the user id of the sponsor"),
});

const description = `
Retrieve the count of pre-purchased gift trees available for a specific sponsor user or group.

Use this tool when you need to:
- Check how many gift trees a sponsor has already purchased.
- Determine if additional trees need to be bought before creating a new gift request.
`;

const getAvailableGiftTreesCount = new DynamicStructuredTool({
    name: "get_available_gift_trees_count",
    description: description,
    schema: GetAvailableGiftTreesCountSchema,
    func: async (data): Promise<string> => {
        const { group_id, user_id } = data;
        
        let totalTrees = 0, availableTrees = 0;
        let filters: FilterItem[] = [];
        if (group_id) {
            filters.push({ columnField: 'group_id', operatorValue: 'equals', value: group_id });
        }
        if (user_id) {
            filters.push({ columnField: 'user_id', operatorValue: 'equals', value: user_id });
        }
        const resp = await GiftCardsRepository.getGiftCardRequests(0, -1, filters);
        if (resp.results.length !== 0) {
            const giftTrees = await GiftCardsRepository.getGiftCards(0, -1, { gift_card_request_id: {[Op.in]: resp.results.map((request) => request.id)} });
            totalTrees = giftTrees.results.length;
            availableTrees = giftTrees.results.filter((tree) => !tree.assigned_to && !tree.gifted_to && !tree.gift_request_user_id).length;
        }

        return JSON.stringify({
            status: "complete",
            data: {
                total_trees_purchased: totalTrees,
                available_trees_for_gifting: availableTrees,
            },
        });
    }

})

export default getAvailableGiftTreesCount;