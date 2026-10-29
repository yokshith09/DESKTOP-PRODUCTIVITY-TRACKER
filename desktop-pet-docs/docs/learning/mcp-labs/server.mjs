import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "pet-demo", version: "0.1.0" });

// A tool: the model decides when to call it. The description is part of your prompt.
server.registerTool(
  "say",
  {
    description: "Make the desktop pet say something in a speech bubble.",
    inputSchema: { text: z.string().min(1).max(140), pose: z.enum(["idle", "cheer", "work"]).default("idle") },
  },
  async ({ text, pose }) => {
    // NEVER write to stdout here: stdout is the protocol. Logs go to stderr.
    console.error(`say(${pose}): ${text}`);
    return { content: [{ type: "text", text: `The pet said: ${text}` }] };
  },
);

// A resource: data the app/user can attach, addressed by URI.
server.registerResource("status", "pet://status", { mimeType: "application/json", description: "What the pet is doing" },
  async (uri) => ({ contents: [{ uri: uri.href, text: JSON.stringify({ pose: "idle", tasksOpen: 3 }) }] }));

await server.connect(new StdioServerTransport());
