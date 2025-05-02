import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { SqlToolkit } from "langchain/agents/toolkits/sql";

// Import all tools
import { dateTool } from "../../tools/common";
import { createBuyerTool, getBuyerTool, listBuyersTool } from "../../tools/lighthouse/buyer";
import { createSupplierTool, getSupplierTool, listSuppliersTool } from "../../tools/lighthouse/createSupplier";

// Database connection for error analysis
const datasource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "vivek-tree-vivek-tree.e.aivencloud.com",
  port: Number(process.env.POSTGRES_PORT) || 15050,
  username: process.env.POSTGRES_USER || "avnadmin",
  password: process.env.POSTGRES_PD,
  database: process.env.POSTGRES_DB || "defaultdb",
  schema: "LightHouse",
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

// Unified System Prompt
const systemMessage = `
You are a versatile assistant for LightHouse  with multiple capabilities. Based on the user's request, you can:

## Buyer Management:
1. Create new buyers with all necessary details
2. Retrieve buyer information by code
3. List buyers with filtering and pagination
4. Update existing buyer records

## Supplier Management:
1. Create new suppliers with all necessary details
2. Retrieve supplier information by code
3. List suppliers with filtering and pagination
4. Update existing supplier records

## Error Analysis:
1. Query error logs from the LightHouse system
2. Provide error statistics and analysis
3. Suggest solutions for common errors

## General Guidelines:
1. When the user greets you, briefly list your key capabilities
2. For unclear queries, ask for clarification with examples
3. Always confirm before executing changes
4. Present data in organized format
5. Verify mandatory fields before proceeding

## Special Instructions:
- For buyer/supplier operations, determine which entity the user is referring to
- For error analysis, focus on the 'errors' table in LightHouse
- Use appropriate tools based on the context
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

// Initialize LLM
const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0.2,
    configuration: { apiKey: process.env.OPENAI_API_KEY }
});

export const interactWithUnifiedAgent = async (
    query: string, 
    history: BaseMessage[] = []
): Promise<{ 
    output: string; 
    success: boolean;
}> => {
    try {
        // Prepare tools - combine all tools
        const standardTools = [
            dateTool,
            createBuyerTool,
            getBuyerTool,
            listBuyersTool,
            createSupplierTool,
            getSupplierTool,
            listSuppliersTool
        ];

        // Add SQL tools if the query seems error-related
        let tools = [...standardTools];
        if (query.toLowerCase().includes('error') || query.toLowerCase().includes('log')) {
            const db = await SqlDatabase.fromDataSourceParams({ 
                appDataSource: datasource,
                includesTables: ['errors']
            });
            const sqlToolkit = new SqlToolkit(db, llm);
            tools = [...tools, ...sqlToolkit.getTools()];
        }

        // Create agent
        const agent = await createOpenAIToolsAgent({ 
            llm, 
            tools, 
            prompt 
        });
        
        const agentExecutor = new AgentExecutor({
            agent,
            tools,
            verbose: process.env.NODE_ENV === 'development',
        });

        const result = await agentExecutor.invoke({ 
            input: query, 
            history: history 
        });

        // Return raw output without formatting
        return {
            output: result["output"],
            success: true
        };

    } catch (error) {
        console.error("Agent execution failed:", error);
        return {
            output: "Failed to process your query. Please try again with more specific details.",
            success: false
        };
    }
}

// Export all tools for direct access if needed
export const getAllAgentTools = () => {
    return {
        buyerTools: {
            createBuyerTool,
            getBuyerTool,
            listBuyersTool
        },
        supplierTools: {
            createSupplierTool,
            getSupplierTool,
            listSuppliersTool
        },
        commonTools: {
            dateTool
        }
    };
}