/**
 * ServiceNow API types
 */

/**
 * Generic ServiceNow record
 */
export interface ServiceNowRecord {
  sys_id: string;
  sys_created_on: string;
  sys_updated_on: string;
  sys_created_by: string;
  sys_updated_by: string;
  [key: string]: any;
}

/**
 * ServiceNow API response for GET requests
 */
export interface ServiceNowGetResponse<T = ServiceNowRecord> {
  result: T[];
}

/**
 * ServiceNow API response for single record GET/POST/PUT
 */
export interface ServiceNowSingleResponse<T = ServiceNowRecord> {
  result: T;
}

/**
 * ServiceNow API error response
 */
export interface ServiceNowErrorResponse {
  error: {
    message: string;
    detail?: string;
  };
  status: string;
}

/**
 * Query operator types
 */
export type QueryOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'LIKE'
  | 'STARTSWITH'
  | 'ENDSWITH'
  | 'CONTAINS'
  | 'IN'
  | 'NOT IN';

/**
 * Query field value - can be simple or complex
 */
export type QueryValue =
  | string
  | number
  | boolean
  | {
      operator: QueryOperator;
      value: string | number | boolean;
    };

/**
 * Query filter object
 */
export interface QueryFilter {
  [field: string]: QueryValue;
}

/**
 * Table API query options
 */
export interface TableQueryOptions {
  limit?: number;
  offset?: number;
  fields?: string[];
  displayValue?: boolean | 'true' | 'false' | 'all';
  excludeReferenceLink?: boolean;
}
