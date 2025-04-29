import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GRTransactionsRepository } from "../../../../repo/giftRedeemTransactionsRepo";

// Define Main Request Schema
const ListPreviousTransactionsSchema = z.object({
    group_id: z.number().nullable().optional().describe("The group id of the sponsor"),
    user_id: z.number().nullable().optional().describe("the user id of the sponsor"),
});

const description = `
Retrieve the history of past Gift Trees actions performed by a specific sponsor (individual or group).

Requires the sponsor ID or group ID to fetch relevant records.
`;


const listPreviousTransactions = new DynamicStructuredTool({
    name: "list_previously_gifted_trees",
    description: description,
    schema: ListPreviousTransactionsSchema,
    func: async (data): Promise<string> => {
        const { group_id, user_id } = data;
        
        const transactionType = group_id ? 'group' : 'user';
        const transactionsResp = await GRTransactionsRepository.getDetailsTransactions(0, 5, transactionType, group_id || user_id || 0, undefined);

        return JSON.stringify({
            status: "complete",
            data: {
                records: transactionsResp.results.map((transaction: any) => ({
                    gifted_to: transaction.recipient_name,
                    gifted_on: transaction.gifted_on,
                    gifted_by: transaction.gifted_by,
                    occastion: transaction.occasion_name,
                    trees_gifted: transaction.trees_count,
                })),
            },
        });
    }

})

export default listPreviousTransactions;