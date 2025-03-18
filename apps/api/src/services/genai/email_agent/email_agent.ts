import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { DynamicTool } from "langchain/tools";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { getGiftingTools } from "../gifting/gifting";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import verifyOutputFormat from "./output_varification";
import app from "./email_agent_v2";
import { traceable } from "langsmith/traceable";


export const systemMessage = `
You are an email chat bot. Your primary task is to understand user queries, collect necessary information, and fulfill user requests using tools. You must ensure clear communication and provide a seamless user experience by guiding the user step by step.


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
    
6. Output Format
    Respond only in valid JSON. The JSON object you return should match the following schema:
    {{
        "output": {{
            {{
                "email_body": "Text plain email body, which can be sent back to user!",
                "attachments": [
                    {{
                        "filename": "Name of the attachment file",
                        "path": "Attachment file url"
                    }}
                ]
            }}
        }}
    }}
    Make sure to replace the placeholder text with the actual content. The "email_body" should be a plain text email body, and "attachments" should be a list of objects containing "filename" and "path" for each attachment. If there are no attachments, the "attachments" array should be empty.

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

export const interactWithEmailAgent = traceable(async (query: string, history: BaseMessage[], tries: number = 3): Promise<any> => {

    // const newTools = [...tools, verifyOutputFormat]
    // const agent = await createOpenAIToolsAgent({ llm, tools: newTools, prompt });
    // const agentExecutor = new AgentExecutor({
    //     agent,
    //     tools: newTools,
    // });

    // const result = await agentExecutor.invoke({ input: query, history: history });
    if (tries === 0) {
        return null
    }

    const result = await app.invoke({ messages: [...history, new HumanMessage(query)]})

    try {
        let content = (result.messages[result.messages.length - 1].content) as string
        content = content.trim()
        if (content.startsWith('```json')) content = content.slice(7)
        if (content.endsWith('```')) content = content.slice(0, -3)
        const data = JSON.parse(content)
        if (data?.output?.email_body) return data;
    } catch(error: any) {
        console.log("JSON parse error for", result.messages[result.messages.length - 1].content)
    }

    return await interactWithEmailAgent("You haved provided invalid output format", result.messages, --tries);
})