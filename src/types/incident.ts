/**
 * Incident table type definitions
 */

import { ServiceNowRecord } from './servicenow.js';

/**
 * ServiceNow Incident record
 * Based on the incident table schema
 */
export interface Incident extends ServiceNowRecord {
  number: string;
  short_description: string;
  description?: string;
  state: string; // 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed, etc.
  priority: string; // 1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning
  urgency: string; // 1=High, 2=Medium, 3=Low
  impact: string; // 1=High, 2=Medium, 3=Low
  category?: string;
  subcategory?: string;
  assignment_group?: string;
  assigned_to?: string;
  caller_id?: string;
  opened_at?: string;
  closed_at?: string;
  resolved_at?: string;
  work_notes?: string;
  comments?: string;
  close_code?: string;
  close_notes?: string;
}

/**
 * Incident state values
 */
export const IncidentState = {
  NEW: '1',
  IN_PROGRESS: '2',
  ON_HOLD: '3',
  RESOLVED: '6',
  CLOSED: '7',
  CANCELED: '8',
} as const;

/**
 * Incident priority values
 */
export const IncidentPriority = {
  CRITICAL: '1',
  HIGH: '2',
  MODERATE: '3',
  LOW: '4',
  PLANNING: '5',
} as const;

/**
 * Incident urgency/impact values
 */
export const IncidentUrgency = {
  HIGH: '1',
  MEDIUM: '2',
  LOW: '3',
} as const;
