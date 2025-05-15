// src/agents/shipment_agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  MessagesPlaceholder, 
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { SqlToolkit } from "langchain/agents/toolkits/sql";

// Database connection configuration
const datasource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "vivek-tree-vivek-tree.e.aivencloud.com",
    port: Number(process.env.POSTGRES_PORT) || 15050,
    username: process.env.POSTGRES_USER || "avnadmin",
    password: process.env.POSTGRES_PD,
    database: process.env.POSTGRES_DB || "defaultdb",
    schema: "Shipping",
    ssl: true,
    extra: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  });

// System prompt specialized for shipping data
const systemMessage = `
You are a specialized shipping and vessel performance assistant with deep knowledge of:

## Vessel Information
- Ship identification (IMO numbers)
- Engine specifications
- Technical details

## Performance Metrics
- Cylinder performance data
- Operating conditions
- Fuel and lubricant analytics

## Available Data Tables
1. vessel_detail - Core vessel information
2. cylinder_performance - Engine cylinder metrics
3. operating_conditions - Various operational parameters
4. fuel_lubricant - Fuel and lubricant specifications

## Capabilities
- Query any shipping-related data
- Analyze vessel performance
- Compare metrics across vessels
- Identify technical anomalies

## Guidelines
1. Always verify IMO numbers when provided
2. For technical queries, include relevant units
3. For comparisons, ensure time periods match
4. Clarify ambiguous requests before executing
5. Present data in clear, organized formats

## Special Instructions
- All tables are in the 'Shipping' schema
- Use exact column names from table definitions
- Pay special attention to DECIMAL precision fields
- IMO number is the common key across tables
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

// Initialize LLM with optimized settings for technical data
const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0.1, // Lower temp for precise technical queries
    configuration: { 
        apiKey: process.env.OPENAI_API_KEY,
    }
});

export const queryShippingData = async (
    query: string, 
    history: BaseMessage[] = []
): Promise<{ 
    output: string; 
    success: boolean;
}> => {
    try {
        // Initialize SQL database connection
        const db = await SqlDatabase.fromDataSourceParams({ 
            appDataSource: datasource,
            includesTables: [
                'vessel_detail',
                'cylinder_performance', 
                'operating_conditions',
                'fuel_lubricant'
            ]
        });

        // Create SQL toolkit with access to all shipping tables
        const sqlToolkit = new SqlToolkit(db, llm);
        const tools = sqlToolkit.getTools();

        // Create agent with SQL capabilities
        const agent = await createOpenAIToolsAgent({ 
            llm, 
            tools, 
            prompt 
        });
        
        const agentExecutor = new AgentExecutor({
            agent,
            tools,
            verbose: process.env.NODE_ENV === 'development',
            maxIterations: 5 // Prevent long-running queries
        });

        const result = await agentExecutor.invoke({ 
            input: query, 
            history: history 
        });

        return {
            output: formatTechnicalOutput(result["output"]),
            success: true
        };

    } catch (error) {
        console.error("Shipping agent execution failed:", error);
        return {
            output: "Failed to process your shipping query. Please try again with more specific details.",
            success: false
        };
    }
}

// Helper function to format technical data output
function formatTechnicalOutput(rawOutput: string): string {
    try {
        // For JSON responses, pretty-format them
        if (rawOutput.startsWith("{") || rawOutput.startsWith("[")) {
            const parsed = JSON.parse(rawOutput);
            return JSON.stringify(parsed, null, 2);
        }
        
        // For SQL results, add some formatting
        if (rawOutput.includes("|") && rawOutput.includes("-")) {
            return `\n${rawOutput}\n`; // Add spacing for table outputs
        }
        
        return rawOutput;
    } catch {
        return rawOutput;
    }
}

// Type definitions for TypeScript
export interface ShippingQueryResult {
    output: string;
    success: boolean;
}