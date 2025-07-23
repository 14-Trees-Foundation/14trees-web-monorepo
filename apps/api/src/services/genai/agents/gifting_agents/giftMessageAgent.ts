import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Define the input schema
const MessageGenerationInputSchema = z.object({
    occasionName: z.string(),
    occasionType: z.string(),
    samplePrimaryMessage: z.string().max(270),
    sampleSecondaryMessage: z.string().max(125)
});

// Define the output schema
const MessageGenerationOutputSchema = z.object({
    messages: z.array(
        z.object({
            primary_message: z.string().describe("Message with maximum of 270 characters"),
            secondary_message: z.string().describe("Message with maximum of 125 characters"),
        })
    )
})


// Initialize ChatOpenAI LLM
const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.7
});

// Bind the created tool to the model
const modelWithStructure = model.withStructuredOutput(MessageGenerationOutputSchema);


async function generateGiftMessages(input: z.infer<typeof MessageGenerationInputSchema>) {
    const { occasionName, occasionType, samplePrimaryMessage, sampleSecondaryMessage } = input;

    const prompt = `
You are an AI assistant generating messages for tree recipients. The message should inform the recipient that a tree has been planted in their honor at the 14Trees Foundation. 

## Context:
- Occasion Name: ${occasionName}
- Occasion Type: ${occasionType}
- Sample Primary Message: "${samplePrimaryMessage}"
- Sample Secondary Message: "${sampleSecondaryMessage}"

## Task:
Generate **three unique sets** of messages. Each set should contain:
1. **Primary Message** (Max: 270 characters) - A warm, meaningful message informing the recipient about the tree planting.
2. **Secondary Message** (Max: 125 characters) - A short follow-up message that complements the primary message.

Ensure the messages are **concise, heartfelt, and appropriate** for the given occasion.
`;

    const response = await modelWithStructure.invoke(prompt);
    console.log(response);
    return response;
}


export default generateGiftMessages;