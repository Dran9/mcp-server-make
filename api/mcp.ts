import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { MakeClient } from '../src/make-client.js';

const API_TOKEN = process.env.MAKE_API_TOKEN || '';
const ZONE = process.env.MAKE_ZONE || 'eu1';

const client = new MakeClient({ apiToken: API_TOKEN, zone: ZONE });

const handler = createMcpHandler(
  (server) => {
    // --- SCENARIOS ---
    server.tool('list_scenarios', 'List all scenarios for a team or organization',
      { teamId: z.number().optional(), organizationId: z.number().optional(), limit: z.number().optional(), offset: z.number().optional() },
      async (args) => {
        const result = await client.listScenarios(args.teamId, args.organizationId, { limit: args.limit, offset: args.offset });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('get_scenario', 'Get details of a specific scenario',
      { scenarioId: z.number() },
      async (args) => {
        const result = await client.getScenario(args.scenarioId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('create_scenario', 'Create a new scenario with a blueprint',
      { teamId: z.number(), blueprint: z.string(), scheduling: z.string(), folderId: z.number().optional() },
      async (args) => {
        const result = await client.createScenario({ teamId: args.teamId, blueprint: args.blueprint, scheduling: args.scheduling, folderId: args.folderId });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('update_scenario', 'Update an existing scenario',
      { scenarioId: z.number(), name: z.string().optional(), blueprint: z.string().optional(), scheduling: z.string().optional(), folderId: z.number().optional() },
      async (args) => {
        const result = await client.updateScenario(args.scenarioId, { name: args.name, blueprint: args.blueprint, scheduling: args.scheduling, folderId: args.folderId });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('delete_scenario', 'Delete a scenario permanently',
      { scenarioId: z.number() },
      async (args) => {
        const result = await client.deleteScenario(args.scenarioId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('activate_scenario', 'Activate a scenario',
      { scenarioId: z.number() },
      async (args) => {
        const result = await client.activateScenario(args.scenarioId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('deactivate_scenario', 'Deactivate a scenario',
      { scenarioId: z.number() },
      async (args) => {
        const result = await client.deactivateScenario(args.scenarioId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('run_scenario', 'Run a scenario immediately',
      { scenarioId: z.number(), data: z.record(z.unknown()).optional(), responsive: z.boolean().optional() },
      async (args) => {
        const result = await client.runScenario(args.scenarioId, { data: args.data, responsive: args.responsive });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('clone_scenario', 'Clone/duplicate a scenario',
      { scenarioId: z.number(), name: z.string(), teamId: z.number(), organizationId: z.number() },
      async (args) => {
        const result = await client.cloneScenario(args.scenarioId, args.name, args.teamId, args.organizationId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('get_scenario_blueprint', 'Get the full blueprint of a scenario',
      { scenarioId: z.number() },
      async (args) => {
        const result = await client.getScenarioBlueprint(args.scenarioId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('get_scenario_logs', 'Get execution logs for a scenario',
      { scenarioId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.getScenarioLogs(args.scenarioId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    // --- CONNECTIONS & WEBHOOKS ---
    server.tool('list_connections', 'List all connections for a team',
      { teamId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.listConnections(args.teamId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('list_hooks', 'List all webhooks for a team',
      { teamId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.listHooks(args.teamId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    // --- DATA STORES ---
    server.tool('list_data_stores', 'List all data stores for a team',
      { teamId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.listDataStores(args.teamId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('get_data_store', 'Get details of a data store',
      { dataStoreId: z.number() },
      async (args) => {
        const result = await client.getDataStore(args.dataStoreId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('create_data_store', 'Create a new data store',
      { teamId: z.number(), name: z.string(), maxSize: z.number().optional() },
      async (args) => {
        const result = await client.createDataStore(args.teamId, args.name, args.maxSize);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('list_data_store_records', 'List records in a data store',
      { dataStoreId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.listDataStoreRecords(args.dataStoreId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('create_data_store_record', 'Create a record in a data store',
      { dataStoreId: z.number(), data: z.record(z.unknown()) },
      async (args) => {
        const result = await client.createDataStoreRecord(args.dataStoreId, args.data);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    // --- ORGANIZATION ---
    server.tool('list_teams', 'List all teams in an organization',
      { organizationId: z.number(), limit: z.number().optional() },
      async (args) => {
        const result = await client.listTeams(args.organizationId, { limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('list_organizations', 'List all organizations the user has access to',
      { limit: z.number().optional() },
      async (args) => {
        const result = await client.listOrganizations({ limit: args.limit });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool('get_current_user', 'Get information about the authenticated user',
      {},
      async () => {
        const result = await client.getCurrentUser();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );
  },
  {},
  {
    basePath: '/api',
    maxDuration: 60,
    verboseLogs: false,
  }
);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
