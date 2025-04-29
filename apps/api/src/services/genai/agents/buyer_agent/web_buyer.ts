// src/services/genai/agents/buyer_agents/web_buyer_agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { dateTool } from "../../tools/common";
import { createBuyerTool, getBuyerTool, listBuyersTool } from "../../tools/buyer/buyer";

const systemMessage = `
You are a Buyer Management chatbot for 14Trees. Your primary task is to help users manage buyer information through CRUD operations.

## Capabilities:
1. Create new buyers with all necessary details
2. Retrieve buyer information by code
3. List buyers with filtering and pagination
4. Update existing buyer records

## Guidelines for Handling User Requests:

0. Introduction of Capabilities
   - When the user greets you or starts a conversation, briefly list your key capabilities
   - When queries are unclear, respond with clarification requests and examples

1. Buyer Creation
   - Mandatory fields: code, buyer_name
   - Optional fields: contact_person, email, country, adaptor_license_key, web_link, import_path, export_path
   - Collect mandatory fields first, then ask about optional ones
   - Verify buyer code doesn't already exist unless force update requested

2. Information Retrieval
   - For get requests, require buyer code
   - For list requests, support filters and pagination

3. Confirmation Before Execution
   - Always summarize collected details before creating/updating
   - Get explicit user confirmation before executing changes

4. Communication Style
   - Use clear, concise language
   - Present buyer data in organized format
   - Confirm successful operations

## Buyer Fields Explanation:
- code: Unique identifier (required)
- buyer_name: Buyer organization name (required)
- contact_person: Primary contact at buyer organization
- email: Contact email
- country: Operating country
- adaptor_license_key: Integration license key
- web_link: Buyer portal URL
- import_path: File import location
- export_path: File export location
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);
const tools = [createBuyerTool, getBuyerTool, listBuyersTool, dateTool];

const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0.2, // Consistent with supplier agent
});

export const interactWithBuyerAgent = async (query: string, history: BaseMessage[]) => {
    const agent = await createOpenAIToolsAgent({ 
        llm, 
        tools, 
        prompt 
    });
    
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development', // Same debug mode
    });

    const result = await agentExecutor.invoke({ 
        input: query, 
        history: history 
    });

    let output = result["output"];
    
    // Consistent formatting with supplier agent
    if (typeof output === 'string') {
        output = output
            .replace(/\*\*/g, '*')
            .replace(/"buyer": ({[^}]+})/g, '"buyer":\n$1')
            .replace(/"results": \[({[^}]+})]/g, '"results": [\n$1\n]');
    }

    return output;
}

// Matching utility function export
export const getBuyerAgentTools = () => {
    return {
        createBuyerTool,
        getBuyerTool,
        listBuyersTool,
        dateTool
    };
}