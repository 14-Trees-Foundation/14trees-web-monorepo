import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../repo/giftCardsRepo";
import { UserRepository } from "../../../repo/userRepo";

// Define Main Request Schema
const ListPreviousRequestsSchema = z.object({
    email_id: z.string().describe("The email address you/sponsor used to make gift trees requests")
});

const description = `
For a given user/Sponsor email list the previous gift trees request
`;

const listGiftTreesRequests = new DynamicStructuredTool({
    name: "list_gift_trees_request",
    description: description,
    schema: ListPreviousRequestsSchema,
    func: async (data): Promise<string> => {
        const Email = data.email_id;

        const userResp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: Email, operatorValue: 'equals' }])
        if (userResp.results.length === 0) {
            return "Didn't found any user which given email!"
        }

        const requests = await GiftCardsRepository.getGiftCardRequests(0, 5, [{ columnField: 'user_id', value: userResp.results[0].id, operatorValue: 'equals' }]);

        return JSON.stringify({
            status: "complete",
            requests: requests.results.map(request => ({
                requestId: request.id,
                giftedTrees: request.no_of_cards,
                giftedOn: request.created_at,
            }))
        });
    }

})

export default listGiftTreesRequests