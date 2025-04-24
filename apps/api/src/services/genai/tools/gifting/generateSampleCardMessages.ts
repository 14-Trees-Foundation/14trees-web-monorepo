import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { GRTransactionsRepository } from "../../../../repo/giftRedeemTransactionsRepo";
import { defaultGiftMessages } from "../../../../controllers/helper/giftRequestHelper";
import generateGiftMessages from "../../agents/gifting_agents/giftMessageAgent";

// Define Main Request Schema
const GenerateSampleCardMessagesSchema = z.object({
    occasionName: z.string().describe("Name of the occasion"),
    occasionType: z.string().describe("Type of the occasion. Birthday, Memorial, General Gift etc."),
});

const description = `
Bassed on given occasion name and type, generate sample messages for tree cards.
`;

const generateSampleCardMessages = new DynamicStructuredTool({
    name: "generate_sample_card_messages",
    description: description,
    schema: GenerateSampleCardMessagesSchema,
    func: async (data): Promise<string> => {
        const { occasionName, occasionType } = data;
        
        const samplePrimaryMessage = defaultGiftMessages.primary;
        const sampleSecondaryMessage = defaultGiftMessages.secondary;

        const resp = await generateGiftMessages({
            occasionName,
            occasionType,
            samplePrimaryMessage,
            sampleSecondaryMessage
        })

        return JSON.stringify({
            status: "complete",
            data: resp,
        });
    }
})

export default generateSampleCardMessages;