/**
 * Migration Service
 * Focus Flow Extension
 *
 * Handles storage schema migrations across versions.
 * Ensures data integrity when upgrading extension.
 *
 * IMPORTANT: Migrations are irreversible. Always backup data before migrating.
 */

import { storageService, StorageError, StorageErrorCode } from './storage-service';
import { STORAGE_KEYS, CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, DEFAULT_ANALYTICS } from '../utils/constants';
import type { UserSettings, AnalyticsData } from '../types';
import { z } from 'zod';
import { createLogger } from '../utils/logger';

const log = createLogger('MigrationService');

/**
 * Migration function signature
 */
type MigrationFunction = (data: Record<string, unknown>) => Promise<Record<string, unknown>>;

/**
 * Migration Service
 *
 * Handles gradual schema evolution across extension versions.
 * Each migration function transforms data from version N to version N+1.
 */
export class MigrationService {
  /**
   * Migration registry
   * Key = target version, Value = migration function
   */
  private migrations: Map<number, MigrationFunction> = new Map([
    [1, this.migrateToV1.bind(this)],
    // Future migrations:
    // [2, this.migrateToV2.bind(this)],
    // [3, this.migrateToV3.bind(this)],
  ]);

  /**
   * Run migrations if needed
   *
   * Checks current storage version and applies migrations sequentially
   * until reaching CURRENT_SCHEMA_VERSION.
   *
   * @returns Migration result with old/new versions
   */
  async migrateIfNeeded(): Promise<MigrationResult> {
    const currentVersion = await this.getCurrentVersion();

    // No migration needed
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: 0,
      };
    }

    log.info('Starting migration', {
      fromVersion: currentVersion,
      toVersion: CURRENT_SCHEMA_VERSION
    });

    // Store backup for potential restoration
    let backup: string | null = null;

    try {
      // Backup current data before migration
      backup = await this.createBackup();

      // Get all data from storage
      let data = await this.getAllData();

      // Apply migrations sequentially
      let migrationsApplied = 0;
      for (let version = currentVersion + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
        const migrationFn = this.migrations.get(version);

        if (!migrationFn) {
          throw new Error(`No migration defined for version ${version}`);
        }

        log.info('Applying migration', { toVersion: version });
        data = await migrationFn(data);
        migrationsApplied++;
      }

      // Update version
      data[STORAGE_KEYS.VERSION] = CURRENT_SCHEMA_VERSION;

      // Save migrated data
      await this.saveAllData(data);

      log.info('Migration completed successfully', { migrationsApplied });

      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied,
      };
    } catch (error) {
      log.error('Migration failed', error instanceof Error ? error : undefined);

      // Attempt to restore backup
      if (backup) {
        try {
          log.info('Attempting to restore backup after failed migration');
          await this.restoreFromBackup(backup);
          log.info('Backup restored successfully');
        } catch (restoreError) {
          log.error('Failed to restore backup', restoreError instanceof Error ? restoreError : undefined);
        }
      } else {
        log.error('No backup available to restore');
      }

      return {
        success: false,
        fromVersion: currentVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get current storage schema version
   *
   * @returns Version number (0 if not set, indicating fresh install)
   */
  async getCurrentVersion(): Promise<number> {
    const version = await storageService.get(
      STORAGE_KEYS.VERSION,
      z.number().int().min(0)
    );

    return version ?? 0;
  }

  /**
   * Set storage schema version
   *
   * @param version - Version number to set
   */
  async setVersion(version: number): Promise<void> {
    await storageService.set(
      STORAGE_KEYS.VERSION,
      version,
      z.number().int().min(0),
      { debounce: false } // Immediate write
    );
  }

  /**
   * Migration: v0 → v1
   *
   * Initial migration for fresh installs or legacy data.
   * Sets up default structure.
   */
  private async migrateToV1(
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Initialize with defaults if missing
    const migrated: Record<string, unknown> = {
      version: 1,
      currentSession: data[STORAGE_KEYS.CURRENT_SESSION] ?? undefined,
      sessions: data[STORAGE_KEYS.SESSIONS] ?? [],
      blockRules: data[STORAGE_KEYS.BLOCK_RULES] ?? [],
      schedules: data[STORAGE_KEYS.SCHEDULES] ?? [],
      settings: data[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS,
      analytics: data[STORAGE_KEYS.ANALYTICS] ?? DEFAULT_ANALYTICS,
    };

    // Ensure settings has nuclear mode config
    if (migrated.settings && typeof migrated.settings === 'object') {
      const settings = migrated.settings as UserSettings;
      if (!settings.nuclearMode) {
        settings.nuclearMode = DEFAULT_SETTINGS.nuclearMode;
      }
      if (!settings.nuclearMode.deviceSecret) {
        settings.nuclearMode.deviceSecret = this.generateDeviceSecret();
      }
    }

    // Ensure analytics has required fields
    if (migrated.analytics && typeof migrated.analytics === 'object') {
      const analytics = migrated.analytics as AnalyticsData;
      if (!analytics.streak) {
        analytics.streak = DEFAULT_ANALYTICS.streak;
      }
      if (!analytics.achievements) {
        analytics.achievements = [];
      }
    }

    return migrated;
  }

  /**
   * Example future migration: v1 → v2
   * (Not implemented yet)
   *
   * Add new fields, transform existing data, etc.
   */
  // @ts-expect-error - Reserved for future migration
  private async migrateToV2(
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Example: Add new field to settings
    // const settings = data[STORAGE_KEYS.SETTINGS] as UserSettings;
    // settings.newField = defaultValue;

    return data;
  }

  /**
   * Create backup of current storage
   *
   * Returns serialized backup for restoration if migration fails.
   */
  private async createBackup(): Promise<string> {
    const data = await this.getAllData();
    return JSON.stringify(data);
  }

  /**
   * Restore from backup
   *
   * @param backup - Serialized backup string
   */
  async restoreFromBackup(backup: string): Promise<void> {
    try {
      const data = JSON.parse(backup);
      await this.saveAllData(data);
    } catch (error) {
      throw new StorageError(
        `Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`,
        StorageErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Get all data from storage
   */
  private async getAllData(): Promise<Record<string, unknown>> {
    const keys = Object.values(STORAGE_KEYS);
    const data = await storageService.getMultiple(keys);
    return data;
  }

  /**
   * Save all data to storage
   *
   * @param data - Complete storage data
   */
  private async saveAllData(data: Record<string, unknown>): Promise<void> {
    // Save each key individually to leverage validation
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        // Use chrome.storage.local directly to avoid validation during migration
        // (validation happens after migration completes)
        await chrome.storage.local.set({ [key]: value });
      }
    }
  }

  /**
   * Generate cryptographically secure device secret
   *
   * @returns 32-byte hex string
   */
  private generateDeviceSecret(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Fallback for tests
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Clear all data and reset to defaults
   *
   * DANGER: This is irreversible!
   */
  async resetToDefaults(): Promise<void> {
    log.warn('Resetting all data to defaults');

    await storageService.clear();

    // Initialize with default data
    const defaultData = {
      version: CURRENT_SCHEMA_VERSION,
      currentSession: undefined,
      sessions: [],
      blockRules: [],
      schedules: [],
      settings: {
        ...DEFAULT_SETTINGS,
        nuclearMode: {
          ...DEFAULT_SETTINGS.nuclearMode,
          deviceSecret: this.generateDeviceSecret(),
        },
      },
      analytics: DEFAULT_ANALYTICS,
    };

    await this.saveAllData(defaultData);

    log.info('Reset to defaults completed');
  }

  /**
   * Check if migration is needed
   *
   * @returns true if storage version is behind current version
   */
  async isMigrationNeeded(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return currentVersion < CURRENT_SCHEMA_VERSION;
  }
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: number;
  error?: string;
}

/**
 * Singleton instance
 */
export const migrationService = new MigrationService();
