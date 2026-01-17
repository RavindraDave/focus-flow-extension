/**
 * Settings Repository
 * Focus Flow Extension
 *
 * Repository pattern for UserSettings data access.
 * Handles default settings initialization and partial updates.
 */

import { storageService, StorageError } from './storage-service';
import {
  UserSettingsSchema,
  PartialUserSettingsSchema,
} from '../types/schemas';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
} from '../utils/constants';
import type { UserSettings } from '../types';
import type { z } from 'zod';
import nodeCrypto from 'crypto';

/**
 * Repository for managing user settings
 */
export class SettingsRepository {
  /**
   * Get user settings
   *
   * Returns default settings if none exist.
   *
   * @returns User settings
   */
  async getSettings(): Promise<UserSettings> {
    let settings = await storageService.get(
      STORAGE_KEYS.SETTINGS,
      UserSettingsSchema as unknown as z.ZodType<UserSettings>
    );

    // Initialize with defaults if not found
    if (!settings) {
      settings = await this.initializeDefaults();
    }

    // Ensure nuclear mode device secret exists
    if (!settings.nuclearMode.deviceSecret) {
      settings = await this.ensureDeviceSecret(settings);
    }

    return settings;
  }

  /**
   * Update user settings (partial update)
   *
   * Only updates provided fields, keeps others unchanged.
   *
   * @param updates - Partial settings object
   * @throws {StorageError} If nuclear mode is active and trying to modify protected settings
   */
  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();

    // Check if nuclear mode is active
    if (currentSettings.nuclearMode.active) {
      // Cannot modify certain settings during nuclear mode to prevent circumvention
      const protectedKeys: Array<keyof UserSettings> = [
        'nuclearMode',          // Core protection - cannot deactivate early
        'autoStartNextSession', // Prevents skipping enforced work/break cycles
        'youtubeControls',      // Prevents changing blocking behavior
      ];

      const isModifyingProtected = protectedKeys.some(
        (key) => key in updates
      );

      if (isModifyingProtected) {
        throw new StorageError(
          'Cannot modify protected settings while nuclear mode is active. Settings locked: nuclearMode, autoStartNextSession, youtubeControls',
          'VALIDATION_FAILED' as any
        );
      }
    }

