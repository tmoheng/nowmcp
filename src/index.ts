#!/usr/bin/env node

/**
 * nowmcp - ServiceNow MCP Server
 * Entry point for the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig, getInstanceConfig } from './config/index.js';
import { ServiceNowClient } from './services/servicenow-client.js';
import { InstanceName } from './types/config.js';
import {
  getIncidentTools,
  incidentQuery,
  incidentGet,
  incidentCreate,
  incidentUpdate,
  incidentDelete,
} from './tools/incident-tools.js';

/**
 * ServiceNow MCP Server
 */
class ServiceNowMCPServer {
  private server: Server;
  private clients: Map<InstanceName, ServiceNowClient>;
  private config: ReturnType<typeof loadConfig>;

  constructor() {
    // Load configuration
    this.config = loadConfig();
    this.clients = new Map();

    // Create ServiceNow clients for each configured instance
    for (const [name, instanceConfig] of Object.entries(this.config.instances)) {
      if (instanceConfig) {
        this.clients.set(
          name as InstanceName,
          new ServiceNowClient(instanceConfig)
        );
      }
    }

    // Create MCP server
    this.server = new Server(
      {
        name: 'nowmcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Get ServiceNow client for a specific instance
   */
  private getClient(instanceName?: string): ServiceNowClient {
    const name = (instanceName as InstanceName) || this.config.defaultInstance;
    const client = this.clients.get(name);

    if (!client) {
      throw new Error(
        `ServiceNow instance "${name}" is not configured. Available instances: ${Array.from(this.clients.keys()).join(', ')}`
      );
    }

    return client;
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const availableInstances = Array.from(this.clients.keys());

      return {
        tools: [
          {
            name: 'servicenow_test_connection',
            description:
              'Test connection to a ServiceNow instance to verify credentials and connectivity',
            inputSchema: {
              type: 'object',
              properties: {
                instance: {
                  type: 'string',
                  description:
                    'Instance name (primary, dev, test, prod). If not specified, uses the default instance.',
                  enum: availableInstances,
                },
              },
            },
          },
          {
            name: 'servicenow_query',
            description:
              'Query any ServiceNow table with filters. This is a generic tool for advanced users.',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description:
                    'ServiceNow table name (e.g., "incident", "sc_req_item", "sc_task")',
                },
                filter: {
                  type: 'object',
                  description:
                    'Filter criteria as key-value pairs. Example: {"state": "New", "priority": "1"}',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of records to return (default: 100)',
                },
                instance: {
                  type: 'string',
                  description: 'Instance name (if multiple instances configured)',
                  enum: availableInstances,
                },
              },
              required: ['table'],
            },
          },
          // Incident Management Tools
          ...getIncidentTools(),
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'servicenow_test_connection':
            return await this.handleTestConnection(args);

          case 'servicenow_query':
            return await this.handleQuery(args);

          // Incident Management Tools
          case 'incident_query': {
            const client = this.getClient((args as any)?.instance);
            return await this.handleIncidentTool(() => incidentQuery(client, args));
          }

          case 'incident_get': {
            const client = this.getClient((args as any)?.instance);
            return await this.handleIncidentTool(() => incidentGet(client, args));
          }

          case 'incident_create': {
            const client = this.getClient((args as any)?.instance);
            return await this.handleIncidentTool(() => incidentCreate(client, args));
          }

          case 'incident_update': {
            const client = this.getClient((args as any)?.instance);
            return await this.handleIncidentTool(() => incidentUpdate(client, args));
          }

          case 'incident_delete': {
            const client = this.getClient((args as any)?.instance);
            return await this.handleIncidentTool(() => incidentDelete(client, args));
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle test connection tool
   */
  private async handleTestConnection(args: any) {
    const client = this.getClient(args.instance);
    const isConnected = await client.testConnection();

    if (isConnected) {
      return {
        content: [
          {
            type: 'text',
            text: `✓ Successfully connected to ServiceNow instance`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `✗ Failed to connect to ServiceNow instance. Please check your credentials and instance URL.`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle generic query tool
   */
  private async handleQuery(args: any) {
    const { table, filter, limit = 100, instance } = args;
    const client = this.getClient(instance);

    const results = await client.queryTable(table, filter, { limit });

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} record(s) in table "${table}":\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  /**
   * Handle incident tools (generic wrapper)
   */
  private async handleIncidentTool(handler: () => Promise<string>) {
    const result = await handler();
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is used for MCP protocol)
    console.error('ServiceNow MCP Server started');
    console.error(
      `Configured instances: ${Array.from(this.clients.keys()).join(', ')}`
    );
    console.error(`Default instance: ${this.config.defaultInstance}`);
  }
}

// Start the server
const server = new ServiceNowMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
