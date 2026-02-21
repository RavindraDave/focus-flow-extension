/**
 * Nuclear Mode Manager
 * Focus Flow Extension
 *
 * Manages nuclear mode activation, integrity verification, and enforcement.
 * Nuclear mode is an unbreakable focus mode that cannot be disabled until the duration expires.
 *
 * Security Features:
 * - HMAC-SHA256 signatures to prevent tampering (OWASP ASVS V6.2.1)
 * - Time manipulation detection (OWASP ASVS V8.2.3)
 * - Settings lockdown during active mode
 */

import { generateHMAC, verifyHMAC } from '../utils/crypto';
import { SettingsRepository } from '../services/settings-repository';
import { NuclearConfig } from '../types/index';
import { createLogger } from '../utils/logger';

const log = createLogger('NuclearModeManager');

/**
 * Error class for nuclear mode violations
 */
export class NuclearModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NuclearModeError';
  }
}

/**
 * Manager for nuclear mode lifecycle and security
 *
 * @example
 * ```typescript
 * const manager = new NuclearModeManager();
 * await manager.activate(4); // Activate for 4 hours
 * const isActive = await manager.isActive();
 * const remaining = await manager.getRemainingTime();
 * ```
 */
export class NuclearModeManager {
  private settingsRepository: SettingsRepository;
  private lastKnownTime: number;

  constructor(settingsRepository?: SettingsRepository) {
    this.settingsRepository = settingsRepository ?? new SettingsRepository();
    this.lastKnownTime = Date.now();
  }

  /**
   * Activate nuclear mode for a specified duration
   *
   * @param durationHours - Duration in hours (1-8)
   * @throws NuclearModeError if validation fails or already active
   *
   * Security: Generates HMAC-SHA256 signature to prevent tampering
   */
  async activate(durationHours: number): Promise<void> {
    // Validate duration
    if (durationHours < 1 || durationHours > 8) {
      throw new NuclearModeError('Duration must be between 1 and 8 hours');
    }

    // Check if already active
    const settings = await this.settingsRepository.getSettings();
    if (settings.nuclearMode.active) {
      throw new NuclearModeError('Nuclear mode is already active');
    }

    // Calculate end time
    const now = Date.now();
    const endTime = new Date(now + durationHours * 60 * 60 * 1000);

    // Generate signature for integrity verification
    const signature = await this.generateSignature(endTime, settings.nuclearMode.deviceSecret);

    // Update settings - serialize Date to ISO string for schema validation
    const updatedNuclearMode: NuclearConfig = {
      active: true,
      endTime: endTime.toISOString() as unknown as Date,
      deviceSecret: settings.nuclearMode.deviceSecret,
      signature,
      challengeAttempts: settings.nuclearMode.challengeAttempts || 0,
      challengeAttemptsStartTime: settings.nuclearMode.challengeAttemptsStartTime,
    };

    await this.settingsRepository.updateSettings({
      nuclearMode: updatedNuclearMode,
    });

    // Update last known time
    this.lastKnownTime = now;
  }

  /**
   * Check if nuclear mode is currently active
   *
   * Verifies integrity and checks expiration.
   *
   * @returns true if active and valid
   */
  async isActive(): Promise<boolean> {
    const settings = await this.settingsRepository.getSettings();
    const nuclearMode = settings.nuclearMode;

    if (!nuclearMode.active) {
      return false;
    }

    // Verify integrity
    const isValid = await this.verifyIntegrity();
    if (!isValid) {
      // Tampering detected - force deactivate
      await this.forceDeactivate('Integrity check failed - possible tampering detected');
      return false;
    }

    // Check if expired
    if (nuclearMode.endTime && Date.now() >= nuclearMode.endTime.getTime()) {
      await this.deactivate();
      return false;
    }

    return true;
  }

