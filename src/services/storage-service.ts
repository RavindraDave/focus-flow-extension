/**
 * Storage Service
 * Focus Flow Extension
 *
 * Type-safe wrapper around chrome.storage.local with validation.
 * Implements OWASP ASVS Level 2 security controls.
 *
 * Security Features:
 * - Input validation with Zod schemas (ASVS V5.1.1)
 * - Output validation to prevent corrupted data (defense in depth)
 * - Prototype pollution prevention (ASVS V5.1.1)
 * - Storage quota management
 * - Debounced writes to prevent rate limiting
 * - Sanitized error messages (no sensitive data leakage)
 */

import type { ZodSchema } from 'zod';
import {
  STORAGE_LIMITS,
  RATE_LIMITS,
  SECURITY,
  ERROR_MESSAGES,
} from '../utils/constants';
import type { StorageQuota } from '../types';

/**
 * Storage operation error
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage error codes
 */
export enum StorageErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  KEY_INVALID = 'KEY_INVALID',
  NOT_FOUND = 'NOT_FOUND',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Debounced write queue entry
 */
interface DebouncedWrite {
  key: string;
  value: unknown;
  schema: ZodSchema;
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Storage Service
 *
 * Provides type-safe, validated access to chrome.storage.local.
 * All data is validated on both read and write operations.
 *
 * Usage:
 * ```typescript
 * const storage = new StorageService();
 *
 * // Write with validation
 * await storage.set('settings', userSettings, UserSettingsSchema);
 *
 * // Read with validation
 * const settings = await storage.get('settings', UserSettingsSchema);
 *
 * // Remove
 * await storage.remove('settings');
 * ```
 */
export class StorageService {
  private writeQueue: Map<string, DebouncedWrite> = new Map();
  private writeTimers: Map<string, NodeJS.Timeout> = new Map();
  private writeCount: number = 0;
  private writeCountResetTime: number = Date.now();

  /**
   * Get a value from storage with validation
   *
   * @param key - Storage key
   * @param schema - Zod schema for validation
   * @returns Validated data or null if not found
   * @throws {StorageError} If validation fails or key is invalid
   */
  async get<T>(key: string, schema: ZodSchema<T>): Promise<T | null> {
    // Validate key (prevent prototype pollution)
    this.validateKey(key);

    try {
      // Get from chrome.storage.local
      const result = await chrome.storage.local.get(key);

      // Not found
      if (!(key in result)) {
        return null;
      }

      const data = result[key];

      // Null/undefined is valid (missing data)
      if (data === null || data === undefined) {
        return null;
      }

      // Validate with schema (defense against corrupted data)
      const parseResult = schema.safeParse(data);

      if (!parseResult.success) {
        // Log validation error (sanitized)
        console.error(`Storage validation failed for key "${key}":`,
          parseResult.error.errors.map(e => e.message).join(', ')
        );

        throw new StorageError(
          `Corrupted data in storage for key "${key}". Validation failed.`,
          StorageErrorCode.CORRUPTED_DATA
        );
      }

      return parseResult.data;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        `Failed to read from storage: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set a value in storage with validation
   *
   * @param key - Storage key
   * @param value - Value to store
   * @param schema - Zod schema for validation
   * @param options - Write options
   * @throws {StorageError} If validation fails, quota exceeded, or rate limited
   */
  async set<T>(
    key: string,
    value: T,
    schema: ZodSchema<T>,
    options: { debounce?: boolean } = { debounce: true }
  ): Promise<void> {
    // Validate key
    this.validateKey(key);

    // Validate value with schema (ASVS V5.1.1 - input validation)
    // IMPORTANT: Use safeParse to validate, but store original value (not transformed)
    // This prevents DateSchema transforms from converting strings to Date objects
    const parseResult = schema.safeParse(value);

    if (!parseResult.success) {
      throw new StorageError(
        `Validation failed: ${parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        StorageErrorCode.VALIDATION_FAILED
      );
    }

    // Store the ORIGINAL value, not the transformed one
    // DateSchema transforms strings to Date objects, but storage needs strings
    const valueToStore = value;

    // Debounce writes to prevent rate limiting
    if (options.debounce) {
      return this.debouncedWrite(key, valueToStore, schema);
    }

    // Immediate write
    return this.writeToStorage(key, valueToStore);
  }

