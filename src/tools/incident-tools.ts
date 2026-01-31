/**
 * Incident Management Tools
 * MCP tools for ServiceNow Incident table operations
 */

import { ServiceNowClient } from '../services/servicenow-client.js';
import { Incident } from '../types/incident.js';
import { QueryFilter } from '../types/servicenow.js';

const INCIDENT_TABLE = 'incident';

/**
 * Query incidents with filters
 */
export async function incidentQuery(
  client: ServiceNowClient,
  args: any
): Promise<string> {
  const { filter, limit = 100, fields } = args;

  const results = await client.queryTable<Incident>(
    INCIDENT_TABLE,
    filter,
    { limit, fields }
  );

  if (results.length === 0) {
    return 'No incidents found matching the criteria.';
  }

  return `Found ${results.length} incident(s):\n\n${JSON.stringify(results, null, 2)}`;
}

/**
 * Get a specific incident by number or sys_id
 */
export async function incidentGet(
  client: ServiceNowClient,
  args: any
): Promise<string> {
  const { identifier, fields } = args;

  let incident: Incident;

  // Check if identifier looks like a sys_id (32 character hex string)
  if (/^[a-f0-9]{32}$/i.test(identifier)) {
    // Get by sys_id
    incident = await client.getRecord<Incident>(
      INCIDENT_TABLE,
      identifier,
      { fields }
    );
  } else {
    // Get by incident number
    const results = await client.queryTable<Incident>(
      INCIDENT_TABLE,
      { number: identifier },
      { limit: 1, fields }
    );

    if (results.length === 0) {
      return `Incident "${identifier}" not found.`;
    }

    incident = results[0];
  }

  return `Incident Details:\n\n${JSON.stringify(incident, null, 2)}`;
}

/**
 * Create a new incident
 */
export async function incidentCreate(
  client: ServiceNowClient,
  args: any
): Promise<string> {
  const {
    short_description,
    description,
    priority,
    urgency,
    impact,
    category,
    subcategory,
    assignment_group,
    assigned_to,
    caller_id,
    ...otherFields
  } = args;

  // Build incident data
  const incidentData: Partial<Incident> = {
    short_description,
    ...otherFields,
  };

  // Add optional fields if provided
  if (description) incidentData.description = description;
  if (priority) incidentData.priority = priority;
  if (urgency) incidentData.urgency = urgency;
  if (impact) incidentData.impact = impact;
  if (category) incidentData.category = category;
  if (subcategory) incidentData.subcategory = subcategory;
  if (assignment_group) incidentData.assignment_group = assignment_group;
  if (assigned_to) incidentData.assigned_to = assigned_to;
  if (caller_id) incidentData.caller_id = caller_id;

  const newIncident = await client.createRecord<Incident>(
    INCIDENT_TABLE,
    incidentData
  );

  return `✓ Incident created successfully!\n\nIncident Number: ${newIncident.number}\nSys ID: ${newIncident.sys_id}\n\nDetails:\n${JSON.stringify(newIncident, null, 2)}`;
}

/**
 * Update an existing incident
 */
export async function incidentUpdate(
  client: ServiceNowClient,
  args: any
): Promise<string> {
  const { identifier, ...updateData } = args;

  let sysId: string;

  // Check if identifier is a sys_id
  if (/^[a-f0-9]{32}$/i.test(identifier)) {
    sysId = identifier;
  } else {
    // Look up by incident number
    const results = await client.queryTable<Incident>(
      INCIDENT_TABLE,
      { number: identifier },
      { limit: 1, fields: ['sys_id', 'number'] }
    );

    if (results.length === 0) {
      return `Incident "${identifier}" not found.`;
    }

    sysId = results[0].sys_id;
  }

  const updatedIncident = await client.updateRecord<Incident>(
    INCIDENT_TABLE,
    sysId,
    updateData
  );

  return `✓ Incident updated successfully!\n\nIncident Number: ${updatedIncident.number}\n\nUpdated Details:\n${JSON.stringify(updatedIncident, null, 2)}`;
}

/**
 * Delete an incident
 */
