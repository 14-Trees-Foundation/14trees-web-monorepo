import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DynamicTool } from 'langchain/tools';
import { getCorporateGiftingTools } from '../../tools/gifting/gifting';
import verifyOutputFormat from '../../tools/email/output_varification';
import {
    StateGraph,
    MessagesAnnotation,
    END,
    START
} from "@langchain/langgraph";
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from '@langchain/core/prompts';

const systemMessage = `
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

6. If outptu has image link/url, try to send it as attachments
    
7. Output Format
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

const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "messages" }),
]);

// Function to get today's date
function getTodaysDate(): string {
    return new Date().toISOString().split("T")[0];
}

const dateTool = new DynamicTool({
    name: "get_todays_date",
    description: "Get today's date in YYYY-MM-DD format",
    func: async () => getTodaysDate(),
});

const tools = [...getCorporateGiftingTools(), dateTool, verifyOutputFormat];
const toolNodeForGraph = new ToolNode(tools)

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
        return "tools";
    }
    return END;
}

let modelWithTools = new ChatOpenAI({ model: "gpt-4o", temperature: 0 }).bindTools(tools);
modelWithTools = prompt.pipe(modelWithTools)

const callModel = async (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const response = await modelWithTools.invoke({messages} as any);
    return { messages: response };
}


const workflow = new StateGraph(MessagesAnnotation)
    // Define the two nodes we will cycle between
    .addNode("agent", callModel)
    .addNode("tools", toolNodeForGraph)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END])
    .addEdge("tools", "agent");

const app = workflow.compile()

export default app;