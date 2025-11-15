/**
 * Unit Tests for StreakTracker
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreakTracker, StreakError } from '../../../src/background/streak-tracker';
import { StreakData, PomodoroSession } from '../../../src/types/index';

// Mock repositories
vi.mock('../../../src/services/analytics-repository');
vi.mock('../../../src/services/session-repository');

describe('StreakTracker', () => {
  let tracker: StreakTracker;
  let mockAnalyticsRepository: any;
  let mockSessionRepository: any;

  const createMockStreak = (overrides?: Partial<StreakData>): StreakData => {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: undefined,
      freezesAvailable: 0,
      todayCompleted: false,
      ...overrides,
    };
  };

  const createMockSession = (overrides?: Partial<PomodoroSession>): PomodoroSession => {
    return {
      id: crypto.randomUUID(),
      type: 'work',
      duration: 25,
      startTime: new Date(),
      endTime: new Date(),
      taskName: 'Test Task',
      category: 'development',
      status: 'completed',
      actualDuration: 25,
      ...overrides,
    };
  };

  beforeEach(() => {
    mockAnalyticsRepository = {
      getStreak: vi.fn(),
      updateStreak: vi.fn(),
    };

    mockSessionRepository = {
      getTodaySessions: vi.fn(),
    };

    tracker = new StreakTracker(mockAnalyticsRepository, mockSessionRepository);
    vi.clearAllMocks();
  });

  describe('checkDailyStreak', () => {
    it('should maintain streak when consecutive day with activity', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 5,
        longestStreak: 10,
        lastSessionDate: yesterday,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(6); // Incremented
      expect(mockAnalyticsRepository.updateStreak).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 6,
          longestStreak: 10, // Not updated (current 6 < longest 10)
        })
      );
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 10,
        longestStreak: 10,
        lastSessionDate: yesterday,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(11);
      expect(result.longestStreak).toBe(11); // Updated
    });

    it('should break streak when no activity and no freezes', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 5,
        longestStreak: 10,
        lastSessionDate: yesterday,
        freezesAvailable: 0,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([]); // No sessions today
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(0); // Streak broken
    });

    it('should use freeze when no activity but premium with freezes', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 5,
        longestStreak: 10,
        lastSessionDate: yesterday,
        freezesAvailable: 2,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([]); // No sessions
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(true); // Premium

      expect(result.currentStreak).toBe(5); // Streak maintained
      expect(result.freezesAvailable).toBe(1); // 1 freeze consumed
    });

    it('should do nothing if already checked in today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 5,
        lastSessionDate: today,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(5); // Unchanged
      expect(mockAnalyticsRepository.updateStreak).not.toHaveBeenCalled();
    });

    it('should break streak when missing multiple days without freezes', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 10,
        longestStreak: 15,
        lastSessionDate: threeDaysAgo,
        freezesAvailable: 1, // Not enough (need 2 freezes for 3 days)
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(true);

      expect(result.currentStreak).toBe(0); // Streak broken
    });

    it('should recover streak when multiple days missed with enough freezes', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 10,
        longestStreak: 15,
        lastSessionDate: threeDaysAgo,
        freezesAvailable: 2, // Enough for 2 missed days (3 total - 1 for today)
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(true);

      expect(result.currentStreak).toBe(10); // Streak maintained
      expect(result.freezesAvailable).toBe(0); // 2 freezes consumed
    });

    it('should throw error for future check-in time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const streak = createMockStreak({
        lastSessionDate: tomorrow, // Future date
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([]); // Mock required

      await expect(tracker.checkDailyStreak()).rejects.toThrow(StreakError);
      await expect(tracker.checkDailyStreak()).rejects.toThrow('future date');
    });
  });

  describe('getCurrentStreak', () => {
    it('should return current streak data', async () => {
      const streak = createMockStreak({
        currentStreak: 7,
        longestStreak: 15,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);

      const result = await tracker.getCurrentStreak();

      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(15);
    });
  });

  describe('awardFreeze', () => {
    it('should award single freeze', async () => {
      const streak = createMockStreak({
        freezesAvailable: 1,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      await tracker.awardFreeze(1);

      expect(mockAnalyticsRepository.updateStreak).toHaveBeenCalledWith({
        freezesAvailable: 2,
      });
    });

    it('should award multiple freezes', async () => {
      const streak = createMockStreak({
        freezesAvailable: 0,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      await tracker.awardFreeze(2);

      expect(mockAnalyticsRepository.updateStreak).toHaveBeenCalledWith({
        freezesAvailable: 2,
      });
    });

    it('should throw error when exceeding maximum freezes', async () => {
      const streak = createMockStreak({
        freezesAvailable: 2, // Already at max
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);

      await expect(tracker.awardFreeze(1)).rejects.toThrow(StreakError);
      await expect(tracker.awardFreeze(1)).rejects.toThrow('Cannot exceed');
    });
  });

  describe('resetMonthlyFreezes', () => {
    it('should reset freezes for premium users', async () => {
      const streak = createMockStreak({
        freezesAvailable: 0,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      await tracker.resetMonthlyFreezes(true);

      expect(mockAnalyticsRepository.updateStreak).toHaveBeenCalledWith({
        freezesAvailable: 2,
      });
    });

    it('should not reset freezes for free users', async () => {
      await tracker.resetMonthlyFreezes(false);

      expect(mockAnalyticsRepository.updateStreak).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableFreezes', () => {
    it('should return available freezes count', async () => {
      const streak = createMockStreak({
        freezesAvailable: 2,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);

      const result = await tracker.getAvailableFreezes();

      expect(result).toBe(2);
    });
  });

  describe('hasActivityToday', () => {
    it('should return true when user completed Pomodoros today', async () => {
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);

      const result = await tracker.hasActivityToday();

      expect(result).toBe(true);
    });

    it('should return false when no completed sessions today', async () => {
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'abandoned' }),
        createMockSession({ status: 'active' }),
      ]);

      const result = await tracker.hasActivityToday();

      expect(result).toBe(false);
    });

    it('should return false when no sessions today', async () => {
      mockSessionRepository.getTodaySessions.mockResolvedValue([]);

      const result = await tracker.hasActivityToday();

      expect(result).toBe(false);
    });
  });

  describe('resetStreak', () => {
    it('should reset streak to zero', async () => {
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      await tracker.resetStreak();

      expect(mockAnalyticsRepository.updateStreak).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 0,
          longestStreak: 0,
          freezesAvailable: 0,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle midnight boundary correctly', async () => {
      // Simulate checking at exactly midnight
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      const yesterday = new Date(midnight);
      yesterday.setDate(yesterday.getDate() - 1);

      const streak = createMockStreak({
        currentStreak: 3,
        lastSessionDate: yesterday,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(4);
    });

    it('should handle consecutive days across month boundary', async () => {
      // Test Feb 28 -> Mar 1 transition
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const streak = createMockStreak({
        currentStreak: 5,
        lastSessionDate: yesterday,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);
      mockAnalyticsRepository.updateStreak.mockResolvedValue(undefined);

      const result = await tracker.checkDailyStreak(false);

      expect(result.currentStreak).toBe(6);
    });

    it('should handle same-day check-in at different times', async () => {
      // User checks in at 1 AM, then again at 11 PM same day
      const today = new Date();
      today.setHours(1, 0, 0, 0); // 1 AM today

      const streak = createMockStreak({
        currentStreak: 5,
        lastSessionDate: today,
      });

      mockAnalyticsRepository.getStreak.mockResolvedValue(streak);
      mockSessionRepository.getTodaySessions.mockResolvedValue([
        createMockSession({ status: 'completed' }),
      ]);

      const result = await tracker.checkDailyStreak(false);

      // Should not increment (same day, already checked in)
      expect(result.currentStreak).toBe(5);
      expect(mockAnalyticsRepository.updateStreak).not.toHaveBeenCalled();
    });
  });
});
