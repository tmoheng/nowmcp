/**
 * Configuration management for ServiceNow MCP Server
 */

import dotenv from 'dotenv';
import { ZodError } from 'zod';
import {
  ServiceNowConfig,
  ServiceNowInstanceConfig,
  InstanceName,
} from '../types/config.js';
import {
  ServiceNowInstanceConfigSchema,
  ServiceNowConfigSchema,
  DefaultInstanceSchema,
} from '../schemas/config-schemas.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Load instance configuration from environment variables with validation
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

  try {
    // Validate the instance configuration
    return ServiceNowInstanceConfigSchema.parse({
      url,
      username,
      password,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Invalid configuration for ${prefix}: ${errors}`);
    }
    throw error;
  }
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

  // Determine default instance with validation
  const defaultInstanceEnv = process.env.SERVICENOW_DEFAULT_INSTANCE;
  let defaultInstance: InstanceName;

  try {
    defaultInstance = DefaultInstanceSchema.parse(defaultInstanceEnv);
  } catch {
    defaultInstance = 'primary';
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

  // Validate the complete configuration using Zod
  try {
    return ServiceNowConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(err => err.message).join('. ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    throw error;
  }
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
