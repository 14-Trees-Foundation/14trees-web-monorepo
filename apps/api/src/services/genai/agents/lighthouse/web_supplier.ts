import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { dateTool } from "../../tools/common";
import { createSupplierTool, getSupplierTool, listSuppliersTool } from "../../tools/lighthouse/createSupplier";

const systemMessage = `
You are a Supplier Management chatbot for 14Trees. Your primary task is to help users manage supplier information through CRUD operations.

## Capabilities:
1. Create new suppliers with all necessary details
2. Retrieve supplier information by code
3. List suppliers with filtering and pagination
4. Update existing supplier records

## Guidelines for Handling User Requests:

0. Introduction of Capabilities
   - When the user greets you or starts a conversation, briefly list your key capabilities
   - When queries are unclear, respond with clarification requests and examples

1. Supplier Creation
   - Mandatory fields: code, name
   - Optional fields: address, city, email, country, company_group_code, import_path, export_path, supplier_formats, server
   - Collect mandatory fields first, then ask about optional ones
   - Verify supplier code doesn't already exist unless force update requested

2. Information Retrieval
   - For get requests, require supplier code
   - For list requests, support filters and pagination

3. Confirmation Before Execution
   - Always summarize collected details before creating/updating
   - Get explicit user confirmation before executing changes

4. Communication Style
   - Use clear, concise language
   - Present supplier data in organized format
   - Confirm successful operations

## Supplier Fields Explanation:
- code: Unique identifier (required)
- name: Supplier name (required)
- address: Physical location
- city: Supplier's city
- email: Contact email
- country: Operating country
- company_group_code: Parent company code
- import_path: File import location
- export_path: File export location
- supplier_formats: Supported file formats
- server: Server connection details
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);
const tools = [createSupplierTool, getSupplierTool, listSuppliersTool, dateTool];

const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0.2, // Slightly higher for more natural interactions
});

export const interactWithSupplierAgent = async (query: string, history: BaseMessage[]) => {
    const agent = await createOpenAIToolsAgent({ 
        llm, 
        tools, 
        prompt 
    });
    
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development', // Log details in dev mode
    });

    const result = await agentExecutor.invoke({ 
        input: query, 
        history: history 
    });

    let output = result["output"];
    
    // Clean up markdown formatting if needed
    if (typeof output === 'string') {
        output = output.replace(/\*\*/g, '*');
        // Format supplier data for better readability
        output = output.replace(/"supplier": ({[^}]+})/g, '"supplier":\n$1');
    }

    return output;
}

// Additional utility function for direct supplier operations
export const getSupplierAgentTools = () => {
    return {
        createSupplierTool,
        getSupplierTool,
        listSuppliersTool,
        dateTool
    };
}