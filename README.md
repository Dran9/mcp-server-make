# MCP Make.com Server

A Model Context Protocol (MCP) server that provides **full access** to the Make.com API, including the ability to **create, modify, and delete scenarios** - not just run them.

## Features

| Feature | Support |
|---------|---------|
| List/Get Scenarios | Yes |
| **Create Scenarios** | **Yes** |
| **Update Scenarios (Blueprint)** | **Yes** |
| **Delete Scenarios** | **Yes** |
| Activate/Deactivate | Yes |
| Run Scenarios | Yes |
| Clone Scenarios | Yes |
| Get Blueprints | Yes |
| Connections Management | Yes |
| Webhooks Management | Yes |
| Data Stores CRUD | Yes |
| Teams/Organizations | Yes |

## Installation

```bash
git clone <repo>
cd mcp-make-server
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MAKE_API_TOKEN` | Yes | Your Make.com API token |
| `MAKE_ZONE` | No | API zone: `eu1`, `eu2`, `us1`, `us2` (default: `eu1`) |

### Get Your API Token

1. Go to Make.com > Profile > API
2. Create a new token with these scopes:
   - `scenarios:read`
   - `scenarios:write`
   - `scenarios:run`
   - `connections:read`
   - `hooks:read`
   - `datastores:read`
   - `datastores:write`
   - `teams:read`
   - `organizations:read`

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "make": {
      "command": "node",
      "args": ["/path/to/mcp-make-server/dist/index.js"],
      "env": {
        "MAKE_API_TOKEN": "your-api-token-here",
        "MAKE_ZONE": "eu1"
      }
    }
  }
}
```

### Cursor Configuration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "make": {
      "command": "node",
      "args": ["/path/to/mcp-make-server/dist/index.js"],
      "env": {
        "MAKE_API_TOKEN": "your-api-token-here",
        "MAKE_ZONE": "eu1"
      }
    }
  }
}
```

## Available Tools

### Scenarios

| Tool | Description |
|------|-------------|
| `list_scenarios` | List all scenarios for a team/org |
| `get_scenario` | Get scenario details |
| `create_scenario` | Create a new scenario with blueprint |
| `update_scenario` | Update scenario name/blueprint/scheduling |
| `delete_scenario` | Delete a scenario |
| `activate_scenario` | Turn on a scenario |
| `deactivate_scenario` | Turn off a scenario |
| `run_scenario` | Execute a scenario |
| `clone_scenario` | Duplicate a scenario |
| `get_scenario_blueprint` | Get full flow definition |
| `get_scenario_logs` | Get execution history |

### Connections & Webhooks

| Tool | Description |
|------|-------------|
| `list_connections` | List API connections |
| `list_hooks` | List webhooks |

### Data Stores

| Tool | Description |
|------|-------------|
| `list_data_stores` | List data stores |
| `get_data_store` | Get data store details |
| `create_data_store` | Create new data store |
| `list_data_store_records` | List records |
| `create_data_store_record` | Add a record |

### Organization

| Tool | Description |
|------|-------------|
| `list_teams` | List teams in org |
| `list_organizations` | List all orgs |
| `get_current_user` | Get authenticated user |

## Example: Create a Scenario

```typescript
// Blueprint for a simple HTTP -> JSON scenario
const blueprint = JSON.stringify({
  name: "My New Scenario",
  flow: [
    {
      id: 1,
      module: "http:ActionGetFile",
      version: 3,
      mapper: {
        url: "https://api.example.com/data",
        method: "get"
      }
    },
    {
      id: 2,
      module: "json:ParseJSON",
      version: 1,
      mapper: {
        json: "{{1.data}}"
      }
    }
  ]
});

// Create with on-demand scheduling
create_scenario({
  teamId: 123,
  blueprint: blueprint,
  scheduling: '{"type":"on-demand"}'
});
```

## Make.com API Zones

| Zone | Region |
|------|--------|
| `eu1` | EU (Default) |
| `eu2` | EU |
| `us1` | US |
| `us2` | US |

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## License

MIT
