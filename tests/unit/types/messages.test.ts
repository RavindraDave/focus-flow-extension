/**
 * Unit Tests for Message Types
 * Target: ≥80% coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BackgroundMessage,
  BackgroundResponse,
  TimerStatus,
  NuclearModeStatus,
  BlockerStats,
  ProductivitySummary,
  isTimerStartMessage,
  isNuclearModeActivateMessage,
  isBlockerTrackAttemptMessage,
  isSettingsUpdateMessage,
  sendBackgroundMessage,
  validateMessage,
} from '../../../src/types/messages';

// Mock Chrome API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    lastError: undefined as any,
  },
};

global.chrome = mockChrome as any;

describe('Message Types', () => {
  beforeEach(() => {
    mockChrome.runtime.lastError = undefined;
    vi.clearAllMocks();
  });

  describe('Type Guards', () => {
    it('should identify TIMER_START message', () => {
      const message: BackgroundMessage = {
        type: 'TIMER_START',
        sessionType: 'work',
        duration: 25,
      };

      expect(isTimerStartMessage(message)).toBe(true);

      if (isTimerStartMessage(message)) {
        expect(message.sessionType).toBe('work');
        expect(message.duration).toBe(25);
      }
    });

    it('should identify NUCLEAR_MODE_ACTIVATE message', () => {
      const message: BackgroundMessage = {
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours: 2,
      };

      expect(isNuclearModeActivateMessage(message)).toBe(true);

      if (isNuclearModeActivateMessage(message)) {
        expect(message.durationHours).toBe(2);
      }
    });

    it('should identify BLOCKER_TRACK_ATTEMPT message', () => {
      const message: BackgroundMessage = {
        type: 'BLOCKER_TRACK_ATTEMPT',
        domain: 'youtube.com',
      };

      expect(isBlockerTrackAttemptMessage(message)).toBe(true);

      if (isBlockerTrackAttemptMessage(message)) {
        expect(message.domain).toBe('youtube.com');
      }
    });

    it('should identify SETTINGS_UPDATE message', () => {
      const message: BackgroundMessage = {
        type: 'SETTINGS_UPDATE',
        updates: { workDuration: 30 },
      };

      expect(isSettingsUpdateMessage(message)).toBe(true);

      if (isSettingsUpdateMessage(message)) {
        expect(message.updates.workDuration).toBe(30);
      }
    });

    it('should return false for non-matching message types', () => {
      const message: BackgroundMessage = { type: 'TIMER_PAUSE' };

      expect(isTimerStartMessage(message)).toBe(false);
      expect(isNuclearModeActivateMessage(message)).toBe(false);
      expect(isBlockerTrackAttemptMessage(message)).toBe(false);
      expect(isSettingsUpdateMessage(message)).toBe(false);
    });
  });

  describe('Message Validation', () => {
    it('should validate TIMER_START message with valid data', () => {
      const message: BackgroundMessage = {
        type: 'TIMER_START',
        sessionType: 'work',
        duration: 25,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject TIMER_START with invalid duration', () => {
      const message: BackgroundMessage = {
        type: 'TIMER_START',
        sessionType: 'work',
        duration: 200, // Max is 180
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate NUCLEAR_MODE_ACTIVATE with valid hours', () => {
      const message: BackgroundMessage = {
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours: 4,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
    });

    it('should reject NUCLEAR_MODE_ACTIVATE with invalid hours', () => {
      const message: BackgroundMessage = {
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours: 10, // Max is 8
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject NUCLEAR_MODE_ACTIVATE with hours < 1', () => {
      const message: BackgroundMessage = {
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours: 0,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
    });

    it('should validate BLOCKER_TRACK_ATTEMPT with valid domain', () => {
      const message: BackgroundMessage = {
        type: 'BLOCKER_TRACK_ATTEMPT',
        domain: 'example.com',
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
    });

    it('should reject BLOCKER_TRACK_ATTEMPT with empty domain', () => {
      const message: BackgroundMessage = {
        type: 'BLOCKER_TRACK_ATTEMPT',
        domain: '',
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
    });

    it('should validate SESSION_GET_HISTORY with valid limit', () => {
      const message: BackgroundMessage = {
        type: 'SESSION_GET_HISTORY',
        limit: 50,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
    });

    it('should reject SESSION_GET_HISTORY with limit > 1000', () => {
      const message: BackgroundMessage = {
        type: 'SESSION_GET_HISTORY',
        limit: 2000,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
    });

    it('should validate SETTINGS_UPDATE with valid settings', () => {
      const message: BackgroundMessage = {
        type: 'SETTINGS_UPDATE',
        updates: {
          workDuration: 30,
          autoStartNextSession: true,
        },
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
    });

    it('should reject SETTINGS_UPDATE with invalid workDuration', () => {
      const message: BackgroundMessage = {
        type: 'SETTINGS_UPDATE',
        updates: {
          workDuration: 200, // Max is 180
        },
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
    });

    it('should validate messages without specific schemas', () => {
      const message: BackgroundMessage = { type: 'TIMER_PAUSE' };

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
    });
  });

  describe('sendBackgroundMessage', () => {
    it('should send message and return successful response', async () => {
      const mockResponse: BackgroundResponse<{ state: string }> = {
        success: true,
        data: { state: 'idle' },
      };

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const message: BackgroundMessage = { type: 'TIMER_GET_STATUS' };
      const response = await sendBackgroundMessage<{ state: string }>(message);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.state).toBe('idle');
      }
    });

    it('should send message and return error response', async () => {
      const mockResponse: BackgroundResponse = {
        success: false,
        error: 'Timer not running',
      };

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse);
      });

      const message: BackgroundMessage = { type: 'TIMER_PAUSE' };
      const response = await sendBackgroundMessage(message);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toBe('Timer not running');
      }
    });

    it('should reject on chrome.runtime.lastError', async () => {
      mockChrome.runtime.lastError = { message: 'Extension context invalidated' };

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null);
      });

      const message: BackgroundMessage = { type: 'TIMER_GET_STATUS' };

      await expect(sendBackgroundMessage(message)).rejects.toThrow(
        'Extension context invalidated'
      );
    });
  });

  describe('Type Interfaces', () => {
    it('should accept valid TimerStatus', () => {
      const status: TimerStatus = {
        state: 'work',
        remainingSeconds: 1500,
        totalSeconds: 1500,
        sessionCount: 2,
        isPaused: false,
      };

      expect(status.state).toBe('work');
      expect(status.isPaused).toBe(false);
    });

    it('should accept valid NuclearModeStatus', () => {
      const status: NuclearModeStatus = {
        isActive: true,
        remainingTime: 7200,
      };

      expect(status.isActive).toBe(true);
      expect(status.remainingTime).toBe(7200);
    });

    it('should accept valid BlockerStats', () => {
      const stats: BlockerStats = {
        isActive: true,
        rulesCount: 5,
        blockedToday: 12,
      };

      expect(stats.isActive).toBe(true);
      expect(stats.rulesCount).toBe(5);
    });

    it('should accept valid ProductivitySummary', () => {
      const summary: ProductivitySummary = {
        totalPomodoros: 42,
        totalFocusTime: 1050,
        averagePerDay: 6,
        completionRate: 0.85,
        topTasks: [
          { task: 'Write code', count: 15 },
          { task: 'Review PRs', count: 10 },
        ],
      };

      expect(summary.totalPomodoros).toBe(42);
      expect(summary.completionRate).toBe(0.85);
    });
  });

  describe('BackgroundMessage Discriminated Union', () => {
    it('should accept all timer message types', () => {
      const messages: BackgroundMessage[] = [
        { type: 'TIMER_START', sessionType: 'work', duration: 25 },
        { type: 'TIMER_PAUSE' },
        { type: 'TIMER_RESUME' },
        { type: 'TIMER_STOP' },
        { type: 'TIMER_GET_STATUS' },
      ];

      messages.forEach(message => {
        expect(message.type).toContain('TIMER');
      });
    });

    it('should accept all nuclear mode message types', () => {
      const messages: BackgroundMessage[] = [
        { type: 'NUCLEAR_MODE_ACTIVATE', durationHours: 2 },
        { type: 'NUCLEAR_MODE_DEACTIVATE' },
        { type: 'NUCLEAR_MODE_GET_STATUS' },
      ];

      messages.forEach(message => {
        expect(message.type).toContain('NUCLEAR_MODE');
      });
    });

    it('should accept all analytics message types', () => {
      const messages: BackgroundMessage[] = [
        { type: 'ANALYTICS_GET' },
        { type: 'ANALYTICS_GET_FOCUS_SCORE' },
        { type: 'ANALYTICS_GET_WEEKLY_SUMMARY' },
        { type: 'ANALYTICS_GET_MONTHLY_SUMMARY' },
      ];

      messages.forEach(message => {
        expect(message.type).toContain('ANALYTICS');
      });
    });

    it('should accept all blocker message types', () => {
      const messages: BackgroundMessage[] = [
        { type: 'BLOCKER_SYNC_RULES' },
        { type: 'BLOCKER_GET_STATS' },
        { type: 'BLOCKER_TRACK_ATTEMPT', domain: 'example.com' },
      ];

      messages.forEach(message => {
        expect(message.type).toContain('BLOCKER');
      });
    });
  });
});
