/**
 * Unit Tests for NuclearModeManager
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NuclearModeManager, NuclearModeError } from '../../../src/background/nuclear-mode-manager';
import { SettingsRepository } from '../../../src/services/settings-repository';
import { UserSettings, NuclearConfig } from '../../../src/types/index';

// Mock SettingsRepository
vi.mock('../../../src/services/settings-repository');

// Mock crypto utilities
vi.mock('../../../src/utils/crypto', () => ({
  generateHMAC: vi.fn((message: string, secret: string) => {
    // Generate deterministic signature for testing
    return Promise.resolve(`signature-${secret.substring(0, 8)}-${message.length}`);
  }),
  verifyHMAC: vi.fn((message: string, signature: string, secret: string) => {
    // Verify signature matches expected format
    const expected = `signature-${secret.substring(0, 8)}-${message.length}`;
    return Promise.resolve(signature === expected);
  }),
}));

describe('NuclearModeManager', () => {
  let manager: NuclearModeManager;
  let mockSettingsRepository: any;

  // Helper to create expected signature message format
  const createSignatureMessage = (endTime: Date): string => {
    return JSON.stringify({
      endTime: endTime.toISOString(),
      purpose: 'nuclear-mode-activation',
    });
  };

  // Helper to calculate expected signature for a given endTime
  const calculateExpectedSignature = (endTime: Date, deviceSecret: string): string => {
    const message = createSignatureMessage(endTime);
    return `signature-${deviceSecret.substring(0, 8)}-${message.length}`;
  };

  const createMockSettings = (nuclearModeOverrides?: Partial<NuclearConfig>): UserSettings => {
    const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    return {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartNextSession: false,
      enableSounds: true,
      enableNotifications: true,
      theme: 'system',
      youtubeControls: {
        enabled: false,
        hideShorts: false,
        hideRecommendations: false,
        hideHomeFeed: false,
        hideComments: false,
        hideEndScreenCards: false,
        allowedChannels: [],
      },
      nuclearMode: {
        active: false,
        endTime: undefined,
        deviceSecret,
        signature: undefined,
        duration: undefined,
        ...nuclearModeOverrides,
      },
      premiumLicenseKey: undefined,
      enableSync: false,
    };
  };

  beforeEach(() => {
    mockSettingsRepository = {
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
    };

    manager = new NuclearModeManager(mockSettingsRepository);
    vi.clearAllMocks();
  });

  describe('activate', () => {
    it('should activate nuclear mode with valid duration', async () => {
      const settings = createMockSettings();
      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      await manager.activate(4); // 4 hours

      expect(mockSettingsRepository.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          nuclearMode: expect.objectContaining({
            active: true,
            duration: 4,
            signature: expect.any(String),
            endTime: expect.any(Date),
          }),
        })
      );
    });

    it('should throw error if duration is too short', async () => {
      const settings = createMockSettings();
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      await expect(manager.activate(0)).rejects.toThrow(NuclearModeError);
      await expect(manager.activate(0.5)).rejects.toThrow('between 1 and 8 hours');
    });

    it('should throw error if duration is too long', async () => {
      const settings = createMockSettings();
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      await expect(manager.activate(9)).rejects.toThrow(NuclearModeError);
      await expect(manager.activate(10)).rejects.toThrow('between 1 and 8 hours');
    });

    it('should throw error if already active', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      await expect(manager.activate(2)).rejects.toThrow('already active');
    });

    it('should calculate correct end time', async () => {
      const settings = createMockSettings();
      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      const beforeActivation = Date.now();
      await manager.activate(2); // 2 hours
      const afterActivation = Date.now();

      const savedNuclearMode = mockSettingsRepository.updateSettings.mock.calls[0][0].nuclearMode;
      const endTime = savedNuclearMode.endTime.getTime();

      // End time should be approximately 2 hours from now
      const expectedMin = beforeActivation + 2 * 60 * 60 * 1000;
      const expectedMax = afterActivation + 2 * 60 * 60 * 1000;

      expect(endTime).toBeGreaterThanOrEqual(expectedMin);
      expect(endTime).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('isActive', () => {
    it('should return true if active and not expired', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.isActive();

      expect(result).toBe(true);
    });

    it('should return false if not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.isActive();

      expect(result).toBe(false);
    });

    it('should deactivate and return false if expired', async () => {
      const endTime = new Date(Date.now() - 1000); // 1 second ago (expired)
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 1,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      const result = await manager.isActive();

      expect(result).toBe(false);
      expect(mockSettingsRepository.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          nuclearMode: expect.objectContaining({
            active: false,
          }),
        })
      );
    });

    it('should deactivate if integrity check fails', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: 'invalid-signature', // Invalid signature
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      const result = await manager.isActive();

      expect(result).toBe(false);
      // Should have called updateSettings to force deactivate
      expect(mockSettingsRepository.updateSettings).toHaveBeenCalled();
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining milliseconds', async () => {
      const futureTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours from now
      const endTime = new Date(futureTime);
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 2,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.getRemainingTime();

      // Should be approximately 2 hours (allow 1 second tolerance)
      expect(result).toBeGreaterThan(2 * 60 * 60 * 1000 - 1000);
      expect(result).toBeLessThanOrEqual(2 * 60 * 60 * 1000);
    });

    it('should return 0 if not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.getRemainingTime();

      expect(result).toBe(0);
    });

    it('should return 0 if expired', async () => {
      const endTime = new Date(Date.now() - 1000); // Expired
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 1,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      const result = await manager.getRemainingTime();

      expect(result).toBe(0);
    });
  });

  describe('getRemainingTimeFormatted', () => {
    it('should format hours and minutes correctly', async () => {
      const futureTime = Date.now() + 2.5 * 60 * 60 * 1000; // 2.5 hours
      const endTime = new Date(futureTime);
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 3,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.getRemainingTimeFormatted();

      expect(result).toMatch(/2h \d+m/); // Should be "2h XXm"
    });

    it('should format minutes only when less than 1 hour', async () => {
      const futureTime = Date.now() + 45 * 60 * 1000; // 45 minutes
      const endTime = new Date(futureTime);
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 1,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.getRemainingTimeFormatted();

      expect(result).toMatch(/\d+m/); // Should be "XXm"
      expect(result).not.toContain('h');
    });

    it('should return "0m" when not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.getRemainingTimeFormatted();

      expect(result).toBe('0m');
    });
  });

  describe('verifyIntegrity', () => {
    it('should return true for valid signature', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.verifyIntegrity();

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: 'tampered-signature',
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.verifyIntegrity();

      expect(result).toBe(false);
    });

    it('should return false if not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.verifyIntegrity();

      expect(result).toBe(false);
    });

    it('should return false if missing signature', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: undefined,
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.verifyIntegrity();

      expect(result).toBe(false);
    });
  });

  describe('detectTimeManipulation', () => {
    it('should return false for normal time progression', async () => {
      const result1 = await manager.detectTimeManipulation();
      expect(result1).toBe(false);

      // Simulate 1 second passing
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await manager.detectTimeManipulation();
      expect(result2).toBe(false);
    });

    it('should detect backward time jump', async () => {
      // First call to establish baseline
      await manager.detectTimeManipulation();

      // Mock Date.now to return a time in the past
      const originalDateNow = Date.now;
      const baseTime = originalDateNow();

      // Simulate time going backward by 10 minutes
      vi.spyOn(Date, 'now').mockReturnValue(baseTime - 10 * 60 * 1000);

      const result = await manager.detectTimeManipulation();

      expect(result).toBe(true);

      // Restore Date.now
      vi.spyOn(Date, 'now').mockRestore();
    });

    it('should not flag small backward jumps (<5 minutes)', async () => {
      await manager.detectTimeManipulation();

      const originalDateNow = Date.now;
      const baseTime = originalDateNow();

      // Simulate time going backward by 2 minutes (below threshold)
      vi.spyOn(Date, 'now').mockReturnValue(baseTime - 2 * 60 * 1000);

      const result = await manager.detectTimeManipulation();

      expect(result).toBe(false);

      vi.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('canModifySettings', () => {
    it('should return false when nuclear mode is active', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.canModifySettings();

      expect(result).toBe(false);
    });

    it('should return true when nuclear mode is not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const result = await manager.canModifySettings();

      expect(result).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate when time has expired', async () => {
      const endTime = new Date(Date.now() - 1000); // Expired
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 1,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);
      mockSettingsRepository.updateSettings.mockResolvedValue(undefined);

      await manager.deactivate();

      expect(mockSettingsRepository.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          nuclearMode: expect.objectContaining({
            active: false,
            endTime: undefined,
            signature: undefined,
            duration: undefined,
          }),
        })
      );
    });

    it('should throw error if still active', async () => {
      const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // Still active
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 4,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      await expect(manager.deactivate()).rejects.toThrow(NuclearModeError);
      await expect(manager.deactivate()).rejects.toThrow('Cannot deactivate');
    });

    it('should do nothing if already inactive', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      await manager.deactivate();

      expect(mockSettingsRepository.updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return complete status information', async () => {
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      const deviceSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const settings = createMockSettings({
        active: true,
        endTime,
        duration: 2,
        signature: calculateExpectedSignature(endTime, deviceSecret),
      });

      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const status = await manager.getStatus();

      expect(status.active).toBe(true);
      expect(status.endTime).toEqual(endTime);
      expect(status.duration).toBe(2);
      expect(status.integrityValid).toBe(true);
      expect(status.remainingMs).toBeGreaterThan(0);
      expect(status.remainingFormatted).toMatch(/\d+h \d+m/);
    });

    it('should return inactive status when not active', async () => {
      const settings = createMockSettings({ active: false });
      mockSettingsRepository.getSettings.mockResolvedValue(settings);

      const status = await manager.getStatus();

      expect(status.active).toBe(false);
      expect(status.remainingMs).toBe(0);
      expect(status.remainingFormatted).toBe('0m');
    });
  });
});
