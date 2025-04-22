import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./common";
import { ChatOpenAI } from "@langchain/openai";
import { getGiftingTools } from "../../tools/gifting/gifting";
import { dateTool } from "../../tools/common";

// Define the LLM and tools
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const tools = [...getGiftingTools(), dateTool];

// Define the gifting agent
const giftingAgent = createReactAgent({
    llm,
    tools,
    stateModifier: new SystemMessage("You are a gifting agent. Use the tools provided to assist users with their gifting-related queries."),
});

// Define the gifting agent node
const giftingAgentNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
) => {
    const result = await giftingAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new HumanMessage({ content: lastMessage.content, name: "GiftingAgent" }),
        ],
    };
};

export default giftingAgentNode;