  /**
   * Get remaining time in nuclear mode
   *
   * @returns Remaining milliseconds, or 0 if not active
   */
  async getRemainingTime(): Promise<number> {
    const isActive = await this.isActive();
    if (!isActive) {
      return 0;
    }

    const settings = await this.settingsRepository.getSettings();
    const endTime = settings.nuclearMode.endTime;

    if (!endTime) {
      return 0;
    }

    const remaining = endTime.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get remaining time formatted as human-readable string
   *
   * @returns Formatted time (e.g., "2h 15m")
   */
  async getRemainingTimeFormatted(): Promise<string> {
    const remainingMs = await this.getRemainingTime();
    if (remainingMs === 0) {
      return '0m';
    }

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Verify nuclear mode integrity using HMAC signature
   *
   * @returns true if signature is valid
   *
   * Security: OWASP ASVS V6.2.1 - Cryptographic integrity verification
   */
  async verifyIntegrity(): Promise<boolean> {
    const settings = await this.settingsRepository.getSettings();
    const nuclearMode = settings.nuclearMode;

    if (!nuclearMode.active || !nuclearMode.endTime || !nuclearMode.signature) {
      return false;
    }

    try {
      const isValid = await verifyHMAC(
        this.createSignatureMessage(nuclearMode.endTime),
        nuclearMode.signature,
        nuclearMode.deviceSecret
      );

      return isValid;
    } catch (error) {
      log.error('Nuclear mode integrity verification failed', error as Error);
      return false;
    }
  }

  /**
   * Detect time manipulation attempts
   *
   * Compares current time with last known time to detect backward jumps.
   *
   * @returns true if time manipulation detected
   *
   * Security: OWASP ASVS V8.2.3 - Detect system time manipulation
   */
  detectTimeManipulation(): boolean {
    const now = Date.now();
    const timeDiff = now - this.lastKnownTime;

    // If time went backward by more than 5 minutes, consider it manipulation
    const MANIPULATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    if (timeDiff < -MANIPULATION_THRESHOLD_MS) {
      log.warn('Time manipulation detected', {
        minutesBackward: Math.abs(timeDiff / 1000 / 60)
      });
      return true;
    }

    // Update last known time
    this.lastKnownTime = now;
    return false;
  }

  /**
   * Check if settings can be modified
   *
   * During nuclear mode, certain settings are locked.
   *
   * @returns true if settings can be modified
   */
  async canModifySettings(): Promise<boolean> {
    const isActive = await this.isActive();
    return !isActive;
  }

  /**
   * Deactivate nuclear mode (normal expiration)
   *
   * Can only be called if the duration has expired.
   *
   * @throws NuclearModeError if still active
   */
  async deactivate(): Promise<void> {
    const settings = await this.settingsRepository.getSettings();
    const nuclearMode = settings.nuclearMode;

    if (!nuclearMode.active) {
      return; // Already inactive
    }

    // Check if time has expired
    if (nuclearMode.endTime && Date.now() < nuclearMode.endTime.getTime()) {
      const remaining = await this.getRemainingTimeFormatted();
      throw new NuclearModeError(
        `Cannot deactivate nuclear mode. ${remaining} remaining.`
      );
    }

    // Deactivate
    const updatedNuclearMode: NuclearConfig = {
      ...nuclearMode,
      active: false,
      endTime: undefined,
      signature: undefined,
    };

    await this.settingsRepository.updateSettings({
      nuclearMode: updatedNuclearMode,
    });
  }

  /**
   * Force deactivate nuclear mode (emergency/tampering)
   *
   * This should only be used when integrity checks fail.
   *
   * @param reason - Reason for force deactivation
   * @private
   */
  private async forceDeactivate(reason: string): Promise<void> {
    log.error('Force deactivating nuclear mode', new Error(reason), { reason });

    const settings = await this.settingsRepository.getSettings();

    const updatedNuclearMode: NuclearConfig = {
      ...settings.nuclearMode,
      active: false,
      endTime: undefined,
      signature: undefined,
      challengeAttempts: 0,
      challengeAttemptsStartTime: undefined,
    };

    await this.settingsRepository.updateSettings({
      nuclearMode: updatedNuclearMode,
    });
  }

  /**
   * Generate HMAC-SHA256 signature for nuclear mode activation
   *
   * @param endTime - End time of nuclear mode
   * @param deviceSecret - Device-specific secret
   * @returns HMAC signature (hex string)
   * @private
   */
  private async generateSignature(endTime: Date, deviceSecret: string): Promise<string> {
    const message = this.createSignatureMessage(endTime);
    return await generateHMAC(message, deviceSecret);
  }

  /**
   * Create message to sign/verify
   *
   * @param endTime - End time of nuclear mode
   * @returns Message string
   * @private
   */
  private createSignatureMessage(endTime: Date): string {
    return JSON.stringify({
      endTime: endTime.toISOString(),
      purpose: 'nuclear-mode-activation',
    });
  }

  /**
   * Get nuclear mode status information
   *
   * @returns Status object with all nuclear mode details
   */
  async getStatus(): Promise<{
    active: boolean;
    endTime: Date | undefined;
    remainingMs: number;
    remainingFormatted: string;
    integrityValid: boolean;
    timeManipulationDetected: boolean;
  }> {
    const settings = await this.settingsRepository.getSettings();
    const nuclearMode = settings.nuclearMode;
    const isActive = await this.isActive();
    const remainingMs = await this.getRemainingTime();
    const remainingFormatted = await this.getRemainingTimeFormatted();
    const integrityValid = await this.verifyIntegrity();
    const timeManipulationDetected = this.detectTimeManipulation();

    return {
      active: isActive,
      endTime: nuclearMode.endTime,
      remainingMs,
      remainingFormatted,
      integrityValid: isActive ? integrityValid : true,
      timeManipulationDetected,
    };
  }
}
