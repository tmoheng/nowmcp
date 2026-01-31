/**
 * Zod validation schemas for incident tools
 * These schemas validate tool inputs and provide better error messages for AI models
 */

import { z } from 'zod';

/**
 * Incident state enum - accepts both numeric and human-readable values
 */
export const IncidentStateEnum = z.enum([
  '1', '2', '3', '6', '7', '8',  // Numeric values
  'New', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Canceled'  // Human-readable
]).transform((val) => {
  // Convert human-readable to numeric
  const stateMap: Record<string, string> = {
    'New': '1',
    'In Progress': '2',
    'On Hold': '3',
    'Resolved': '6',
    'Closed': '7',
    'Canceled': '8'
  };
  return stateMap[val] || val;
});

/**
 * Incident priority enum
 */
export const IncidentPriorityEnum = z.enum([
  '1', '2', '3', '4', '5',  // Numeric values
  'Critical', 'High', 'Moderate', 'Low', 'Planning'  // Human-readable
]).transform((val) => {
  const priorityMap: Record<string, string> = {
    'Critical': '1',
    'High': '2',
    'Moderate': '3',
    'Low': '4',
    'Planning': '5'
  };
  return priorityMap[val] || val;
});

/**
 * Incident urgency/impact enum
 */
export const IncidentUrgencyEnum = z.enum([
  '1', '2', '3',  // Numeric values
  'High', 'Medium', 'Low'  // Human-readable
]).transform((val) => {
  const urgencyMap: Record<string, string> = {
    'High': '1',
    'Medium': '2',
    'Low': '3'
  };
  return urgencyMap[val] || val;
});

/**
 * Query operator schema
 */
export const QueryOperatorSchema = z.object({
  operator: z.enum([
    '=', '!=', '>', '>=', '<', '<=',
    'LIKE', 'STARTSWITH', 'ENDSWITH', 'CONTAINS',
    'IN', 'NOT IN', 'ISEMPTY', 'ISNOTEMPTY'
  ]),
  value: z.union([z.string(), z.number(), z.boolean()])
});

/**
 * Query filter value - can be simple or complex
 */
export const QueryValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  QueryOperatorSchema
]);

/**
 * Query filter schema - validates filter objects
 */
export const QueryFilterSchema = z.record(z.string(), QueryValueSchema).optional();

/**
 * Instance name schema
 */
export const InstanceNameSchema = z.enum(['primary', 'dev', 'test', 'prod']).optional();

/**
 * incident_query tool input schema
 */
export const IncidentQuerySchema = z.object({
  filter: QueryFilterSchema,
  limit: z.number().int().min(1).max(1000).default(100),
  fields: z.array(z.string()).optional(),
  instance: InstanceNameSchema
});

/**
 * incident_get tool input schema
 */
export const IncidentGetSchema = z.object({
  identifier: z.string().min(1, "Identifier cannot be empty"),
  fields: z.array(z.string()).optional(),
  instance: InstanceNameSchema
});

/**
 * incident_create tool input schema
 */
export const IncidentCreateSchema = z.object({
  short_description: z.string().min(1, "Short description is required and cannot be empty"),
  description: z.string().optional(),
  priority: IncidentPriorityEnum.optional(),
  urgency: IncidentUrgencyEnum.optional(),
  impact: IncidentUrgencyEnum.optional(),  // Uses same enum as urgency
  category: z.string().optional(),
  subcategory: z.string().optional(),
  assignment_group: z.string().optional(),
  assigned_to: z.string().optional(),
  caller_id: z.string().optional(),
  instance: InstanceNameSchema
}).passthrough();  // Allow additional fields

/**
 * incident_update tool input schema
 */
export const IncidentUpdateSchema = z.object({
  identifier: z.string().min(1, "Identifier cannot be empty"),
  state: IncidentStateEnum.optional(),
  priority: IncidentPriorityEnum.optional(),
  urgency: IncidentUrgencyEnum.optional(),
  impact: IncidentUrgencyEnum.optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  work_notes: z.string().optional(),
  comments: z.string().optional(),
  assignment_group: z.string().optional(),
  assigned_to: z.string().optional(),
  close_code: z.string().optional(),
  close_notes: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  instance: InstanceNameSchema
}).passthrough();  // Allow additional fields

/**
 * incident_delete tool input schema
 */
export const IncidentDeleteSchema = z.object({
  identifier: z.string().min(1, "Identifier cannot be empty"),
  confirm: z.boolean().refine(val => val === true, {
    message: "Deletion requires explicit confirmation. Set confirm to true."
  }),
  instance: InstanceNameSchema
});

// Export type inference helpers
export type IncidentQueryInput = z.infer<typeof IncidentQuerySchema>;
export type IncidentGetInput = z.infer<typeof IncidentGetSchema>;
export type IncidentCreateInput = z.infer<typeof IncidentCreateSchema>;
export type IncidentUpdateInput = z.infer<typeof IncidentUpdateSchema>;
export type IncidentDeleteInput = z.infer<typeof IncidentDeleteSchema>;
