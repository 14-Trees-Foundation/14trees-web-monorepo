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
  host: process.env.POSTGRES_HOST || "your-host",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_READER_USER || "your-user",
  password: process.env.POSTGRES_READER_PD,
  database: process.env.POSTGRES_DB || "defaultdb",
  schema: "14trees_2", // Schema specified here
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

// System prompt specialized for 14trees_2 data
const systemMessage = `
You are an expert assistant for the 14trees_2 database with deep knowledge of:

## Core Domains
1. TREE PLANTING SYSTEM
- Trees, plots, sites, and plant types
- Tree growth tracking (trees_snapshots)
- Land types and pond management

2. DONATION & GIFT CARDS
- Donations and donors (donations, donation_users)
- Gift cards and redemption (gift_cards, gift_redeem_transactions)
- Gift requests and templates

3. USER MANAGEMENT
- Users, groups, and permissions
- Shift assignments

## Key Tables & Relationships
- trees ↔ plots ↔ sites (core planting hierarchy)
- donations ↔ donation_users (donor information)
- gift_card_requests ↔ gift_redeem_transactions (redemption flow)
- users ↔ user_groups ↔ groups (access control)

## Query Guidelines
1. For tree/plot queries, always specify location filters when possible
2. For donations/gifts, include date ranges for financial reporting
3. For user data, respect privacy - only query necessary fields
4. Verify IDs before executing joins across large tables
5. Present results in clear, organized formats

## Special Instructions
- All tables are in '14trees_2' schema
- trees table (88M rows) requires careful filtering
- Use exact column names from schema
- Timestamp fields are in UTC
`;

const messages = [
  SystemMessagePromptTemplate.fromTemplate(systemMessage),
  new MessagesPlaceholder({ variableName: "history" }),
  HumanMessagePromptTemplate.fromTemplate("{input}"),
  new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

// Initialize LLM with optimized settings
const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  configuration: {
    apiKey: process.env.OPENAI_API_KEY,
  }
});

export const query14TreesAgent = async (
  query: string,
  history: BaseMessage[] = [],
  requestId: string // Must be provided by frontend now
): Promise<{
  text_output: string;
  success: boolean;
  requestId: string;
}> => {
  try {
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: datasource
    });

    const sqlToolkit = new SqlToolkit(db, llm);
    const tools = sqlToolkit.getTools();

    const agent = await createOpenAIToolsAgent({
      llm,
      tools,
      prompt
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: process.env.NODE_ENV === 'development',
      maxIterations: 20,
      handleParsingErrors: true
    });

    console.log(`[RequestID: ${requestId}] Processing query: ${query.substring(0, 50)}...`);

    const result = await agentExecutor.invoke({
      input: query,
      history: history
    });

    if (result.output.includes("Agent stopped due to max iterations")) {
      return {
        text_output: "Please provide a more specific/detailed query",
        success: false,
        requestId
      };
    }

    return {
      text_output: result.output,
      success: true,
      requestId
    };

  } catch (error) {
    console.error(`[RequestID: ${requestId}] Query failed:`, error);
    return {
      text_output: "Sorry, I couldn't process your tree planting query. Please try again with more specific details.",
      success: false,
      requestId
    };
  }
};

// Type definitions
export interface TreesAgentResult {
  output: string;
  success: boolean;
  requestId: string;
}
