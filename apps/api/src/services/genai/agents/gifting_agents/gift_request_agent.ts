import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./common";
import { ChatOpenAI } from "@langchain/openai";
import { getGiftingTools } from "../../tools/gifting/gifting";
import { dateTool } from "../../tools/common";

const systemMessage = `
You are a gifting agent. You help user
1. fetch previous orders of giftable trees
`

// Define the LLM and tools
const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
const tools = [...getGiftingTools(), dateTool];

// Define the gifting agent
const giftingAgent = createReactAgent({
    llm,
    tools,
    stateModifier: new SystemMessage(systemMessage),
});

// Define the gifting agent node
const requestGiftableTreesAgentNode = async (
    state: typeof AgentState.State,
    config?: RunnableConfig
) => {
    const result = await giftingAgent.invoke(state, config);
    const lastMessage = result.messages[result.messages.length - 1];
    return {
        messages: [
            new AIMessage({ content: lastMessage.content, name: "RequestGiftableTrees_Agent" }),
        ],
    };
};

export default requestGiftableTreesAgentNode;