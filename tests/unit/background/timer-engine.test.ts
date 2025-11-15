/**
 * Unit Tests for TimerEngine
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerEngine, TimerError } from '../../../src/background/timer-engine';
import { PomodoroSession } from '../../../src/types/index';

// Mock all dependencies
vi.mock('../../../src/services/session-repository');
vi.mock('../../../src/background/analytics-tracker');
vi.mock('../../../src/background/streak-tracker');
vi.mock('../../../src/services/settings-repository');
vi.mock('../../../src/background/blocker-engine');

// Mock Chrome APIs
const mockChrome = {
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
  },
};

global.chrome = mockChrome as any;

describe('TimerEngine', () => {
  let engine: TimerEngine;
  let mockSessionRepository: any;
  let mockAnalyticsTracker: any;
  let mockStreakTracker: any;
  let mockSettingsRepository: any;
  let mockBlockerEngine: any;

  const createMockSettings = () => ({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartNextSession: false,
    enableNotifications: true,
    premiumLicenseKey: undefined,
  });

  beforeEach(() => {
    mockSessionRepository = {
      getCurrentSession: vi.fn(),
      saveCurrentSession: vi.fn(),
      addToHistory: vi.fn(),
      clearCurrentSession: vi.fn(),
    };

    mockAnalyticsTracker = {
      trackSessionCompletion: vi.fn(),
      trackSessionAbandonment: vi.fn(),
    };

    mockStreakTracker = {
      checkDailyStreak: vi.fn(),
    };

    mockSettingsRepository = {
      getSettings: vi.fn().mockResolvedValue(createMockSettings()),
    };

    mockBlockerEngine = {
      enableBlocking: vi.fn(),
      disableBlocking: vi.fn(),
    };

    engine = new TimerEngine(
      mockSessionRepository,
      mockAnalyticsTracker,
      mockStreakTracker,
      mockSettingsRepository,
      mockBlockerEngine
    );

    // Reset Chrome API mocks
    mockChrome.alarms.create.mockResolvedValue(undefined);
    mockChrome.alarms.clear.mockResolvedValue(true);
    mockChrome.action.setBadgeText.mockResolvedValue(undefined);
    mockChrome.action.setBadgeBackgroundColor.mockResolvedValue(undefined);
    mockChrome.notifications.create.mockResolvedValue('notification-id');

    vi.clearAllMocks();
  });

  describe('start', () => {
    it('should start a work session', async () => {
      await engine.start('work', 25);

      const status = await engine.getStatus();

      expect(status.state).toBe('work');
      expect(status.totalSeconds).toBe(25 * 60);
      expect(status.remainingSeconds).toBe(25 * 60);
      expect(mockSessionRepository.saveCurrentSession).toHaveBeenCalled();
      expect(mockBlockerEngine.enableBlocking).toHaveBeenCalled();
      expect(mockChrome.alarms.create).toHaveBeenCalled();
    });

    it('should start a break session', async () => {
      await engine.start('short-break', 5);

      const status = await engine.getStatus();

      expect(status.state).toBe('short-break');
      expect(status.totalSeconds).toBe(5 * 60);
      expect(mockBlockerEngine.disableBlocking).toHaveBeenCalled();
    });

    it('should throw error if timer already running', async () => {
      await engine.start('work', 25);

      await expect(engine.start('work', 25)).rejects.toThrow(TimerError);
      await expect(engine.start('work', 25)).rejects.toThrow('already running');
    });

    it('should create alarm with correct interval', async () => {
      await engine.start('work', 25);

      expect(mockChrome.alarms.create).toHaveBeenCalledWith(
        'pomodoro-timer',
        { periodInMinutes: 1 / 60 } // Every second
      );
    });
  });

  describe('pause / resume', () => {
    it('should pause active timer', async () => {
      await engine.start('work', 25);
      await engine.pause();

      const status = await engine.getStatus();

      expect(status.state).toBe('paused');
      expect(status.isPaused).toBe(true);
      expect(mockChrome.alarms.clear).toHaveBeenCalled();
    });

    it('should resume paused timer', async () => {
      const session: PomodoroSession = {
        id: '1',
        type: 'work',
        duration: 25,
        startTime: new Date(),
        endTime: undefined,
        taskName: 'Test',
        category: 'general',
        status: 'paused',
        actualDuration: undefined,
      };

      mockSessionRepository.getCurrentSession.mockResolvedValue(session);

      await engine.start('work', 25);
      await engine.pause();
      await engine.resume();

      const status = await engine.getStatus();

      expect(status.state).toBe('work');
      expect(status.isPaused).toBe(false);
      expect(mockChrome.alarms.create).toHaveBeenCalledTimes(2); // start + resume
    });

    it('should throw error when pausing idle timer', async () => {
      await expect(engine.pause()).rejects.toThrow(TimerError);
    });

    it('should throw error when resuming non-paused timer', async () => {
      await expect(engine.resume()).rejects.toThrow(TimerError);
    });
  });

  describe('stop', () => {
    it('should stop timer and mark session as abandoned', async () => {
      const session: PomodoroSession = {
        id: '1',
        type: 'work',
        duration: 25,
        startTime: new Date(),
        endTime: undefined,
        taskName: 'Test',
        category: 'general',
        status: 'active',
        actualDuration: undefined,
      };

      mockSessionRepository.getCurrentSession.mockResolvedValue(session);

      await engine.start('work', 25);
      await engine.stop();

      expect(mockSessionRepository.addToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'abandoned',
        })
      );
      expect(mockAnalyticsTracker.trackSessionAbandonment).toHaveBeenCalled();
      expect(mockSessionRepository.clearCurrentSession).toHaveBeenCalled();

      const status = await engine.getStatus();
      expect(status.state).toBe('idle');
    });

    it('should throw error when stopping idle timer', async () => {
      await expect(engine.stop()).rejects.toThrow(TimerError);
    });
  });

  describe('tick', () => {
    it('should decrement remaining seconds', async () => {
      await engine.start('work', 25);

      const beforeTick = await engine.getStatus();
      await engine.tick();
      const afterTick = await engine.getStatus();

      expect(afterTick.remainingSeconds).toBe(beforeTick.remainingSeconds - 1);
    });

    it('should do nothing when idle', async () => {
      const before = await engine.getStatus();
      await engine.tick();
      const after = await engine.getStatus();

      expect(after.remainingSeconds).toBe(before.remainingSeconds);
    });

    it('should do nothing when paused', async () => {
      await engine.start('work', 25);
      await engine.pause();

      const before = await engine.getStatus();
      await engine.tick();
      const after = await engine.getStatus();

      expect(after.remainingSeconds).toBe(before.remainingSeconds);
    });
  });

  describe('getStatus', () => {
    it('should return status for idle timer', async () => {
      const status = await engine.getStatus();

      expect(status.state).toBe('idle');
      expect(status.remainingSeconds).toBe(0);
      expect(status.totalSeconds).toBe(0);
      expect(status.sessionCount).toBe(0);
      expect(status.isPaused).toBe(false);
    });

    it('should return status for active timer', async () => {
      await engine.start('work', 25);

      const status = await engine.getStatus();

      expect(status.state).toBe('work');
      expect(status.totalSeconds).toBe(25 * 60);
      expect(status.remainingSeconds).toBeGreaterThan(0);
    });
  });

  describe('Badge Updates', () => {
    it('should update badge when starting timer', async () => {
      await engine.start('work', 25);

      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '25' });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#ef4444', // Red for work
      });
    });

    it('should clear badge when idle', async () => {
      await engine.start('work', 1);
      await engine.stop();

      const calls = mockChrome.action.setBadgeText.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toEqual({ text: '' });
    });

    it('should use green color for breaks', async () => {
      await engine.start('short-break', 5);

      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#10b981', // Green for break
      });
    });

    it('should use gray color when paused', async () => {
      await engine.start('work', 25);
      await engine.pause();

      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#6b7280', // Gray for paused
      });
    });
  });

  describe('resetSessionCount', () => {
    it('should reset session count to zero', () => {
      engine.resetSessionCount();

      const status = engine.getStatus();
      expect(status).resolves.toMatchObject({ sessionCount: 0 });
    });
  });
});
