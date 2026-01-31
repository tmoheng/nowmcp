/**
 * ServiceNow API Client
 * Handles authentication and REST API calls to ServiceNow Table API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { ServiceNowInstanceConfig } from '../types/config.js';
import {
  ServiceNowRecord,
  ServiceNowGetResponse,
  ServiceNowSingleResponse,
  ServiceNowErrorResponse,
  QueryFilter,
  TableQueryOptions,
  QueryValue,
} from '../types/servicenow.js';

export class ServiceNowClient {
  private axiosInstance: AxiosInstance;
  private instanceUrl: string;

  constructor(config: ServiceNowInstanceConfig) {
    this.instanceUrl = config.url;

    // Create axios instance with Basic Auth
    this.axiosInstance = axios.create({
      baseURL: `${config.url}/api/now`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Build ServiceNow encoded query string from filter object
   */
  private buildEncodedQuery(filter: QueryFilter): string {
    const queryParts: string[] = [];

    for (const [field, value] of Object.entries(filter)) {
      if (typeof value === 'object' && 'operator' in value) {
        // Complex query with operator
        const operator = value.operator;
        const val = value.value;
        queryParts.push(`${field}${operator}${val}`);
      } else {
        // Simple equality
        queryParts.push(`${field}=${value}`);
      }
    }

    return queryParts.join('^');
  }

  /**
   * Query a table
   */
  async queryTable<T extends ServiceNowRecord = ServiceNowRecord>(
    tableName: string,
    filter?: QueryFilter,
    options?: TableQueryOptions
  ): Promise<T[]> {
    try {
      const params: any = {};

      if (filter) {
        params.sysparm_query = this.buildEncodedQuery(filter);
      }

      if (options?.limit) {
        params.sysparm_limit = options.limit;
      }

      if (options?.offset) {
        params.sysparm_offset = options.offset;
      }

      if (options?.fields) {
        params.sysparm_fields = options.fields.join(',');
      }

      if (options?.displayValue !== undefined) {
        params.sysparm_display_value = options.displayValue;
      }

      if (options?.excludeReferenceLink) {
        params.sysparm_exclude_reference_link = true;
      }

      const response = await this.axiosInstance.get<ServiceNowGetResponse<T>>(
        `/table/${tableName}`,
        { params }
      );

      return response.data.result;
    } catch (error) {
      throw this.handleError(error, `queryTable(${tableName})`);
    }
  }

  /**
   * Get a single record by sys_id
   */
  async getRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    tableName: string,
    sysId: string,
    options?: TableQueryOptions
  ): Promise<T> {
    try {
      const params: any = {};

      if (options?.fields) {
        params.sysparm_fields = options.fields.join(',');
      }

      if (options?.displayValue !== undefined) {
        params.sysparm_display_value = options.displayValue;
      }

      if (options?.excludeReferenceLink) {
        params.sysparm_exclude_reference_link = true;
      }

      const response = await this.axiosInstance.get<
        ServiceNowSingleResponse<T>
      >(`/table/${tableName}/${sysId}`, { params });

      return response.data.result;
    } catch (error) {
      throw this.handleError(error, `getRecord(${tableName}, ${sysId})`);
    }
  }

  /**
   * Create a new record
   */
  async createRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    tableName: string,
    data: Partial<T>
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<
        ServiceNowSingleResponse<T>
      >(`/table/${tableName}`, data);

      return response.data.result;
    } catch (error) {
      throw this.handleError(error, `createRecord(${tableName})`);
    }
  }

  /**
   * Update an existing record (partial update)
   * Uses PATCH for updating only specified fields
   */
  async updateRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    tableName: string,
    sysId: string,
    data: Partial<T>
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<
        ServiceNowSingleResponse<T>
      >(`/table/${tableName}/${sysId}`, data);

      return response.data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `updateRecord(${tableName}, ${sysId})`
      );
    }
  }

  /**
   * Delete a record
   */
  async deleteRecord(tableName: string, sysId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/table/${tableName}/${sysId}`);
    } catch (error) {
      throw this.handleError(error, `deleteRecord(${tableName}, ${sysId})`);
    }
  }

  /**
   * Test connection to ServiceNow instance
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to query the incident table with a limit of 1
      await this.queryTable('incident', undefined, { limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ServiceNowErrorResponse>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        if (data && typeof data === 'object' && 'error' in data) {
          return new Error(
            `ServiceNow API Error (${context}): ${data.error.message}${data.error.detail ? ' - ' + data.error.detail : ''}`
          );
        }

        return new Error(
          `ServiceNow API Error (${context}): HTTP ${status} - ${axiosError.message}`
        );
      } else if (axiosError.request) {
        return new Error(
          `ServiceNow Connection Error (${context}): No response received from ${this.instanceUrl}`
        );
      }
    }

    if (error instanceof Error) {
      return new Error(`ServiceNow Client Error (${context}): ${error.message}`);
    }

    return new Error(`ServiceNow Unknown Error (${context}): ${String(error)}`);
  }
}
