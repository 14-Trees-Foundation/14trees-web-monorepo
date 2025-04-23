import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./common";
import { ChatOpenAI } from "@langchain/openai";
import { getPrePurchasedGiftingTools } from "../../tools/gifting/gifting";
import { dateTool } from "../../tools/common";

const systemMessage = `
You are a gifting agent. You help users...
1. fetch count of available pre-purchased trees for gifting
2. fetch list of last gift trees actions (N number of trees gifted to Persona on some date/occasion)
`;

// Define the LLM and tools
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const tools = [...getPrePurchasedGiftingTools(), dateTool];

// Define the gifting agent
const giftingAgent = createReactAgent({
    llm,
    tools,
    stateModifier: new SystemMessage(systemMessage),
});

// Define the gifting agent node
const giftPrePurchasedTreesAgentNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
) => {
    const result = await giftingAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new AIMessage({ content: lastMessage.content, name: "GiftPrePuchasedTrees_Agent" }),
        ],
    };
};

export default giftPrePurchasedTreesAgentNode;