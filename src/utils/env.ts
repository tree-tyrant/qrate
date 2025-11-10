/**
 * Environment Variable Validation Utility
 * Provides runtime validation for required environment variables
 */

import { log } from './logger';

interface EnvConfig {
  VITE_API_BASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  SPOTIFY_GUEST_REDIRECT_URI?: string;
  SPOTIFY_DJ_REDIRECT_URI?: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Get environment variable value
 */
function getEnv(key: string): string | undefined {
  return import.meta.env[key];
}

/**
 * Validate required environment variables
 */
export function validateEnv(required: string[] = [], optional: string[] = []): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of required) {
    const value = getEnv(key);
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  // Check optional variables and warn if missing
  for (const key of optional) {
    const value = getEnv(key);
    if (!value || value.trim() === '') {
      warnings.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate environment configuration for different environments
 */
export function validateEnvironmentConfig(): ValidationResult {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  // Required for all environments
  const required: string[] = [];

  // Optional but recommended
  const optional: string[] = [
    'VITE_API_BASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_URL',
  ];

  // Production-specific requirements
  if (isProduction) {
    required.push(
      'VITE_API_BASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    );
    optional.push(
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'SPOTIFY_GUEST_REDIRECT_URI',
      'SPOTIFY_DJ_REDIRECT_URI'
    );
  }

  const result = validateEnv(required, optional);

  if (!result.valid) {
    log.error(
      'Missing required environment variables',
      { missing: result.missing, environment: isProduction ? 'production' : 'development' },
      'EnvValidation'
    );
  }

  if (result.warnings.length > 0) {
    log.warn(
      'Missing optional environment variables',
      { warnings: result.warnings },
      'EnvValidation'
    );
  }

  return result;
}

/**
 * Get environment configuration with defaults
 */
export function getEnvConfig(): EnvConfig {
  return {
    VITE_API_BASE_URL: getEnv('VITE_API_BASE_URL'),
    VITE_SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY'),
    VITE_SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
    SPOTIFY_CLIENT_ID: getEnv('SPOTIFY_CLIENT_ID'),
    SPOTIFY_CLIENT_SECRET: getEnv('SPOTIFY_CLIENT_SECRET'),
    SPOTIFY_GUEST_REDIRECT_URI: getEnv('SPOTIFY_GUEST_REDIRECT_URI'),
    SPOTIFY_DJ_REDIRECT_URI: getEnv('SPOTIFY_DJ_REDIRECT_URI'),
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD || import.meta.env.MODE === 'production';
}

/**
 * Get API base URL with fallback
 */
export function getApiBaseUrl(): string {
  return getEnv('VITE_API_BASE_URL') || '/make-server-6d46752d';
}

/**
 * Get Supabase anonymous key
 */
export function getSupabaseAnonKey(): string {
  return getEnv('VITE_SUPABASE_ANON_KEY') || '';
}

/**
 * Validate and log environment on app startup
 */
export function validateOnStartup(): boolean {
  const result = validateEnvironmentConfig();
  
  if (!result.valid) {
    console.error('❌ Environment validation failed. Missing required variables:', result.missing);
    console.error('Please check your .env file or environment configuration.');
    return false;
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings. Missing optional variables:', result.warnings);
  }

  if (result.valid && result.warnings.length === 0) {
    log.info('Environment validation passed', undefined, 'EnvValidation');
  }

  return true;
}

export default {
  validateEnv,
  validateEnvironmentConfig,
  validateOnStartup,
  getEnvConfig,
  isDevelopment,
  isProduction,
  getApiBaseUrl,
  getSupabaseAnonKey,
};


