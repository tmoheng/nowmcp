/**
 * Configuration management for ServiceNow MCP Server
 */

import dotenv from 'dotenv';
import {
  ServiceNowConfig,
  ServiceNowInstanceConfig,
  InstanceName,
} from '../types/config.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Load instance configuration from environment variables
 */
function loadInstanceConfig(
  prefix: string
): ServiceNowInstanceConfig | undefined {
  const url = process.env[`${prefix}_URL`];
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!url || !username || !password) {
    return undefined;
  }

  return {
    url: url.replace(/\/$/, ''), // Remove trailing slash
    username,
    password,
  };
}

/**
 * Load all ServiceNow configuration
 */
export function loadConfig(): ServiceNowConfig {
  // Load primary instance (default)
  const primary = loadInstanceConfig('SERVICENOW_INSTANCE');

  // Load named instances
  const dev = loadInstanceConfig('SERVICENOW_DEV');
  const test = loadInstanceConfig('SERVICENOW_TEST');
  const prod = loadInstanceConfig('SERVICENOW_PROD');

  // Determine default instance
  const defaultInstanceEnv = process.env.SERVICENOW_DEFAULT_INSTANCE;
  let defaultInstance: InstanceName = 'primary';

  if (
    defaultInstanceEnv &&
    ['primary', 'dev', 'test', 'prod'].includes(defaultInstanceEnv)
  ) {
    defaultInstance = defaultInstanceEnv as InstanceName;
  }

  const config: ServiceNowConfig = {
    instances: {
      primary,
      dev,
      test,
      prod,
    },
    defaultInstance,
  };

  // Validate that at least one instance is configured
  const hasAnyInstance = Object.values(config.instances).some(
    (instance) => instance !== undefined
  );

  if (!hasAnyInstance) {
    throw new Error(
      'No ServiceNow instance configured. Please set SERVICENOW_INSTANCE_URL, SERVICENOW_USERNAME, and SERVICENOW_PASSWORD environment variables.'
    );
  }

  // Validate that default instance exists
  if (!config.instances[defaultInstance]) {
    throw new Error(
      `Default instance "${defaultInstance}" is not configured. Please configure it or change SERVICENOW_DEFAULT_INSTANCE.`
    );
  }

  return config;
}

/**
 * Get a specific instance configuration
 */
export function getInstanceConfig(
  config: ServiceNowConfig,
  instanceName?: InstanceName
): ServiceNowInstanceConfig {
  const name = instanceName || config.defaultInstance;
  const instance = config.instances[name];

  if (!instance) {
    throw new Error(
      `ServiceNow instance "${name}" is not configured. Available instances: ${Object.keys(config.instances).filter((k) => config.instances[k as InstanceName]).join(', ')}`
    );
  }

  return instance;
}
