import { ChatOpenAI } from "@langchain/openai";
import getOutputSchemas from "../../outputs/gifting";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

const systemPrompt = `You are an intelligent classifier. Your task is to read the given context and identify which of the following schema IDs are most relevant for extracting structured data from it.

Return an array of one or more schema IDs from the list below that are suitable. If there are no matching schemas you can return array.

Schema List:
{schemaDetails}

Respond only with a JSON array of schema IDs, e.g.:
["sponsor_schema_v1", "event_schema_v1"]
`;

async function getRelevantSchemaIds(context: string) {
    const schemas = getOutputSchemas();
    const schemaDetails = schemas.map(
        (schema, index) =>
            `(${index + 1}) ID: ${schema.id}\nDescription: ${schema.description}`
    ).join("\n\n");

    const prompt = new PromptTemplate({
        inputVariables: ["schemaDetails"],
        template: systemPrompt,
    })

    const sysMsg = await prompt.format({ schemaDetails })

    const messages = [
        new SystemMessage(sysMsg),
        new HumanMessage(`Context:\n${context}`),
    ];

    const result = await llm.invoke(messages);

    try {

        let jsonStr = result.content.toLocaleString();
        if (jsonStr.startsWith("```json")) jsonStr = jsonStr.substring(7);
        if (jsonStr.startsWith("```")) jsonStr = jsonStr.substring(4);
        if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
        jsonStr = jsonStr.trim();

        const ids = JSON.parse(jsonStr);
        if (Array.isArray(ids)) {
            return ids as string[];
        }
        throw new Error("Invalid format");
    } catch (err) {
        console.error("Failed to parse schema IDs:", err);
        return [];
    }
}

export default getRelevantSchemaIds;
