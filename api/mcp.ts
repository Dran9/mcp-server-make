import { createMcpHandler } from 'mcp-handler';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MakeClient, MakeApiError } from "../src/make-client.js";

const API_TOKEN = process.env.MAKE_API_TOKEN;
const ZONE = process.env.MAKE_ZONE || "eu1";

const client = new MakeClient({ apiToken: API_TOKEN || '', zone: ZONE });

const tools = [
  {
    name: "list_scenarios",
    description: "List all scenarios for a team or organization",
    inputSchema: {
      type: "object",
      properties: {
        teamId: { type: "number", description: "Team ID" },
        organizationId: { type: "number", description: "Organization ID" },
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
  },
  {
    name: "run_scenario",
    description: "Run a scenario immediately",
    inputSchema: {
      type: "object",
      properties: {
        scenarioId: { type: "number", description: "Scenario ID" },
      },
      required: ["scenarioId"],
    },
  }
  // Se pueden añadir más herramientas siguiendo el patrón de src/index.ts
];

const handler = createMcpHandler((server) => {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case "list_scenarios": {
          const result = await client.listScenarios(
            args?.teamId as number,
            args?.organizationId as number,
            { limit: args?.limit as number, offset: args?.offset as number }
          );
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        case "run_scenario": {
          const result = await client.runScenario(args?.scenarioId as number);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (error) {
      return { content: [{ type: "text", text: String(error) }], isError: true };
    }
  });
});

export const GET = handler;
export const POST = handler;
