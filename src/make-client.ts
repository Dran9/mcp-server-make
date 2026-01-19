/**
 * Make.com API Client
 * Full API client for interacting with Make.com REST API
 */

export interface MakeConfig {
  apiToken: string;
  zone: string; // eu1, eu2, us1, us2
}

export interface Scenario {
  id: number;
  name: string;
  teamId: number;
  folderId?: number;
  isActive: boolean;
  isPaused: boolean;
  isInvalid: boolean;
  isLocked: boolean;
  scheduling: string;
  description?: string;
  created: string;
  lastEdit: string;
  usedPackages?: string[];
}

export interface ScenarioBlueprint {
  name: string;
  flow: BlueprintModule[];
  metadata?: {
    version: number;
    scenario: {
      roundtrips: number;
      maxErrors: number;
      autoCommit: boolean;
      autoCommitTriggerLast: boolean;
      sequential: boolean;
    };
  };
}

export interface BlueprintModule {
  id: number;
  module: string;
  version: number;
  mapper?: Record<string, unknown>;
  metadata?: {
    designer?: {
      x: number;
      y: number;
    };
    restore?: Record<string, unknown>;
    parameters?: unknown[];
    expect?: unknown[];
  };
  routes?: BlueprintRoute[];
}

export interface BlueprintRoute {
  flow: BlueprintModule[];
}

export interface Connection {
  id: number;
  name: string;
  accountName: string;
  accountLabel: string;
  packageName: string;
  expire?: string;
  metadata?: Record<string, unknown>;
  teamId: number;
  upgradeable: boolean;
  scoped: boolean;
  scopes?: string[];
}

export interface Hook {
  id: number;
  name: string;
  teamId: number;
  url: string;
  type: string;
  packageName: string;
  theme?: string;
  enabled: boolean;
}

export interface DataStore {
  id: number;
  name: string;
  teamId: number;
  records: number;
  size: number;
  maxSize: number;
  dataStructureId?: number;
}

export interface Team {
  id: number;
  name: string;
  organizationId: number;
}

export interface Organization {
  id: number;
  name: string;
  zone: string;
  countryId: number;
  timezoneId: number;
}

export interface CreateScenarioParams {
  teamId: number;
  blueprint: string;
  scheduling: string;
  folderId?: number;
}

export interface UpdateScenarioParams {
  name?: string;
  blueprint?: string;
  scheduling?: string;
  folderId?: number;
}

export interface RunScenarioParams {
  data?: Record<string, unknown>;
  responsive?: boolean;
}

export interface PaginationParams {
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export class MakeApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public detail?: string
  ) {
    super(`Make API Error ${statusCode}: ${statusText}${detail ? ` - ${detail}` : ''}`);
    this.name = 'MakeApiError';
  }
}

