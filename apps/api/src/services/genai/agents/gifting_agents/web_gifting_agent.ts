import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, AgentFinish, AgentStep, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { BaseMessage, AIMessage, FunctionMessage } from "@langchain/core/messages";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getGiftingTools } from "../../tools/gifting/gifting";
import { dateTool } from "../../tools/common";
import { z } from "zod";
import { FunctionsAgentAction } from "langchain/agents/openai/output_parser";
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
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
    - Don't overwhelm the user with too many questions at once. Break down the information collection into manageable steps.
    - Ask for mandatory details first (2-3 fields max at once) before requesting optional inputs.
    - Every time the user provides any input (even partial), always call the function named "verify_tool_inputs" immediately.

2. How to call verify_tool_inputs:
    - tool_name: The name of the tool for which we are collecting input.
    - input_data: A JSON object containing **only the fields** the user has provided so far.  
    - Even if the user provides **only partial** information, include it inside "input_data".
    - If the user has not provided a certain field, simply omit it from input_data (do not put null or undefined).
    - Never leave input_data empty if any input is provided.

3. Handling Optional Fields
    - Inform the user about all optional fields and their default values.
    - Allow the user to modify optional fields if needed.
    - Ensure the user is aware of all available options before proceeding.

4. Confirmation Before Execution
    - Before taking action, return provided fields in structured format and ask for user confirmation.
    - Only proceed once the user explicitly confirms the request.
    - If the user requests a modification, update the summary and confirm again.

5. Decision-Making & Tool Invocation
    - Do not assume missing details—always ask the user for clarification.
    - Do not invoke any tool without collecting all required inputs.
    - Ensure all necessary information is present before triggering any action.

6. Communication Best Practices
    - Use clear, concise, and polite language.
    - Avoid technical jargon—explain things in simple terms.
    - Provide step-by-step guidance to keep the interaction smooth.

7. When the user has provided all required inputs and the tool has returned its result, you must respond by calling the function named **"response"**.
    - Always use "response" as the final step of the conversation.
    - Pass the tool result **exactly as it was returned**, without summarizing or rephrasing.
    - Use the following arguments:
        - "text_output": A markdown-formatted explanation or result message for the user.
        - "data": A JSON object containing the **unmodified tool output**, for example:
        \`\`\`json
        {{
            "text_output": "A markdown-formatted explanation or result message for the user.",
            "data": {{ ...exact contents from the last tool call... }}
        }}
        \`\`\`

🔁 Never skip the final "response" call — it is mandatory once the process is complete.


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

const responseSchema = z.object({
    text_output: z.string().describe("Markdown formatted text/message to be displayed/conwayed to the user"),
    data: z.any().optional().nullable().describe("Data to be used by the client application."),
});

const responseOpenAIFunction = {
    name: "response",
    description: "Return the response to the user",
    parameters: zodToJsonSchema(responseSchema),
};

function parseToolCall(function_call: any, message: AIMessage): FunctionsAgentAction | AgentFinish {
    if (message.content && typeof message.content !== "string") {
        throw new Error("This agent cannot parse non-string model responses.");
    }

    const toolInput = function_call.arguments ? JSON.parse(function_call.arguments) : {};
    if (function_call.name === "response") {
        return { returnValues: { ...toolInput }, log: message.content };
    }
    return {
        tool: function_call.name,
        toolInput,
        log: `Invoking "${function_call.name}" with ${function_call.arguments ?? "{}"}\n${message.content}`,
        messageLog: [message],
    };
}

const structuredOutputParser = (
    message: AIMessage,
): FunctionsAgentAction | AgentFinish => {
    if (message.content && typeof message.content !== "string") {
        throw new Error("This agent cannot parse non-string model responses.");
    }

    if (message.additional_kwargs.function_call) {
        return parseToolCall(message.additional_kwargs.function_call, message);
    }

    return {
        returnValues: { output: message.content },
        log: message.content,
    };
};


const formatAgentSteps = (steps: AgentStep[]): BaseMessage[] =>
    steps.flatMap(({ action, observation }) => {
        if ("messageLog" in action && action.messageLog !== undefined) {
            const log = action.messageLog as BaseMessage[];
            return log.concat(new FunctionMessage(observation, action.tool));
        } else {
            return [new AIMessage(action.log)];
        }
    });

const llmWithTools = llm.bind({
    functions: [...tools.map((tool) => convertToOpenAIFunction(tool)), responseOpenAIFunction],
});

export const interactWithGiftingAgent = async (query: string, history: BaseMessage[]) => {

    const runnableAgent = RunnableSequence.from<{
        input: string;
        history: BaseMessage[];
        steps: Array<AgentStep>;
    }>([
        {
            input: (i) => i.input,
            history: (i) => i.history,
            agent_scratchpad: (i) => formatAgentSteps(i.steps),
        },
        prompt,
        llmWithTools,
        structuredOutputParser,
    ]);

    const executor = AgentExecutor.fromAgentAndTools({
        agent: runnableAgent,
        tools: tools,
    });

    const result = await executor.invoke({
        input: query,
        history: history,
    });

    return {
        text_output: result.text_output || result.output,
        data: result.data,
    }
}