export async function incidentDelete(
  client: ServiceNowClient,
  args: any
): Promise<string> {
  const { identifier, confirm } = args;

  if (!confirm) {
    return 'Error: Delete operation requires confirmation. Set confirm=true to proceed.';
  }

  let sysId: string;
  let incidentNumber: string;

  // Check if identifier is a sys_id
  if (/^[a-f0-9]{32}$/i.test(identifier)) {
    // Get the incident number first for the confirmation message
    const incident = await client.getRecord<Incident>(
      INCIDENT_TABLE,
      identifier,
      { fields: ['sys_id', 'number'] }
    );
    sysId = incident.sys_id;
    incidentNumber = incident.number;
  } else {
    // Look up by incident number
    const results = await client.queryTable<Incident>(
      INCIDENT_TABLE,
      { number: identifier },
      { limit: 1, fields: ['sys_id', 'number'] }
    );

    if (results.length === 0) {
      return `Incident "${identifier}" not found.`;
    }

    sysId = results[0].sys_id;
    incidentNumber = results[0].number;
  }

  await client.deleteRecord(INCIDENT_TABLE, sysId);

  return `✓ Incident ${incidentNumber} deleted successfully.`;
}

/**
 * Get tool definitions for incident management
 */
export function getIncidentTools() {
  return [
    {
      name: 'incident_query',
      description:
        'Query ServiceNow incidents with optional filters. Returns a list of incidents matching the criteria.',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'object',
            description:
              'Filter criteria as key-value pairs. Examples: {"state": "1"} for New incidents, {"priority": "1", "state": "2"} for Critical incidents In Progress. Common fields: state (1=New, 2=In Progress, 6=Resolved, 7=Closed), priority (1=Critical, 2=High, 3=Moderate, 4=Low), urgency, impact, assignment_group, assigned_to, caller_id, category, short_description',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of records to return (default: 100)',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Specific fields to return. If not specified, returns all fields.',
          },
          instance: {
            type: 'string',
            description: 'ServiceNow instance to query (if multiple configured)',
          },
        },
      },
    },
    {
      name: 'incident_get',
      description:
        'Get a specific incident by incident number (e.g., "INC0010001") or sys_id. Returns full incident details.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description:
              'Incident number (e.g., "INC0010001") or sys_id (32-character hex string)',
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Specific fields to return. If not specified, returns all fields.',
          },
          instance: {
            type: 'string',
            description: 'ServiceNow instance to query (if multiple configured)',
          },
        },
        required: ['identifier'],
      },
    },
    {
      name: 'incident_create',
      description:
        'Create a new ServiceNow incident. Returns the created incident with its incident number and sys_id.',
      inputSchema: {
        type: 'object',
        properties: {
          short_description: {
            type: 'string',
            description: 'Brief description of the incident (required)',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the incident',
          },
          priority: {
            type: 'string',
            description:
              'Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning',
          },
          urgency: {
            type: 'string',
            description: 'Urgency: 1=High, 2=Medium, 3=Low',
          },
          impact: {
            type: 'string',
            description: 'Impact: 1=High, 2=Medium, 3=Low',
          },
          category: {
            type: 'string',
            description: 'Incident category',
          },
          subcategory: {
            type: 'string',
            description: 'Incident subcategory',
          },
          assignment_group: {
            type: 'string',
            description: 'Assignment group sys_id or name',
          },
          assigned_to: {
            type: 'string',
            description: 'Assigned user sys_id or username',
          },
          caller_id: {
            type: 'string',
            description: 'Caller user sys_id or username',
          },
          instance: {
            type: 'string',
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['short_description'],
      },
    },
    {
      name: 'incident_update',
      description:
        'Update an existing incident by incident number or sys_id. Provide the fields to update.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description:
              'Incident number (e.g., "INC0010001") or sys_id to update',
          },
          state: {
            type: 'string',
            description:
              'State: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed, 8=Canceled',
          },
          priority: {
            type: 'string',
            description:
              'Priority: 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning',
          },
          short_description: {
            type: 'string',
            description: 'Brief description',
          },
          description: {
            type: 'string',
            description: 'Detailed description',
          },
          work_notes: {
            type: 'string',
            description: 'Work notes (internal comments)',
          },
          comments: {
            type: 'string',
            description: 'Customer-visible comments',
          },
          assignment_group: {
            type: 'string',
            description: 'Assignment group',
          },
          assigned_to: {
            type: 'string',
            description: 'Assigned user',
          },
          close_code: {
            type: 'string',
            description: 'Close code (when closing incident)',
          },
          close_notes: {
            type: 'string',
            description: 'Close notes (when closing incident)',
          },
          instance: {
            type: 'string',
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['identifier'],
      },
    },
    {
      name: 'incident_delete',
      description:
        'Delete an incident by incident number or sys_id. Requires confirmation.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Incident number (e.g., "INC0010001") or sys_id',
          },
          confirm: {
            type: 'boolean',
            description: 'Must be set to true to confirm deletion',
          },
          instance: {
            type: 'string',
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['identifier', 'confirm'],
      },
    },
  ];
}
