/**
 * Centralized Logging System for Focus Flow Extension
 * Inspired by production-grade logging practices
 *
 * Features:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Contextual logging with component names
 * - Environment-aware (development vs production)
 * - Structured log format
 * - Optional persistence to storage
 * - Log UI for debugging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private persistLogs = false;

  private constructor() {
    // Set log level based on environment
    this.minLevel = process.env.NODE_ENV === 'development'
      ? LogLevel.DEBUG
      : LogLevel.WARN;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Enable/disable log persistence
   */
  setPersistence(enabled: boolean): void {
    this.persistLogs = enabled;
  }

  /**
   * Create a logger for a specific component
   */
  createComponentLogger(componentName: string): ComponentLogger {
    return new ComponentLogger(componentName, this);
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    component: string,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    // Filter by log level
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }

    // Persist to storage if enabled
    if (this.persistLogs) {
      void this.persistLog(entry);
    }
  }

  /**
   * Output log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.component}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data ?? '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data ?? '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data ?? '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data ?? '', entry.error ?? '');
        break;
    }
  }

  /**
   * Persist log to Chrome storage
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      if (!chrome?.storage?.local) {
        return;
      }

      const result = await chrome.storage.local.get('debug_logs');
      const logs = (result.debug_logs as LogEntry[]) ?? [];

      logs.push(entry);

      // Keep only last 500 logs in storage
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }

      await chrome.storage.local.set({ debug_logs: logs });
    } catch (error) {
      // Can't log this error or we'd create infinite loop
      console.error('Failed to persist log:', error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by component
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (this.persistLogs && chrome?.storage?.local) {
      void chrome.storage.local.remove('debug_logs');
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get persisted logs from storage
   */
  async getPersistedLogs(): Promise<LogEntry[]> {
    if (!chrome?.storage?.local) {
      return [];
    }

    try {
      const result = await chrome.storage.local.get('debug_logs');
      return (result.debug_logs as LogEntry[]) ?? [];
    } catch (error) {
      console.error('Failed to get persisted logs:', error);
      return [];
    }
  }
}

/**
 * Component-specific logger
 */
class ComponentLogger {
  constructor(
    private componentName: string,
    private logger: Logger
  ) {}

  debug(message: string, data?: unknown): void {
    this.logger.log(LogLevel.DEBUG, this.componentName, message, data);
  }

  info(message: string, data?: unknown): void {
    this.logger.log(LogLevel.INFO, this.componentName, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.logger.log(LogLevel.WARN, this.componentName, message, data);
  }

  error(message: string, error?: Error, data?: unknown): void {
    this.logger.log(LogLevel.ERROR, this.componentName, message, data, error);
  }

  /**
   * Log with timing information
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed in ${duration}ms`);
    };
  }

  /**
   * Log async operation with automatic error handling
   */
  async traced<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.debug(`Starting: ${operation}`);
    const endTime = this.time(operation);

    try {
      const result = await fn();
      endTime();
      return result;
    } catch (error) {
      this.error(`Failed: ${operation}`, error as Error);
      throw error;
    }
  }
}

// Export singleton instance and factory function
export const logger = Logger.getInstance();

/**
 * Create a component-specific logger
 *
 * @example
 * const log = createLogger('TimerEngine');
 * log.info('Timer started', { duration: 25 });
 * log.error('Timer failed', error);
 */
export function createLogger(componentName: string): ComponentLogger {
  return logger.createComponentLogger(componentName);
}

// Export for testing/debugging
export { Logger, ComponentLogger };
