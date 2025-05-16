import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import getOutputSchemas from "../../outputs/gifting";
import getRelevantSchemaIds from "./output_classifier";
import { PromptTemplate } from "@langchain/core/prompts";

const dynamicSystemPrompt = `You are an intelligent data extraction assistant.
Your task is to extract structured data from the given input text using the expected schema fields provided below.

Only return a plain JSON object. Do not include explanations, formatting, or markdown.

**Schema Fields to Extract:**
{fieldInstructions}

**General Guidelines:**
- Return only a JSON array/object with appropriate key-value pairs.
- Use string, number, boolean, or array types based on context.
- Normalize values where possible (e.g., standard date format "YYYY-MM-DD").
- If data is missing, omit the key entirely.
`;

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

export async function extractStrucutredData(context: string) {
    const allSchemas = getOutputSchemas();
    const schemaIds = await getRelevantSchemaIds(context);

    if (schemaIds.length === 0) return {};

    const relevantSchemas = allSchemas.filter(schema => schemaIds.includes(schema.id));

    // Build field-specific instructions
    const fieldInstructions = relevantSchemas.flatMap(schema =>
        JSON.stringify(schema.fields)
    ).join("\n\n");

    const prompt = new PromptTemplate({
        inputVariables: ["fieldInstructions"],
        template: dynamicSystemPrompt
    })

    const systemPrompt = await prompt.format({ fieldInstructions });

    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(context),
    ];

    const response = await llm.invoke(messages);

    let jsonStr = response.content.toLocaleString();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.substring(7);
    if (jsonStr.startsWith("```")) jsonStr = jsonStr.substring(4);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    try {
        const parsed = JSON.parse(jsonStr);
        return parsed;
    } catch (e) {
        console.error("Failed to parse LLM response:", jsonStr);
        return {};
    }
}
