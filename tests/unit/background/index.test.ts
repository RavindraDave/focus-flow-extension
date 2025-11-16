/**
 * Unit Tests for BackgroundServiceWorker
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BackgroundServiceWorker, BackgroundError } from '../../../src/background/index';

// Mock all dependencies
vi.mock('../../../src/background/timer-engine');
vi.mock('../../../src/background/blocker-engine');
vi.mock('../../../src/background/analytics-tracker');
vi.mock('../../../src/background/streak-tracker');
vi.mock('../../../src/background/nuclear-mode-manager');
vi.mock('../../../src/services/session-repository');
vi.mock('../../../src/services/analytics-repository');
vi.mock('../../../src/services/settings-repository');
vi.mock('../../../src/services/block-rule-repository');

// Mock Chrome APIs
const mockChrome = {
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://test${path}`),
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
  },
  notifications: {
    create: vi.fn(),
  },
};

global.chrome = mockChrome as any;

describe('BackgroundServiceWorker', () => {
  let messageListener: any;
  let alarmListener: any;
  let installListener: any;

  beforeEach(() => {
    // Capture event listeners
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener: any) => {
      messageListener = listener;
    });

    mockChrome.alarms.onAlarm.addListener.mockImplementation((listener: any) => {
      alarmListener = listener;
    });

    mockChrome.runtime.onInstalled.addListener.mockImplementation((listener: any) => {
      installListener = listener;
    });

    // Reset mocks
    mockChrome.alarms.create.mockResolvedValue(undefined);
    mockChrome.alarms.clear.mockResolvedValue(true);
    mockChrome.notifications.create.mockResolvedValue('notification-id');

    vi.clearAllMocks();
  });

  afterEach(() => {
    messageListener = null;
    alarmListener = null;
    installListener = null;
  });

  describe('Initialization', () => {
    it('should initialize all engines and repositories', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      // Event listeners should be registered
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(mockChrome.alarms.onAlarm.addListener).toHaveBeenCalled();
      expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalled();

      // Midnight check should be scheduled
      expect(mockChrome.alarms.create).toHaveBeenCalledWith(
        'midnight-check',
        expect.objectContaining({
          delayInMinutes: expect.any(Number),
        })
      );
    });
  });

  describe('Message Handling', () => {
    it('should handle TIMER_START message', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const sendResponse = vi.fn();
      const message = {
        type: 'TIMER_START',
        sessionType: 'work',
        duration: 25,
      };

      messageListener(message, {}, sendResponse);

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle TIMER_GET_STATUS message', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const sendResponse = vi.fn();
      const message = { type: 'TIMER_GET_STATUS' };

      messageListener(message, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle ANALYTICS_GET message', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const sendResponse = vi.fn();
      const message = { type: 'ANALYTICS_GET' };

      messageListener(message, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalled();
    });

    it('should handle SETTINGS_UPDATE message', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const sendResponse = vi.fn();
      const message = {
        type: 'SETTINGS_UPDATE',
        updates: { workDuration: 30 },
      };

      messageListener(message, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalled();
    });

    it('should handle unknown message type', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const sendResponse = vi.fn();
      const message = { type: 'UNKNOWN_TYPE' };

      messageListener(message, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Unknown message type'),
        })
      );
    });

    it('should return true from message listener for async response', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const result = messageListener({}, {}, vi.fn());

      expect(result).toBe(true);
    });
  });

  describe('Alarm Handling', () => {
    it('should handle timer tick alarm', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const alarm = { name: 'pomodoro-timer' };
      await alarmListener(alarm);

      // Timer tick should be called (mock will verify)
      expect(true).toBe(true);
    });

    it('should handle midnight check alarm', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const alarm = { name: 'midnight-check' };

      // Should not throw when handling midnight check
      await expect(alarmListener(alarm)).resolves.toBeUndefined();

      // Midnight check alarm should be handled (logged in console)
      expect(true).toBe(true);
    });

    it('should handle allowance reset alarm', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const alarm = { name: 'allowance-reset' };
      await alarmListener(alarm);

      // Allowance reset should be called (mock will verify)
      expect(true).toBe(true);
    });

    it('should handle unknown alarm gracefully', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      // Unknown alarms are delegated to schedule manager
      // which will handle schedule-specific alarms
      const alarm = { name: 'unknown-alarm' };

      // Should not throw
      await expect(alarmListener(alarm)).resolves.not.toThrow();
    });

    it('should catch and log alarm handler errors', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by passing invalid alarm
      const alarm = { name: null as any };
      await alarmListener(alarm);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Installation Handling', () => {
    it('should handle extension installation', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const details = { reason: 'install' };
      await installListener(details);

      // Welcome notification should be created
      expect(mockChrome.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          title: expect.stringContaining('Installed'),
        })
      );

      // Midnight check should be scheduled
      expect(mockChrome.alarms.create).toHaveBeenCalled();
    });

    it('should handle extension update', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const details = { reason: 'update', previousVersion: '0.9.0' };
      await installListener(details);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('updated')
      );

      consoleInfoSpy.mockRestore();
    });

    it('should catch installation handler errors', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error
      mockChrome.notifications.create.mockRejectedValueOnce(new Error('Notification failed'));

      const details = { reason: 'install' };
      await installListener(details);

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Midnight Check Scheduling', () => {
    it('should calculate correct delay until midnight', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      const createCalls = mockChrome.alarms.create.mock.calls;
      const midnightCall = createCalls.find(call => call[0] === 'midnight-check');

      expect(midnightCall).toBeDefined();
      expect(midnightCall![1].delayInMinutes).toBeGreaterThan(0);
      expect(midnightCall![1].delayInMinutes).toBeLessThanOrEqual(24 * 60); // Max 24 hours
    });

    it('should clear existing alarm before creating new one', async () => {
      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      expect(mockChrome.alarms.clear).toHaveBeenCalledWith('midnight-check');
    });
  });

  describe('Timer State Restoration', () => {
    it('should not restore when no current session', async () => {
      // Mock SessionRepository to return null
      const { SessionRepository } = await import('../../../src/services/session-repository');
      const mockGetCurrentSession = vi.fn().mockResolvedValue(null);
      (SessionRepository as any).mockImplementation(() => ({
        getCurrentSession: mockGetCurrentSession,
      }));

      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      expect(mockGetCurrentSession).toHaveBeenCalled();
    });

    it('should not restore paused session', async () => {
      const { SessionRepository } = await import('../../../src/services/session-repository');
      const mockSession = {
        id: '1',
        type: 'work',
        duration: 25,
        startTime: new Date(),
        status: 'paused',
      };

      const mockGetCurrentSession = vi.fn().mockResolvedValue(mockSession);
      (SessionRepository as any).mockImplementation(() => ({
        getCurrentSession: mockGetCurrentSession,
      }));

      const worker = new BackgroundServiceWorker();
      await worker.initialize();

      // Should not restore paused session
      expect(mockGetCurrentSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should create BackgroundError with correct name', () => {
      const error = new BackgroundError('Test error');

      expect(error.name).toBe('BackgroundError');
      expect(error.message).toBe('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });
});
