import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GiftCardsRepository } from "../../../repo/giftCardsRepo";

// Define Main Request Schema
const GetTreeCardsRequestSchema = z.object({
    request_id: z.number()
});

const description = `
Get the list of s3Urls of tree card images for GiftTreesRequest.
The output of this tool must not be send back to end user directly!
`;

const getTreeCards = new DynamicStructuredTool({
    name: "get_tree_cards",
    description: description,
    schema: GetTreeCardsRequestSchema,
    func: async (data): Promise<string> => {
        const requestId = data.request_id;

        const giftCards = await GiftCardsRepository.getBookedTrees(requestId, 0, -1);
        const imageUrls = giftCards.results.map(card => card.card_image_url).filter(imageUrl => imageUrl);

        if (imageUrls.length !== giftCards.results.length) {
            return JSON.stringify({
                status: "incomplete",
                message: "Not all tree cards are generated yet. It may take 15-30mins to generate personalized cards. Please try again after some time.",
                generated_count: imageUrls.length,
                total_count: giftCards.results.length
            });
        }

        return JSON.stringify({
            status: "complete",
            message: "All tree cards have been generated successfully.",
            image_urls: imageUrls
        });
    }

})

export default getTreeCards