#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MakeClient, MakeApiError } from "./make-client.js";

const API_TOKEN = process.env.MAKE_API_TOKEN;
const ZONE = process.env.MAKE_ZONE || "eu1";

if (!API_TOKEN) {
  console.error("Error: MAKE_API_TOKEN environment variable is required");
  process.exit(1);
}

const client = new MakeClient({ apiToken: API_TOKEN, zone: ZONE });

const server = new Server(
  {
    name: "mcp-make-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools = [
  {
    name: "list_scenarios",
    description: "List all scenarios for a team or organization",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID (required if no organizationId)" },
        organizationId: { type: "number", description: "Organization ID (required if no teamId)" },
        limit: { type: "number", description: "Max results (default 50)" },
        offset: { type: "number", description: "Pagination offset" },
      },
    },
  },
  {
    name: "get_scenario",
    description: "Get details of a specific scenario",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "create_scenario",
    description: "Create a new scenario with a blueprint. The blueprint defines the workflow modules and their connections.",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID where to create the scenario" },
        name: { type: "string", description: "Scenario name" },
        blueprint: { type: "string", description: "JSON string of the scenario blueprint with flow array" },
        scheduling: { 
          type: "string", 
          description: "Scheduling config JSON. Use '{\"type\":\"on-demand\"}' for manual trigger or '{\"type\":\"indefinitely\",\"interval\":15}' for scheduled (interval in minutes)" 
        },
        folderId: { type: "number", description: "Optional folder ID" },
      },
      required: ["teamId", "blueprint", "scheduling"],
    },
  },
  {
    name: "update_scenario",
    description: "Update an existing scenario (name, blueprint, scheduling, folder)",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID to update" },
        name: { type: "string", description: "New scenario name" },
        blueprint: { type: "string", description: "New blueprint JSON string" },
        scheduling: { type: "string", description: "New scheduling config JSON" },
        folderId: { type: "number", description: "New folder ID" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "delete_scenario",
    description: "Delete a scenario permanently",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID to delete" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "activate_scenario",
    description: "Activate a scenario so it can run",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID to activate" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "deactivate_scenario",
    description: "Deactivate a scenario to stop it from running",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID to deactivate" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "run_scenario",
    description: "Run a scenario immediately. Scenario must be active and set to on-demand scheduling.",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID to run" },
        data: { type: "object", description: "Input data for scenario inputs" },
        responsive: { type: "boolean", description: "Wait for result (max 40s)" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "clone_scenario",
    description: "Clone/duplicate a scenario",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Source scenario ID" },
        name: { type: "string", description: "Name for the clone" },
        teamId: { type: "number", description: "Target team ID" },
        organizationId: { type: "number", description: "Organization ID" },
      },
      required: ["scenarioId", "name", "teamId", "organizationId"],
    },
  },
  {
    name: "get_scenario_blueprint",
    description: "Get the full blueprint (flow definition) of a scenario",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "get_scenario_logs",
    description: "Get execution logs for a scenario",
    inputSchema: {
      type: "object" as const,
      properties: {
        scenarioId: { type: "number", description: "Scenario ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "list_connections",
    description: "List all connections (API credentials) for a team",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "list_hooks",
    description: "List all webhooks for a team",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "list_data_stores",
    description: "List all data stores for a team",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["teamId"],
    },
  },
  {
    name: "get_data_store",
    description: "Get details of a data store",
    inputSchema: {
      type: "object" as const,
      properties: {
        dataStoreId: { type: "number", description: "Data Store ID" },
      },
      required: ["dataStoreId"],
    },
  },
  {
    name: "create_data_store",
    description: "Create a new data store",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "number", description: "Team ID" },
        name: { type: "string", description: "Data store name" },
        maxSize: { type: "number", description: "Max size in MB" },
      },
      required: ["teamId", "name"],
    },
  },
  {
    name: "list_data_store_records",
    description: "List records in a data store",
    inputSchema: {
      type: "object" as const,
      properties: {
        dataStoreId: { type: "number", description: "Data Store ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["dataStoreId"],
    },
  },
  {
    name: "create_data_store_record",
    description: "Create a record in a data store",
    inputSchema: {
      type: "object" as const,
      properties: {
        dataStoreId: { type: "number", description: "Data Store ID" },
        data: { type: "object", description: "Record data" },
      },
      required: ["dataStoreId", "data"],
    },
  },
  {
    name: "list_teams",
    description: "List all teams in an organization",
    inputSchema: {
      type: "object" as const,
      properties: {
        organizationId: { type: "number", description: "Organization ID" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["organizationId"],
    },
  },
  {
    name: "list_organizations",
    description: "List all organizations the user has access to",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results" },
      },
    },
  },
  {
    name: "get_current_user",
    description: "Get information about the authenticated user",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_scenarios": {
        const result = await client.listScenarios(
          args?.teamId as number | undefined,
          args?.organizationId as number | undefined,
          { limit: args?.limit as number, offset: args?.offset as number }
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_scenario": {
        const result = await client.getScenario(args?.scenarioId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_scenario": {
        const result = await client.createScenario({
          teamId: args?.teamId as number,
          blueprint: args?.blueprint as string,
          scheduling: args?.scheduling as string,
          folderId: args?.folderId as number | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "update_scenario": {
        const result = await client.updateScenario(args?.scenarioId as number, {
          name: args?.name as string | undefined,
          blueprint: args?.blueprint as string | undefined,
          scheduling: args?.scheduling as string | undefined,
          folderId: args?.folderId as number | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "delete_scenario": {
        const result = await client.deleteScenario(args?.scenarioId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "activate_scenario": {
        const result = await client.activateScenario(args?.scenarioId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "deactivate_scenario": {
        const result = await client.deactivateScenario(args?.scenarioId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "run_scenario": {
        const result = await client.runScenario(args?.scenarioId as number, {
          data: args?.data as Record<string, unknown> | undefined,
          responsive: args?.responsive as boolean | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "clone_scenario": {
        const result = await client.cloneScenario(
          args?.scenarioId as number,
          args?.name as string,
          args?.teamId as number,
          args?.organizationId as number
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_scenario_blueprint": {
        const result = await client.getScenarioBlueprint(args?.scenarioId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_scenario_logs": {
        const result = await client.getScenarioLogs(args?.scenarioId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_connections": {
        const result = await client.listConnections(args?.teamId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_hooks": {
        const result = await client.listHooks(args?.teamId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_data_stores": {
        const result = await client.listDataStores(args?.teamId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_data_store": {
        const result = await client.getDataStore(args?.dataStoreId as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_data_store": {
        const result = await client.createDataStore(
          args?.teamId as number,
          args?.name as string,
          args?.maxSize as number | undefined
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_data_store_records": {
        const result = await client.listDataStoreRecords(args?.dataStoreId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_data_store_record": {
        const result = await client.createDataStoreRecord(
          args?.dataStoreId as number,
          args?.data as Record<string, unknown>
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_teams": {
        const result = await client.listTeams(args?.organizationId as number, {
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "list_organizations": {
        const result = await client.listOrganizations({
          limit: args?.limit as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_current_user": {
        const result = await client.getCurrentUser();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    if (error instanceof MakeApiError) {
      return {
        content: [{ type: "text", text: `Make API Error: ${error.message}` }],
        isError: true,
      };
    }
    throw error;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Make.com MCP Server running on stdio");
}

main().catch(console.error);
