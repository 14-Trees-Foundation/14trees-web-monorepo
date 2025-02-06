import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { getGiftingTools } from "./gifting";
import { BaseMessage } from "@langchain/core/messages";

// Function to get today's date
function getDate(): string {
    return new Date().toISOString().split("T")[0];
}

const dateTool = new DynamicTool({
    name: "get_date",
    description: "Get today's date in YYYY-MM-DD format",
    func: async () => getDate(),
});

const messages = [
    SystemMessagePromptTemplate.fromTemplate(`
    Follow below rules when serving user request:
    1. Ask user any necessary information.
    2. First collect mandatory fields then ask user for optional fields if any.
    3. If user has provided partial details, send back a summary of provided details so far and ask for remaining details.
    4. Once user provides all necessary details, show all the details as a summary and ask for confirmation.
    5. Do not invoke any tool without required input details. You are not allowed to make any assumptions.
    `),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);
const tools = [...getGiftingTools(), dateTool];

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

export const interactWithGiftingAgent = async (query: string, history: BaseMessage[]) => {

    const agent = await createOpenAIToolsAgent({ llm, tools, prompt });
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: true,
    });

    const result = await agentExecutor.invoke({ input: query, history: history });
    console.log("Result:", result);

    return result["output"];
}

