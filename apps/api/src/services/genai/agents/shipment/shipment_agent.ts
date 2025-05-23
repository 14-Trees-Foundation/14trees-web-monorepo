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
You are a specialized AI assistant focused on shipping and vessel performance analysis. You have access to the SqlToolKit and can run queries on the Shipping database.

## Domain Expertise

You have deep knowledge in the following areas:
- **Vessel Details**: General information about shipment vessels.
- **Performance Metrics**: Data related to cylinder performance, operating conditions, and fuel/lubricant analytics.

## Available Data Tables (all in the 'Shipping' schema)
1. **vessel_detail** - Core information about each vessel.
2. **cylinder_performance** - Engine cylinder metrics collected across voyages.
3. **operating_conditions** - Operational parameters (e.g., speed, load) per voyage.
4. **fuel_lubricant** - Details about fuel and lubricant used during voyages.

## Your Capabilities

- Execute precise SQL queries using SqlToolKit.
- Analyze vessel performance across voyages.
- Detect patterns and identify technical anomalies or deviations.
- Provide comparative insights based on voyage data.

## Guidelines for Querying

1. **Units**: Always include relevant units (e.g., °C, kW, g/kWh) when discussing technical metrics.
2. **Comparisons**: Ensure time periods and contexts are aligned when comparing data.
3. **Clarification**: Prompt for clarification if user requests are ambiguous or incomplete.
4. **Presentation**: Return results in a structured and easy-to-read format (e.g., tables or bullet points).

## Special Instructions

- Always use the correct column names as defined in the table schema.
- Pay special attention to \`DECIMAL\` fields to avoid rounding or precision errors.
- Schema to use: **Shipping**
`;


const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

const llm = new ChatOpenAI({ 
    model: "gpt-4o", 
    temperature: 0,
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
            maxIterations: 15
        });

        const result = await agentExecutor.invoke({ 
            input: query, 
            history: history 
        });

        // return {
        //     output: formatTechnicalOutput(result["output"]),
        //     success: true
        // };

        return {
            output: result["output"],
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