export class MakeClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(private config: MakeConfig) {
    this.baseUrl = `https://${config.zone}.make.com/api/v2`;
    this.headers = {
      'Authorization': `Token ${config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    
    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.message || errorBody.detail || JSON.stringify(errorBody);
      } catch {
        // Ignore JSON parse errors
      }
      throw new MakeApiError(response.status, response.statusText, detail);
    }

    return response.json() as Promise<T>;
  }

  // ============ SCENARIOS ============

  async listScenarios(
    teamId?: number,
    organizationId?: number,
    pagination?: PaginationParams
  ): Promise<{ scenarios: Scenario[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (teamId) queryParams.teamId = teamId;
    if (organizationId) queryParams.organizationId = organizationId;
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;
    if (pagination?.sortBy) queryParams['pg[sortBy]'] = pagination.sortBy;
    if (pagination?.sortDir) queryParams['pg[sortDir]'] = pagination.sortDir;

    return this.request<{ scenarios: Scenario[] }>('GET', '/scenarios', undefined, queryParams);
  }

  async getScenario(scenarioId: number): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>('GET', `/scenarios/${scenarioId}`);
  }

  async createScenario(params: CreateScenarioParams): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>('POST', '/scenarios', params, { confirmed: true });
  }

  async updateScenario(scenarioId: number, params: UpdateScenarioParams): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>('PATCH', `/scenarios/${scenarioId}`, params, { confirmed: true });
  }

  async deleteScenario(scenarioId: number): Promise<{ scenario: { id: number } }> {
    return this.request<{ scenario: { id: number } }>('DELETE', `/scenarios/${scenarioId}`);
  }

  async activateScenario(scenarioId: number): Promise<{ scenario: { id: number; isActive: boolean } }> {
    return this.request<{ scenario: { id: number; isActive: boolean } }>('POST', `/scenarios/${scenarioId}/start`);
  }

  async deactivateScenario(scenarioId: number): Promise<{ scenario: { id: number; isActive: boolean } }> {
    return this.request<{ scenario: { id: number; isActive: boolean } }>('POST', `/scenarios/${scenarioId}/stop`);
  }

  async runScenario(scenarioId: number, params?: RunScenarioParams): Promise<{ executionId: string; status?: string; outputs?: unknown }> {
    return this.request<{ executionId: string; status?: string; outputs?: unknown }>(
      'POST',
      `/scenarios/${scenarioId}/run`,
      params
    );
  }

  async cloneScenario(
    scenarioId: number,
    name: string,
    teamId: number,
    organizationId: number,
    states: boolean = false
  ): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>(
      'POST',
      `/scenarios/${scenarioId}/clone`,
      { name, teamId, states },
      { organizationId }
    );
  }

  // ============ BLUEPRINTS ============

  async getScenarioBlueprint(scenarioId: number): Promise<{ response: { blueprint: ScenarioBlueprint } }> {
    return this.request<{ response: { blueprint: ScenarioBlueprint } }>('GET', `/scenarios/${scenarioId}/blueprint`);
  }

  async updateScenarioBlueprint(scenarioId: number, blueprint: string): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>('PATCH', `/scenarios/${scenarioId}`, { blueprint }, { confirmed: true });
  }

  // ============ SCENARIO INTERFACE (Inputs/Outputs) ============

  async getScenarioInterface(scenarioId: number): Promise<{ interface: { input: unknown[]; output: unknown[] } }> {
    return this.request<{ interface: { input: unknown[]; output: unknown[] } }>('GET', `/scenarios/${scenarioId}/interface`);
  }

  // ============ CONNECTIONS ============

  async listConnections(teamId: number, pagination?: PaginationParams): Promise<{ connections: Connection[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = { teamId };
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ connections: Connection[] }>('GET', '/connections', undefined, queryParams);
  }

  async getConnection(connectionId: number): Promise<{ connection: Connection }> {
    return this.request<{ connection: Connection }>('GET', `/connections/${connectionId}`);
  }

  async deleteConnection(connectionId: number): Promise<{ connection: { id: number } }> {
    return this.request<{ connection: { id: number } }>('DELETE', `/connections/${connectionId}`);
  }

  // ============ WEBHOOKS (Hooks) ============

  async listHooks(teamId: number, pagination?: PaginationParams): Promise<{ hooks: Hook[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = { teamId };
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ hooks: Hook[] }>('GET', '/hooks', undefined, queryParams);
  }

  async getHook(hookId: number): Promise<{ hook: Hook }> {
    return this.request<{ hook: Hook }>('GET', `/hooks/${hookId}`);
  }

  async deleteHook(hookId: number): Promise<{ hook: { id: number } }> {
    return this.request<{ hook: { id: number } }>('DELETE', `/hooks/${hookId}`);
  }

  // ============ DATA STORES ============

  async listDataStores(teamId: number, pagination?: PaginationParams): Promise<{ dataStores: DataStore[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = { teamId };
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ dataStores: DataStore[] }>('GET', '/data-stores', undefined, queryParams);
  }

  async getDataStore(dataStoreId: number): Promise<{ dataStore: DataStore }> {
    return this.request<{ dataStore: DataStore }>('GET', `/data-stores/${dataStoreId}`);
  }

  async createDataStore(
    teamId: number,
    name: string,
    maxSize?: number,
    dataStructureId?: number
  ): Promise<{ dataStore: DataStore }> {
    return this.request<{ dataStore: DataStore }>('POST', '/data-stores', {
      teamId,
      name,
      maxSizeMB: maxSize,
      dataStructureId,
    });
  }

  async deleteDataStore(dataStoreId: number): Promise<{ dataStore: { id: number } }> {
    return this.request<{ dataStore: { id: number } }>('DELETE', `/data-stores/${dataStoreId}`);
  }

  // ============ DATA STORE RECORDS ============

  async listDataStoreRecords(
    dataStoreId: number,
    pagination?: PaginationParams
  ): Promise<{ records: Record<string, unknown>[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ records: Record<string, unknown>[] }>(
      'GET',
      `/data-stores/${dataStoreId}/data`,
      undefined,
      queryParams
    );
  }

  async createDataStoreRecord(
    dataStoreId: number,
    data: Record<string, unknown>
  ): Promise<{ record: Record<string, unknown> }> {
    return this.request<{ record: Record<string, unknown> }>('POST', `/data-stores/${dataStoreId}/data`, data);
  }

  async updateDataStoreRecord(
    dataStoreId: number,
    recordKey: string,
    data: Record<string, unknown>
  ): Promise<{ record: Record<string, unknown> }> {
    return this.request<{ record: Record<string, unknown> }>('PUT', `/data-stores/${dataStoreId}/data/${recordKey}`, data);
  }

  async deleteDataStoreRecord(dataStoreId: number, recordKey: string): Promise<void> {
    await this.request<void>('DELETE', `/data-stores/${dataStoreId}/data/${recordKey}`);
  }

  // ============ TEAMS ============

  async listTeams(organizationId: number, pagination?: PaginationParams): Promise<{ teams: Team[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = { organizationId };
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ teams: Team[] }>('GET', '/teams', undefined, queryParams);
  }

  async getTeam(teamId: number): Promise<{ team: Team }> {
    return this.request<{ team: Team }>('GET', `/teams/${teamId}`);
  }

  // ============ ORGANIZATIONS ============

  async listOrganizations(pagination?: PaginationParams): Promise<{ organizations: Organization[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ organizations: Organization[] }>('GET', '/organizations', undefined, queryParams);
  }

  async getOrganization(organizationId: number): Promise<{ organization: Organization }> {
    return this.request<{ organization: Organization }>('GET', `/organizations/${organizationId}`);
  }

  // ============ USER ============

  async getCurrentUser(): Promise<{ user: { id: number; name: string; email: string } }> {
    return this.request<{ user: { id: number; name: string; email: string } }>('GET', '/users/me');
  }

  // ============ SCENARIO LOGS ============

  async getScenarioLogs(
    scenarioId: number,
    pagination?: PaginationParams
  ): Promise<{ scenarioLogs: unknown[] }> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (pagination?.offset) queryParams['pg[offset]'] = pagination.offset;
    if (pagination?.limit) queryParams['pg[limit]'] = pagination.limit;

    return this.request<{ scenarioLogs: unknown[] }>(
      'GET',
      `/scenarios/${scenarioId}/logs`,
      undefined,
      queryParams
    );
  }
}
