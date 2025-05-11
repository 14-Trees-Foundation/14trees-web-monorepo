import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGiftingTools } from "./tools/gifting/gifting";

async function getMcpServer() {

    const server = new McpServer({
        name: "mcp-server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {}
        }
    });

    
    const tools = getGiftingTools();
    tools.forEach(tool => {
        server.tool(tool.name, tool.description, (tool.schema as any).shape, async (args: any) => {
            const resp = await tool.invoke(args);
            return { content: [{ type: "text", text: resp }] }
        })
    })

    return server;
}

export default getMcpServer;
