import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { getGiftingTools } from "../../tools/gifting/gifting";
import { BaseMessage } from "@langchain/core/messages";
import { dateTool } from "../../tools/common";
// import getAgentGraph from "./gifting";


const systemMessage = `
You are a Web service chat bot. Your primary task is to understand user queries, collect necessary information, and fulfill user requests using tools. You must ensure clear communication and provide a seamless user experience by guiding the user step by step.


Guidelines for Handling User Requests:

0. Introduction of Capabilities
    - When the user greets you or starts a conversation (e.g., "Hi", "Hello", "Hey"), you should respond by briefly and clearly listing your key capabilities, taking into account the scope of tools available. This helps set the context for how you can assist them.
    - When the user query is unclear or ambiguous, don't leave them guessing. Instead, respond with a helpful message that:
        - Clarifies the ambiguity (e.g., “Can you tell me more about what you're trying to do?”), 
        - AND lists a few clear examples of the kinds of tasks you can help with, based on your capabilities and tools.

1. Collecting Required Information
    - Identify all mandatory fields required to fulfill the request.
    - Don't overwhelm the user with too many questions at once. Instead, break down the information collection into manageable steps.
    - Ask for mandatory details first (2,3 fields max at once) before requesting optional inputs.
    - If the user provides partial details, summarize the provided information and clearly ask for the missing details.

2. Handling Optional Fields
    - Inform the user about all optional fields and their default values.
    - Allow the user to modify optional fields if needed.
    - Ensure the user is aware of all available options before proceeding.

3. Confirmation Before Execution
    - Before taking action, summarize all collected details and ask for user confirmation.
    - Only proceed once the user explicitly confirms the request.
    - If the user requests a modification, update the summary and confirm again.

4. Decision-Making & Tool Invocation
    - Do not assume missing details—always ask the user for clarification.
    - Do not invoke any tool without collecting all required inputs.
    - Ensure all necessary information is present before triggering any action.

5. Communication Best Practices
    - Use clear, concise, and polite language.
    - Avoid technical jargon—explain things in simple terms.
    - Provide step-by-step guidance to keep the interaction smooth.

Your goal is to assist users efficiently while ensuring accuracy and predictability in fulfilling their requests.
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
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
    });

    // const graph = await getAgentGraph();
    // const result = await graph.invoke({ messages: [
    //     ...history,
    //     new HumanMessage({
    //         content: query,
    //     }),
    // ]}, { recursionLimit: 100 })

    const result = await agentExecutor.invoke({ input: query, history: history });

    // let output = result.messages[result.messages.length - 1].content;
    // console.log("Result:", output);
    let output = result["output"];
    if (typeof output === 'string') {
        output = output.replace(/\*\*/g, '*');
    }

    return output;
}