  /**
   * Remove a value from storage
   *
   * @param key - Storage key to remove
   * @throws {StorageError} If key is invalid
   */
  async remove(key: string): Promise<void> {
    this.validateKey(key);

    try {
      // Cancel any pending debounced writes for this key
      this.cancelDebouncedWrite(key);

      await chrome.storage.local.remove(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove from storage: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear all data from storage
   * USE WITH CAUTION
   */
  async clear(): Promise<void> {
    try {
      // Cancel all pending writes
      this.writeTimers.forEach((timer) => clearTimeout(timer));
      this.writeTimers.clear();
      this.writeQueue.clear();

      await chrome.storage.local.clear();
    } catch (error) {
      throw new StorageError(
        `Failed to clear storage: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get storage quota information
   *
   * @returns Storage quota details
   */
  async getQuota(): Promise<StorageQuota> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();

      // chrome.storage.local is technically unlimited, but we set a target
      const targetMax = STORAGE_LIMITS.TARGET_MAX_BYTES;

      return {
        bytesUsed: bytesInUse,
        bytesAvailable: Math.max(0, targetMax - bytesInUse),
        percentageUsed: Math.min(100, (bytesInUse / targetMax) * 100),
      };
    } catch (error) {
      throw new StorageError(
        `Failed to get storage quota: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if storage quota is approaching limit
   *
   * @returns true if >80% of target quota is used
   */
  async isQuotaNearLimit(): Promise<boolean> {
    const quota = await this.getQuota();
    return quota.percentageUsed > 80;
  }

  /**
   * Get multiple keys from storage
   *
   * @param keys - Array of storage keys
   * @returns Object with key-value pairs
   */
  async getMultiple(keys: string[]): Promise<Record<string, unknown>> {
    // Validate all keys
    keys.forEach((key) => this.validateKey(key));

    try {
      const result = await chrome.storage.local.get(keys);
      return result;
    } catch (error) {
      throw new StorageError(
        `Failed to read multiple keys: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate storage key
   * Prevents prototype pollution (ASVS V5.1.1)
   *
   * @param key - Key to validate
   * @throws {StorageError} If key is invalid
   */
  private validateKey(key: string): void {
    // Check for dangerous keys
    if (SECURITY.DANGEROUS_KEYS.includes(key as typeof SECURITY.DANGEROUS_KEYS[number])) {
      throw new StorageError(
        ERROR_MESSAGES.PROTOTYPE_POLLUTION,
        StorageErrorCode.KEY_INVALID
      );
    }

    // Check key length
    if (key.length === 0 || key.length > 100) {
      throw new StorageError(
        'Invalid storage key length (must be 1-100 characters)',
        StorageErrorCode.KEY_INVALID
      );
    }
  }

  /**
   * Debounced write to storage
   *
   * Groups rapid writes to the same key to prevent rate limiting
   */
  private debouncedWrite<T>(
    key: string,
    value: T,
    schema: ZodSchema<T>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel existing debounced write for this key
      const existingTimer = this.writeTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Create new debounced write entry
      const write: DebouncedWrite = {
        key,
        value,
        schema,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.writeQueue.set(key, write);

      // Schedule write
      const timer = setTimeout(() => {
        this.flushDebouncedWrite(key);
      }, RATE_LIMITS.STORAGE_WRITE_DEBOUNCE_MS);

      this.writeTimers.set(key, timer);
    });
  }

  /**
   * Flush a debounced write to storage
   */
  private async flushDebouncedWrite(key: string): Promise<void> {
    const write = this.writeQueue.get(key);
    if (!write) {return;}

    this.writeQueue.delete(key);
    this.writeTimers.delete(key);

    try {
      await this.writeToStorage(key, write.value);
      write.resolve();
    } catch (error) {
      write.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Cancel a debounced write
   */
  private cancelDebouncedWrite(key: string): void {
    const timer = this.writeTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.writeTimers.delete(key);
    }

    const write = this.writeQueue.get(key);
    if (write) {
      this.writeQueue.delete(key);
      write.reject(new Error('Write cancelled'));
    }
  }

  /**
   * Write to chrome.storage.local with rate limiting
   */
  private async writeToStorage(key: string, value: unknown): Promise<void> {
    // Check rate limit
    this.checkRateLimit();

    try {
      // Check quota before writing
      const quota = await this.getQuota();
      if (quota.percentageUsed > 95) {
        throw new StorageError(
          ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED,
          StorageErrorCode.QUOTA_EXCEEDED
        );
      }

      // Write to storage
      await chrome.storage.local.set({ [key]: value });

      // Increment write counter
      this.incrementWriteCount();
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      // Check for quota exceeded error from Chrome
      if (error instanceof Error && error.message.includes('QUOTA')) {
        throw new StorageError(
          ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED,
          StorageErrorCode.QUOTA_EXCEEDED,
          error
        );
      }

      throw new StorageError(
        `Failed to write to storage: ${this.sanitizeErrorMessage(error)}`,
        StorageErrorCode.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if rate limit is exceeded
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const timeSinceReset = now - this.writeCountResetTime;

    // Reset counter after 1 minute
    if (timeSinceReset > 60_000) {
      this.writeCount = 0;
      this.writeCountResetTime = now;
      return;
    }

    // Check if limit exceeded
    if (this.writeCount >= RATE_LIMITS.STORAGE_WRITES_PER_MINUTE) {
      throw new StorageError(
        'Storage write rate limit exceeded. Please slow down.',
        StorageErrorCode.RATE_LIMIT_EXCEEDED
      );
    }
  }

  /**
   * Increment write counter for rate limiting
   */
  private incrementWriteCount(): void {
    this.writeCount++;
  }

  /**
   * Sanitize error message to prevent sensitive data leakage
   * ASVS V8.3.4 - Prevent sensitive data in error messages
   */
  private sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Remove stack traces in production
      if (process.env.NODE_ENV === 'production') {
        return error.message;
      }
      return `${error.message}`;
    }
    return 'Unknown error occurred';
  }

  /**
   * Flush all pending debounced writes
   * Call this before critical operations or on extension unload
   */
  async flush(): Promise<void> {
    const promises = Array.from(this.writeQueue.keys()).map((key) =>
      this.flushDebouncedWrite(key)
    );
    await Promise.all(promises);
  }
}

/**
 * Singleton instance for app-wide use
 */
export const storageService = new StorageService();
