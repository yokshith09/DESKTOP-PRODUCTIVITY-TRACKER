import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

function buildServer() {
  const s = new McpServer({ name: "pet-demo-http", version: "0.1.0" });
  s.registerTool("add", { description: "Add two numbers.", inputSchema: { a: z.number(), b: z.number() } },
    async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] }));
  return s;
}

createServer(async (req, res) => {
  // Only loopback, only /mcp. A real deployment adds auth here (see the course).
  if (req.url !== "/mcp") { res.writeHead(404).end(); return; }
  if (req.method !== "POST") { res.writeHead(405, { Allow: "POST" }).end(); return; }
  let body = ""; for await (const chunk of req) body += chunk;
  // Stateless: a fresh server + transport per request, nothing remembered between calls.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close(); });
  await buildServer().connect(transport);
  await transport.handleRequest(req, res, JSON.parse(body));
}).listen(8765, "127.0.0.1", () => console.error("listening on http://127.0.0.1:8765/mcp"));
