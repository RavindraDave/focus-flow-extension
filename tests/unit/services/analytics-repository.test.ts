/**
 * Unit Tests for AnalyticsRepository
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsRepository } from '../../../src/services/analytics-repository';
import { StorageService } from '../../../src/services/storage-service';
import { AnalyticsData, DailyStats, Achievement } from '../../../src/types/index';

// Mock StorageService
vi.mock('../../../src/services/storage-service');

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let mockStorageService: any;

  const createMockAnalytics = (overrides?: Partial<AnalyticsData>): AnalyticsData => {
    return {
      totalFocusTime: 0,
      totalPomodoros: 0,
      dailyStats: [],
      streak: {
        current: 0,
        longest: 0,
        lastCheckIn: new Date(),
        freezesAvailable: 0,
        freezesUsed: 0,
      },
      achievements: [],
      lastUpdated: new Date(),
      ...overrides,
    };
  };

  const createMockDailyStats = (date: Date, overrides?: Partial<DailyStats>): DailyStats => {
    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);

    return {
      date: cleanDate,
      focusTime: 0,
      pomodorosCompleted: 0,
      pomodorosAbandoned: 0,
      topTasks: [],
      blockedAttempts: 0,
      ...overrides,
    };
  };

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
    };

    repository = new AnalyticsRepository(mockStorageService);
  });

  describe('getAnalytics', () => {
    it('should return existing analytics', async () => {
      const mockAnalytics = createMockAnalytics({
        totalFocusTime: 100,
        totalPomodoros: 5,
      });

      mockStorageService.get.mockResolvedValue(mockAnalytics);

      const result = await repository.getAnalytics();

      expect(result.totalFocusTime).toBe(100);
      expect(result.totalPomodoros).toBe(5);
    });

    it('should create default analytics if not found', async () => {
      mockStorageService.get.mockResolvedValue(null);
      mockStorageService.set.mockResolvedValue(undefined);

      const result = await repository.getAnalytics();

      expect(result.totalFocusTime).toBe(0);
      expect(result.totalPomodoros).toBe(0);
      expect(result.dailyStats).toEqual([]);
      expect(mockStorageService.set).toHaveBeenCalled();
    });
  });

  describe('getTodayStats', () => {
    it('should return existing today\'s stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStats = createMockDailyStats(today, { focusTime: 50 });

      const analytics = createMockAnalytics({
        dailyStats: [todayStats],
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getTodayStats();

      expect(result.focusTime).toBe(50);
    });

    it('should create new stats for today if not found', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStats = createMockDailyStats(yesterday);

      const analytics = createMockAnalytics({
        dailyStats: [yesterdayStats],
      });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      const result = await repository.getTodayStats();

      expect(result.focusTime).toBe(0);
      expect(mockStorageService.set).toHaveBeenCalled();
    });
  });

  describe('updateTodayStats', () => {
    it('should update existing today\'s stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStats = createMockDailyStats(today, { pomodorosCompleted: 2 });

      const analytics = createMockAnalytics({
        dailyStats: [todayStats],
      });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateTodayStats({ pomodorosCompleted: 3 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.dailyStats[0].pomodorosCompleted).toBe(3);
    });

    it('should create new stats if today not found', async () => {
      const analytics = createMockAnalytics({ dailyStats: [] });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateTodayStats({ focusTime: 25 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.dailyStats.length).toBe(1);
      expect(savedAnalytics.dailyStats[0].focusTime).toBe(25);
    });
  });

  describe('addFocusTime', () => {
    it('should increment total focus time', async () => {
      const analytics = createMockAnalytics({ totalFocusTime: 50 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addFocusTime(25);

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalFocusTime).toBe(75);
    });
  });

  describe('addPomodoro', () => {
    it('should increment total Pomodoros by 1 (default)', async () => {
      const analytics = createMockAnalytics({ totalPomodoros: 5 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addPomodoro();

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalPomodoros).toBe(6);
    });

    it('should increment total Pomodoros by specified count', async () => {
      const analytics = createMockAnalytics({ totalPomodoros: 5 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addPomodoro(3);

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalPomodoros).toBe(8);
    });
  });

  describe('getStatsByDate', () => {
    it('should return stats for specific date', async () => {
      const date = new Date('2025-01-15');
      const stats = createMockDailyStats(date, { focusTime: 100 });

      const analytics = createMockAnalytics({ dailyStats: [stats] });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStatsByDate(new Date('2025-01-15'));

      expect(result).not.toBeNull();
      expect(result!.focusTime).toBe(100);
    });

    it('should return null if stats not found for date', async () => {
      const analytics = createMockAnalytics({ dailyStats: [] });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStatsByDate(new Date('2025-01-15'));

      expect(result).toBeNull();
    });
  });

  describe('getStatsByDateRange', () => {
    it('should return stats within date range', async () => {
      const stats = [
        createMockDailyStats(new Date('2025-01-01')),
        createMockDailyStats(new Date('2025-01-05')),
        createMockDailyStats(new Date('2025-01-10')),
      ];

      const analytics = createMockAnalytics({ dailyStats: stats });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStatsByDateRange(
        new Date('2025-01-04'),
        new Date('2025-01-11')
      );

      expect(result.length).toBe(2);
    });
  });

  describe('getStreak', () => {
    it('should return current streak data', async () => {
      const analytics = createMockAnalytics({
        streak: {
          current: 5,
          longest: 10,
          lastCheckIn: new Date(),
          freezesAvailable: 1,
          freezesUsed: 0,
        },
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStreak();

      expect(result.current).toBe(5);
      expect(result.longest).toBe(10);
    });
  });

  describe('updateStreak', () => {
    it('should update streak data', async () => {
      const analytics = createMockAnalytics({
        streak: {
          current: 5,
          longest: 10,
          lastCheckIn: new Date(),
          freezesAvailable: 0,
          freezesUsed: 0,
        },
      });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateStreak({ current: 6, longest: 11 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.streak.current).toBe(6);
      expect(savedAnalytics.streak.longest).toBe(11);
    });
  });

  describe('getAchievements', () => {
    it('should return all achievements', async () => {
      const achievements: Achievement[] = [
        {
          id: 'first-pomodoro',
          name: 'First Steps',
          description: 'Completed first Pomodoro',
          category: 'volume',
          icon: '🎯',
          unlockedAt: new Date(),
        },
      ];

      const analytics = createMockAnalytics({ achievements });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getAchievements();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('first-pomodoro');
    });
  });

  describe('addAchievement', () => {
    it('should add new achievement', async () => {
      const analytics = createMockAnalytics({ achievements: [] });

      const newAchievement: Achievement = {
        id: 'century',
        name: 'Century Club',
        description: 'Completed 100 Pomodoros',
        category: 'volume',
        icon: '💯',
        unlockedAt: new Date(),
      };

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addAchievement(newAchievement);

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.achievements.length).toBe(1);
      expect(savedAnalytics.achievements[0].id).toBe('century');
    });

    it('should not add duplicate achievement', async () => {
      const existing: Achievement = {
        id: 'century',
        name: 'Century Club',
        description: 'Completed 100 Pomodoros',
        category: 'volume',
        icon: '💯',
        unlockedAt: new Date(),
      };

      const analytics = createMockAnalytics({ achievements: [existing] });

      mockStorageService.get.mockResolvedValue(analytics);

      await repository.addAchievement(existing);

      // Should not call set if achievement already exists
      expect(mockStorageService.set).not.toHaveBeenCalled();
    });
  });

  describe('hasAchievement', () => {
    it('should return true if achievement unlocked', async () => {
      const achievement: Achievement = {
        id: 'test',
        name: 'Test',
        description: 'Test achievement',
        category: 'volume',
        icon: '🏆',
        unlockedAt: new Date(),
      };

      const analytics = createMockAnalytics({ achievements: [achievement] });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.hasAchievement('test');

      expect(result).toBe(true);
    });

    it('should return false if achievement not unlocked', async () => {
      const analytics = createMockAnalytics({ achievements: [] });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.hasAchievement('test');

      expect(result).toBe(false);
    });
  });

  describe('cleanupOldStats', () => {
    it('should remove stats older than 90 days', async () => {
      const today = new Date();
      const day91 = new Date(today);
      day91.setDate(day91.getDate() - 91);

      const stats = [
        createMockDailyStats(today),
        createMockDailyStats(day91), // This should be removed
      ];

      const analytics = createMockAnalytics({ dailyStats: stats });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.cleanupOldStats();

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.dailyStats.length).toBe(1);
    });

    it('should not update if no old stats to remove', async () => {
      const today = new Date();
      const stats = [createMockDailyStats(today)];

      const analytics = createMockAnalytics({ dailyStats: stats });

      mockStorageService.get.mockResolvedValue(analytics);

      await repository.cleanupOldStats();

      // Should not call set if nothing to clean
      expect(mockStorageService.set).not.toHaveBeenCalled();
    });
  });

  describe('resetAnalytics', () => {
    it('should reset all analytics to defaults', async () => {
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.resetAnalytics();

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalFocusTime).toBe(0);
      expect(savedAnalytics.totalPomodoros).toBe(0);
      expect(savedAnalytics.dailyStats).toEqual([]);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics as JSON', async () => {
      const analytics = createMockAnalytics({
        totalFocusTime: 100,
        totalPomodoros: 5,
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.exportAnalytics();

      expect(result).toContain('"totalFocusTime": 100');
      expect(result).toContain('"totalPomodoros": 5');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('getSummary', () => {
    it('should return analytics summary', async () => {
      const stats = [
        createMockDailyStats(new Date('2025-01-01'), {
          pomodorosCompleted: 4,
          focusTime: 100,
        }),
        createMockDailyStats(new Date('2025-01-02'), {
          pomodorosCompleted: 6,
          focusTime: 150,
        }),
      ];

      const analytics = createMockAnalytics({
        totalFocusTime: 250,
        totalPomodoros: 10,
        dailyStats: stats,
        streak: { current: 5, longest: 10, lastCheckIn: new Date(), freezesAvailable: 0, freezesUsed: 0 },
        achievements: [
          {
            id: 'test',
            name: 'Test',
            description: 'Test',
            category: 'volume',
            icon: '🏆',
            unlockedAt: new Date(),
          },
        ],
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getSummary();

      expect(result.totalFocusTime).toBe(250);
      expect(result.totalPomodoros).toBe(10);
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.totalDaysTracked).toBe(2);
      expect(result.totalAchievements).toBe(1);
      expect(result.averageDailyPomodoros).toBe(5); // (4+6)/2
      expect(result.averageDailyFocusTime).toBe(125); // (100+150)/2
    });
  });
});
