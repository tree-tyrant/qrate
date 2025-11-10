/**
 * Centralized logging utility for QRATE
 * Provides structured logging with levels, error tracking, and production-safe behavior
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    // In production, only show warnings and errors
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(message: string, context?: string): string {
    return context ? `[${context}] ${message}` : message;
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('debug')) return;

    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    this.addLog(entry);

    if (this.isDevelopment) {
      console.debug(this.formatMessage(message, context), data || '');
    }
  }

  /**
   * Log an info message
   */
  info(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('info')) return;

    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    this.addLog(entry);

    if (this.isDevelopment || this.logLevel === 'info') {
      console.log(this.formatMessage(message, context), data || '');
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('warn')) return;

    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    this.addLog(entry);
    console.warn(this.formatMessage(message, context), data || '');
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: string): void {
    if (!this.shouldLog('error')) return;

    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error instanceof Error ? error : undefined,
      data: error instanceof Error ? undefined : error,
    };

    this.addLog(entry);
    console.error(this.formatMessage(message, context), error || '');

    // In production, you might want to send errors to an error tracking service
    if (!this.isDevelopment && error instanceof Error) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { context, message });
    }
  }

  /**
   * Log API calls (with special formatting)
   */
  apiCall(method: string, endpoint: string, context?: string): void {
    this.info(`API Call: ${method} ${endpoint}`, undefined, context || 'API');
  }

  /**
   * Log API success
   */
  apiSuccess(method: string, endpoint: string, context?: string): void {
    this.info(`API Success: ${method} ${endpoint}`, undefined, context || 'API');
  }

  /**
   * Log API errors
   */
  apiError(method: string, endpoint: string, error: unknown, context?: string): void {
    this.error(`API Error: ${method} ${endpoint}`, error, context || 'API');
  }

  /**
   * Log backend availability status
   */
  backendStatus(available: boolean, reason?: string): void {
    const message = available
      ? 'Backend is available - using server API'
      : `Backend not available - using localStorage-only mode${reason ? `: ${reason}` : ''}`;
    
    if (available) {
      this.info(message, undefined, 'Backend');
    } else {
      this.warn(message, undefined, 'Backend');
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: unknown, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: unknown, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: Error | unknown, context?: string) => logger.error(message, error, context),
  apiCall: (method: string, endpoint: string, context?: string) => logger.apiCall(method, endpoint, context),
  apiSuccess: (method: string, endpoint: string, context?: string) => logger.apiSuccess(method, endpoint, context),
  apiError: (method: string, endpoint: string, error: unknown, context?: string) => logger.apiError(method, endpoint, error, context),
  backendStatus: (available: boolean, reason?: string) => logger.backendStatus(available, reason),
};

export default logger;


