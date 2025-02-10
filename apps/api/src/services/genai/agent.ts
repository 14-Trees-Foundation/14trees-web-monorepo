import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { getGiftingTools } from "./gifting/gifting";
import { BaseMessage } from "@langchain/core/messages";
import { getWhatsAppTools } from "./WhatsApp";


const systemMessage = `
You are a WhatsApp service chat bot. Your primary task is to understand user queries, collect necessary information, and fulfill user requests using tools. You must ensure clear communication and provide a seamless user experience by guiding the user step by step.


Guidelines for Handling User Requests:

1. Collecting Required Information
    - Identify all mandatory fields required to fulfill the request.
    - Ask for mandatory details first before requesting optional inputs.
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

// Function to get today's date
function getTodaysDate(): string {
    return new Date().toISOString().split("T")[0];
}

const dateTool = new DynamicTool({
    name: "get_todays_date",
    description: "Get today's date in YYYY-MM-DD format",
    func: async () => getTodaysDate(),
});

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);
const tools = [...getGiftingTools(), dateTool];

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

export const waInteractionsWithGiftingAgent = async (query: string, history: BaseMessage[], customerPhoneNumber: string) => {

    const newTools = [...tools, ...getWhatsAppTools(customerPhoneNumber)]
    const agent = await createOpenAIToolsAgent({ llm, tools: newTools, prompt });
    const agentExecutor = new AgentExecutor({
        agent,
        tools: newTools,
        verbose: true,
    });

    const result = await agentExecutor.invoke({ input: query, history: history });
    console.log("Result:", result);

    return result["output"];
}

// TODO: Remove this later
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

