import dotenv from 'dotenv';
import { z } from 'zod';
import { EnvironmentConfigSchema, EnvironmentConfig, ValidationError } from '../types';

// Load environment variables
dotenv.config();

// Default values for configuration
const DEFAULT_CONFIG = {
  nodeEnv: 'development' as const,
  appName: 'shuffle-airdrop-scam-analysis',
  appVersion: '1.2.0',
  logLevel: 'info' as const,
  enableSecurityWarnings: true,
  requireExplicitConsent: true,
  analysisOutputDir: './analysis-output',
  testTimeout: 30000,
  coverageThreshold: 80,
};

/**
 * Parse and validate environment configuration
 */
export function parseEnvironmentConfig(): EnvironmentConfig {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV || DEFAULT_CONFIG.nodeEnv,
    appName: process.env.APP_NAME || DEFAULT_CONFIG.appName,
    appVersion: process.env.APP_VERSION || DEFAULT_CONFIG.appVersion,
    logLevel: process.env.LOG_LEVEL || DEFAULT_CONFIG.logLevel,
    enableSecurityWarnings: process.env.ENABLE_SECURITY_WARNINGS === 'true' || DEFAULT_CONFIG.enableSecurityWarnings,
    requireExplicitConsent: process.env.REQUIRE_EXPLICIT_CONSENT === 'true' || DEFAULT_CONFIG.requireExplicitConsent,
    analysisOutputDir: process.env.ANALYSIS_OUTPUT_DIR || DEFAULT_CONFIG.analysisOutputDir,
    testTimeout: parseInt(process.env.TEST_TIMEOUT || String(DEFAULT_CONFIG.testTimeout), 10),
    coverageThreshold: parseInt(process.env.COVERAGE_THRESHOLD || String(DEFAULT_CONFIG.coverageThreshold), 10),
  };

  try {
    return EnvironmentConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(
        `Environment configuration validation failed: ${validationErrors.join(', ')}`,
        'environment',
        rawConfig
      );
    }
    throw error;
  }
}

/**
 * Get the validated environment configuration
 */
export const config: EnvironmentConfig = parseEnvironmentConfig();

/**
 * Utility function to check if we're in development mode
 */
export const isDevelopment = (): boolean => config.nodeEnv === 'development';

/**
 * Utility function to check if we're in production mode
 */
export const isProduction = (): boolean => config.nodeEnv === 'production';

/**
 * Utility function to check if we're in test mode
 */
export const isTest = (): boolean => config.nodeEnv === 'test';

/**
 * Get log level for configuration
 */
export const getLogLevel = (): string => config.logLevel;

/**
 * Check if security warnings are enabled
 */
export const areSecurityWarningsEnabled = (): boolean => config.enableSecurityWarnings;

/**
 * Check if explicit consent is required
 */
export const isExplicitConsentRequired = (): boolean => config.requireExplicitConsent;
