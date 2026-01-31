/**
 * Incident Management Tools
 * MCP tools for ServiceNow Incident table operations
 */

import { ZodError } from 'zod';
import { ServiceNowClient } from '../services/servicenow-client.js';
import { Incident } from '../types/incident.js';
import {
  IncidentQuerySchema,
  IncidentGetSchema,
  IncidentCreateSchema,
  IncidentUpdateSchema,
  IncidentDeleteSchema,
  type IncidentQueryInput,
  type IncidentGetInput,
  type IncidentCreateInput,
  type IncidentUpdateInput,
  type IncidentDeleteInput,
} from '../schemas/incident-schemas.js';

const INCIDENT_TABLE = 'incident';

/**
 * Format Zod validation errors for user-friendly output
 */
function formatValidationError(error: ZodError): string {
  const errors = error.issues.map(err => {
    const path = err.path.join('.');
    return `  - ${path ? path + ': ' : ''}${err.message}`;
  }).join('\n');

  return `Validation Error:\n${errors}`;
}

/**
 * Query incidents with filters
 */
export async function incidentQuery(
  client: ServiceNowClient,
  args: unknown
): Promise<string> {
  // Validate input
  let validatedArgs: IncidentQueryInput;
  try {
    validatedArgs = IncidentQuerySchema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }

  const { filter, limit, fields } = validatedArgs;

  const results = await client.queryTable<Incident>(
    INCIDENT_TABLE,
    filter as any, // Zod validated - safe cast
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
  args: unknown
): Promise<string> {
  // Validate input
  let validatedArgs: IncidentGetInput;
  try {
    validatedArgs = IncidentGetSchema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }

  const { identifier, fields } = validatedArgs;

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
  args: unknown
): Promise<string> {
  // Validate input
  let validatedArgs: IncidentCreateInput;
  try {
    validatedArgs = IncidentCreateSchema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }

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
    instance,
    ...otherFields
  } = validatedArgs;

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
  args: unknown
): Promise<string> {
  // Validate input
  let validatedArgs: IncidentUpdateInput;
  try {
    validatedArgs = IncidentUpdateSchema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }

  const { identifier, instance, ...updateData } = validatedArgs;

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
  args: unknown
): Promise<string> {
  // Validate input
  let validatedArgs: IncidentDeleteInput;
  try {
    validatedArgs = IncidentDeleteSchema.parse(args);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatValidationError(error));
    }
    throw error;
  }

  const { identifier, confirm } = validatedArgs;

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
        'Query ServiceNow incidents with optional filters. Returns a list of incidents matching the criteria. EXAMPLES: Find all new critical incidents: {"filter": {"state": "New", "priority": "Critical"}}. Find incidents assigned to a user: {"filter": {"assigned_to": "john.doe"}}. Find recent high priority incidents: {"filter": {"priority": "High"}, "limit": 10}.',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'object',
            description:
              'Filter criteria as key-value pairs. You can use either numeric codes OR human-readable values. Examples: {"state": "New"} or {"state": "1"}, {"priority": "Critical", "state": "In Progress"} or {"priority": "1", "state": "2"}. Common filter fields: state, priority, urgency, impact, assignment_group, assigned_to, caller_id, category, short_description, number',
            additionalProperties: true,
          },
          limit: {
            type: 'number',
            description: 'Maximum number of records to return (default: 100, max: 1000)',
            minimum: 1,
            maximum: 1000,
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Specific fields to return. Common fields: number, short_description, state, priority, assigned_to, opened_at, sys_id. If not specified, returns all fields.',
          },
          instance: {
            type: 'string',
            enum: ['primary', 'dev', 'test', 'prod'],
            description: 'ServiceNow instance to query (if multiple configured)',
          },
        },
      },
    },
    {
      name: 'incident_get',
      description:
        'Get a specific incident by incident number or sys_id. Returns full incident details. EXAMPLE: Get incident by number: {"identifier": "INC0010001"}. Get specific fields only: {"identifier": "INC0010001", "fields": ["short_description", "state", "priority"]}.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description:
              'Incident number (e.g., "INC0010001") or sys_id (32-character hex string)',
            minLength: 1,
          },
          fields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Specific fields to return. Common fields: number, short_description, state, priority, assigned_to, opened_at, work_notes. If not specified, returns all fields.',
          },
          instance: {
            type: 'string',
            enum: ['primary', 'dev', 'test', 'prod'],
            description: 'ServiceNow instance to query (if multiple configured)',
          },
        },
        required: ['identifier'],
      },
    },
    {
      name: 'incident_create',
      description:
        'Create a new ServiceNow incident. Returns the created incident with its incident number and sys_id. EXAMPLE: Create a high priority incident: {"short_description": "Database connection timeout", "description": "Users unable to access app", "priority": "High", "urgency": "High"}.',
      inputSchema: {
        type: 'object',
        properties: {
          short_description: {
            type: 'string',
            description: 'Brief description of the incident (required). Example: "Email server down" or "User cannot login"',
            minLength: 1,
          },
          description: {
            type: 'string',
            description: 'Detailed description of the incident with more context',
          },
          priority: {
            type: 'string',
            enum: ['1', '2', '3', '4', '5', 'Critical', 'High', 'Moderate', 'Low', 'Planning'],
            description:
              'Priority level. Use either: "Critical"/"1" (highest), "High"/"2", "Moderate"/"3", "Low"/"4", or "Planning"/"5"',
          },
          urgency: {
            type: 'string',
            enum: ['1', '2', '3', 'High', 'Medium', 'Low'],
            description: 'Urgency level. Use either: "High"/"1", "Medium"/"2", or "Low"/"3"',
          },
          impact: {
            type: 'string',
            enum: ['1', '2', '3', 'High', 'Medium', 'Low'],
            description: 'Impact level. Use either: "High"/"1" (affects many users), "Medium"/"2", or "Low"/"3" (affects few users)',
          },
          category: {
            type: 'string',
            description: 'Incident category (e.g., "Hardware", "Software", "Network")',
          },
          subcategory: {
            type: 'string',
            description: 'Incident subcategory for more specific classification',
          },
          assignment_group: {
            type: 'string',
            description: 'Assignment group name or sys_id to route the incident',
          },
          assigned_to: {
            type: 'string',
            description: 'Assigned user username or sys_id',
          },
          caller_id: {
            type: 'string',
            description: 'Caller/requester username or sys_id',
          },
          instance: {
            type: 'string',
            enum: ['primary', 'dev', 'test', 'prod'],
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['short_description'],
      },
    },
    {
      name: 'incident_update',
      description:
        'Update an existing incident by incident number or sys_id. Provide only the fields you want to change. EXAMPLES: Update state to in progress: {"identifier": "INC0010001", "state": "In Progress", "work_notes": "Working on this"}. Resolve incident: {"identifier": "INC0010001", "state": "Resolved", "close_notes": "Issue fixed"}.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description:
              'Incident number (e.g., "INC0010001") or sys_id (32-character hex) to update',
            minLength: 1,
          },
          state: {
            type: 'string',
            enum: ['1', '2', '3', '6', '7', '8', 'New', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Canceled'],
            description:
              'State: Use either "New"/"1", "In Progress"/"2", "On Hold"/"3", "Resolved"/"6", "Closed"/"7", or "Canceled"/"8"',
          },
          priority: {
            type: 'string',
            enum: ['1', '2', '3', '4', '5', 'Critical', 'High', 'Moderate', 'Low', 'Planning'],
            description:
              'Priority: Use either "Critical"/"1", "High"/"2", "Moderate"/"3", "Low"/"4", or "Planning"/"5"',
          },
          urgency: {
            type: 'string',
            enum: ['1', '2', '3', 'High', 'Medium', 'Low'],
            description: 'Urgency: Use either "High"/"1", "Medium"/"2", or "Low"/"3"',
          },
          impact: {
            type: 'string',
            enum: ['1', '2', '3', 'High', 'Medium', 'Low'],
            description: 'Impact: Use either "High"/"1", "Medium"/"2", or "Low"/"3"',
          },
          short_description: {
            type: 'string',
            description: 'Brief description of the incident',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the incident',
          },
          work_notes: {
            type: 'string',
            description: 'Work notes (internal comments visible only to IT staff)',
          },
          comments: {
            type: 'string',
            description: 'Customer-visible comments (visible to the caller)',
          },
          assignment_group: {
            type: 'string',
            description: 'Assignment group name or sys_id',
          },
          assigned_to: {
            type: 'string',
            description: 'Assigned user username or sys_id',
          },
          close_code: {
            type: 'string',
            description: 'Close code/resolution code (required when closing/resolving)',
          },
          close_notes: {
            type: 'string',
            description: 'Close notes/resolution notes (required when closing/resolving)',
          },
          category: {
            type: 'string',
            description: 'Incident category',
          },
          subcategory: {
            type: 'string',
            description: 'Incident subcategory',
          },
          instance: {
            type: 'string',
            enum: ['primary', 'dev', 'test', 'prod'],
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['identifier'],
      },
    },
    {
      name: 'incident_delete',
      description:
        'Delete an incident by incident number or sys_id. Requires explicit confirmation. CAUTION: This is a destructive operation. EXAMPLE: Delete incident: {"identifier": "INC0010001", "confirm": true}.',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Incident number (e.g., "INC0010001") or sys_id (32-character hex)',
            minLength: 1,
          },
          confirm: {
            type: 'boolean',
            description: 'REQUIRED: Must be set to true to confirm deletion. This prevents accidental deletions.',
          },
          instance: {
            type: 'string',
            enum: ['primary', 'dev', 'test', 'prod'],
            description: 'ServiceNow instance to use (if multiple configured)',
          },
        },
        required: ['identifier', 'confirm'],
      },
    },
  ];
}
