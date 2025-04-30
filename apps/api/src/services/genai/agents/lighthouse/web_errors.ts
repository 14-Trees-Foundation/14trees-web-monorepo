// src/agents/error-query.agent.ts
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { SqlToolkit } from "langchain/agents/toolkits/sql";

// Database Configuration
const datasource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "vivek-tree-vivek-tree.e.aivencloud.com",
  port: Number(process.env.DB_PORT) || 15050,
  username: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "defaultdb",
  schema: "LightHouse",
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

// System Prompt
const systemMessage = `
You are an Error Analysis assistant for the LightHouse system. 
Only work with the 'errors' table in LightHouse schema (read-only operations).

Key Error Fields:
- log_date: Date of error
- server_name: Originating server
- processor_name: Responsible processor
- module: System module
- status: Error status (critical/warning/info)
- problem: Error description
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

export const analyzeErrorsAgent = async (query: string, history: BaseMessage[] = []): Promise<{ output: string; query?: string; success: boolean }> => {
    const db = await SqlDatabase.fromDataSourceParams({ 
        appDataSource: datasource,
        includesTables: ['errors'] // Restrict to errors table
    });

    const llm = new ChatOpenAI({ 
        model: "gpt-4o",
        temperature: 0,
        configuration: { apiKey: process.env.OPENAI_API_KEY }
    });

    
    const toolkit = new SqlToolkit(db, llm);
    const tools = toolkit.getTools(); 

    const agent = await createOpenAIToolsAgent({ 
        llm, 
        tools, 
        prompt: ChatPromptTemplate.fromMessages(messages)
    });
    
    const result = await new AgentExecutor({
        agent,
        tools,
        verbose: process.env.NODE_ENV === 'development'
    }).invoke({ 
        input: `Regarding the LightHouse errors table: ${query}`,
        history 
    });

    return {
        output: result.output,
        // Built-in tools automatically provide these:
        query: result.intermediateSteps?.[0]?.action.toolInput,
        success: !result.intermediateSteps?.some((step: { observation: string }) => step.observation.includes('Error'))
    };
}