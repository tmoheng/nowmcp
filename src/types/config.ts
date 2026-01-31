/**
 * Configuration types for ServiceNow MCP Server
 */

export interface ServiceNowInstanceConfig {
  url: string;
  username: string;
  password: string;
}

export interface ServiceNowConfig {
  instances: {
    primary?: ServiceNowInstanceConfig;
    dev?: ServiceNowInstanceConfig;
    test?: ServiceNowInstanceConfig;
    prod?: ServiceNowInstanceConfig;
  };
  defaultInstance: 'primary' | 'dev' | 'test' | 'prod';
}

export type InstanceName = 'primary' | 'dev' | 'test' | 'prod';