    // Merge updates with current settings
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...updates,
      // Deep merge for nested objects
      youtubeControls: {
        ...currentSettings.youtubeControls,
        ...(updates.youtubeControls ?? {}),
      },
      nuclearMode: {
        ...currentSettings.nuclearMode,
        ...(updates.nuclearMode ?? {}),
      },
    };

    // Validate merged settings
    await storageService.set(
      STORAGE_KEYS.SETTINGS,
      updatedSettings,
      UserSettingsSchema as unknown as z.ZodType<UserSettings>
    );
  }

  /**
   * Reset settings to defaults
   *
   * Preserves premium license key and device secret.
   *
   * @throws {StorageError} If nuclear mode is active
   */
  async resetToDefaults(): Promise<void> {
    const currentSettings = await this.getSettings();

    // Cannot reset during nuclear mode
    if (currentSettings.nuclearMode.active) {
      throw new StorageError(
        'Cannot reset settings while nuclear mode is active',
        'VALIDATION_FAILED' as any
      );
    }

    // Preserve license key and device secret
    const preservedLicenseKey = currentSettings.premiumLicenseKey;
    const preservedDeviceSecret = currentSettings.nuclearMode.deviceSecret;

    const defaultSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      premiumLicenseKey: preservedLicenseKey,
      nuclearMode: {
        ...DEFAULT_SETTINGS.nuclearMode,
        deviceSecret: preservedDeviceSecret || this.generateDeviceSecret(),
      },
    };

    await storageService.set(
      STORAGE_KEYS.SETTINGS,
      defaultSettings,
      UserSettingsSchema as unknown as z.ZodType<UserSettings>
    );
  }

  /**
   * Check if user has premium license
   *
   * @returns true if premium license key is present
   */
  async isPremium(): Promise<boolean> {
    const settings = await this.getSettings();
    return !!settings.premiumLicenseKey;
  }

  /**
   * Set premium license key
   *
   * @param licenseKey - Premium license key
   */
  async setPremiumLicense(licenseKey: string): Promise<void> {
    await this.updateSettings({ premiumLicenseKey: licenseKey });
  }

  /**
   * Remove premium license (downgrade to free)
   */
  async removePremiumLicense(): Promise<void> {
    await this.updateSettings({ premiumLicenseKey: undefined });
  }

  /**
   * Get nuclear mode device secret
   *
   * Used for HMAC signing of nuclear mode sessions.
   *
   * @returns Device-specific secret
   */
  async getDeviceSecret(): Promise<string> {
    const settings = await this.getSettings();
    return settings.nuclearMode.deviceSecret;
  }

  /**
   * Initialize settings with defaults
   */
  private async initializeDefaults(): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      nuclearMode: {
        ...DEFAULT_SETTINGS.nuclearMode,
        deviceSecret: this.generateDeviceSecret(),
      },
    };

    await storageService.set(
      STORAGE_KEYS.SETTINGS,
      defaultSettings,
      UserSettingsSchema as unknown as z.ZodType<UserSettings>
    );

    return defaultSettings;
  }

  /**
   * Ensure device secret exists
   */
  private async ensureDeviceSecret(
    settings: UserSettings
  ): Promise<UserSettings> {
    const updatedSettings: UserSettings = {
      ...settings,
      nuclearMode: {
        ...settings.nuclearMode,
        deviceSecret: this.generateDeviceSecret(),
      },
    };

    await storageService.set(
      STORAGE_KEYS.SETTINGS,
      updatedSettings,
      UserSettingsSchema as unknown as z.ZodType<UserSettings>
    );

    return updatedSettings;
  }

  /**
   * Generate cryptographically secure device secret
   *
   * Used for HMAC-SHA256 signing of nuclear mode sessions.
   * ASVS V6.2.2 - Cryptographically secure random values
   *
   * @returns 32-byte hex string (256 bits of entropy)
   */
  private generateDeviceSecret(): string {
    // Use Web Crypto API (browser environment) or crypto module (Node.js/tests)
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      // Browser: Generate secure random bytes
      const bytes = new Uint8Array(32);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Node.js (for tests): Use crypto module
      try {
        return nodeCrypto.randomBytes(32).toString('hex');
      } catch {
        // Fallback: This should never happen in production
        console.error('crypto.getRandomValues not available, using fallback');
        return Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      }
    }
  }

  /**
   * Export settings as JSON for backup
   *
   * Excludes sensitive data (license key, device secret).
   *
   * @returns JSON string of sanitized settings
   */
  async exportSettings(): Promise<string> {
    const settings = await this.getSettings();

    // Remove sensitive fields
    const sanitized = {
      ...settings,
      premiumLicenseKey: undefined,
      nuclearMode: {
        ...settings.nuclearMode,
        deviceSecret: '[REDACTED]',
        signature: undefined,
      },
    };

    return JSON.stringify(sanitized, null, 2);
  }

  /**
   * Import settings from JSON
   *
   * Validates imported data before saving.
   * Does not import license key or device secret.
   *
   * @param json - JSON string of settings
   * @throws {StorageError} If JSON is invalid or validation fails
   */
  async importSettings(json: string): Promise<void> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch {
      throw new StorageError(
        'Invalid JSON format',
        'VALIDATION_FAILED' as any
      );
    }

    // Validate with partial schema
    const result = (PartialUserSettingsSchema as unknown as z.ZodType<Partial<UserSettings>>).safeParse(parsed);

    if (!result.success) {
      throw new StorageError(
        `Invalid settings data: ${result.error.errors.map((e) => e.message).join(', ')}`,
        'VALIDATION_FAILED' as any
      );
    }

    // Update settings (preserving license and device secret)
    await this.updateSettings(result.data);
  }
}

/**
 * Singleton instance
 */
export const settingsRepository = new SettingsRepository();
