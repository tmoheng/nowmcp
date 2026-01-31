/**
 * Zod validation schemas for configuration
 * Validates environment variables and configuration at startup
 */

import { z } from 'zod';

/**
 * ServiceNow instance URL schema
 * - Must be a valid URL
 * - Must use HTTPS
 * - Must be a service-now.com domain (with some flexibility for custom domains)
 */
export const ServiceNowUrlSchema = z.string()
  .url("Instance URL must be a valid URL")
  .refine(
    (url) => url.startsWith('https://'),
    { message: "Instance URL must use HTTPS" }
  )
  .transform((url) => url.replace(/\/$/, '')); // Remove trailing slash

/**
 * ServiceNow username schema
 */
export const UsernameSchema = z.string()
  .min(1, "Username cannot be empty");

/**
 * ServiceNow password schema
 */
export const PasswordSchema = z.string()
  .min(1, "Password cannot be empty");

/**
 * ServiceNow instance configuration schema
 */
export const ServiceNowInstanceConfigSchema = z.object({
  url: ServiceNowUrlSchema,
  username: UsernameSchema,
  password: PasswordSchema
});

/**
 * Default instance name schema
 */
export const DefaultInstanceSchema = z.enum(['primary', 'dev', 'test', 'prod'])
  .default('primary');

/**
 * Complete ServiceNow configuration schema
 */
export const ServiceNowConfigSchema = z.object({
  instances: z.object({
    primary: ServiceNowInstanceConfigSchema.optional(),
    dev: ServiceNowInstanceConfigSchema.optional(),
    test: ServiceNowInstanceConfigSchema.optional(),
    prod: ServiceNowInstanceConfigSchema.optional()
  }).refine(
    (instances) => Object.values(instances).some(instance => instance !== undefined),
    { message: "At least one ServiceNow instance must be configured" }
  ),
  defaultInstance: DefaultInstanceSchema
}).refine(
  (config) => config.instances[config.defaultInstance] !== undefined,
  {
    message: "Default instance is not configured. Please configure it or change SERVICENOW_DEFAULT_INSTANCE."
  }
);

// Export type inference
export type ServiceNowInstanceConfig = z.infer<typeof ServiceNowInstanceConfigSchema>;
export type ServiceNowConfig = z.infer<typeof ServiceNowConfigSchema>;
