import express, { Request, Response } from 'express';
import getMcpServer from '../services/genai/mcp-server';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";


const routes = express.Router();

routes.post('/', async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.

    try {
        const server = await getMcpServer();
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        res.on('close', () => {
            console.log('Request closed');
            transport.close();
            server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

routes.get('/', async (req: Request, res: Response) => {
    try {
        const server = await getMcpServer();

        // Provide both `_endpoint` and `res` to the SSEServerTransport constructor
        const transport = new SSEServerTransport('/api/mcp', res);

        // Set appropriate headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        res.on('close', () => {
            console.log('SSE connection closed');
            transport.close();
            if (!res.headersSent) server.close();
        });

        // Connect the server to the transport
        await server.connect(transport);

        // Handle the request using the transport
        await transport.handlePostMessage(req, res);
    } catch (error) {
        console.error('Error handling SSE MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

routes.delete('/', async (req: Request, res: Response) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
            code: -32000,
            message: "Method not allowed."
        },
        id: null
    }));
});

export default routes;
