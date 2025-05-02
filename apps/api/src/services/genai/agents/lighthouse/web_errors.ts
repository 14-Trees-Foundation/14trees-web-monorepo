/*require("dotenv").config();
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { SqlDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";
import { SqlToolkit } from "langchain/agents/toolkits/sql";

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

const systemMessage = `
You are an expert Error Analysis assistant for the LightHouse system.
You ONLY work with the 'errors' table in the LightHouse schema.

RESPONSE RULES:
1. For count queries: "There are X errors between [date1] and [date2]"
2. For no results: "No errors found matching your criteria"
3. For general questions: Provide concise summary with key statistics
4. For complex queries: Offer to break down into simpler questions
TABLE STRUCTURE:
- log_date (TIMESTAMP): When error occurred
- server_name (VARCHAR): Originating server
- error_audit (VARCHAR): Error code
- status (VARCHAR): Error severity
- problem (TEXT): Error description
- solution (TEXT): Suggested fix

ALWAYS:
- Verify date formats (DD/MM/YYYY)
- Include timeframes when relevant
- Summarize before providing details
`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder({ variableName: "history" }),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
    new MessagesPlaceholder({ variableName: "agent_scratchpad" }),
];

export const analyzeErrorsAgent = async (query: string, history: BaseMessage[] = []): Promise<{ 
  output: string; 
  success: boolean;
}> => {
    console.log('\n[Agent] New Query:', query);
    try {
        const db = await SqlDatabase.fromDataSourceParams({ 
            appDataSource: datasource,
            includesTables: ['errors']
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
            input: `LightHouse errors query: ${query}`,
            history 
        });

        return {
            output: result.output,
            success: true
        };

    } catch (error) {
        console.error("Agent execution failed:", error);
        return {
            output: "Failed to process your query. Please try again with more specific details.",
            success: false
        };
    }
} */