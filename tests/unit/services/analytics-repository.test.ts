/**
 * Unit Tests for AnalyticsRepository
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsRepository } from '../../../src/services/analytics-repository';
import { AnalyticsData, DailyStats, Achievement } from '../../../src/types/index';

// Mock StorageService
vi.mock('../../../src/services/storage-service');

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let mockStorageService: any;

  const createMockAnalytics = (overrides?: Partial<AnalyticsData>): AnalyticsData => {
    return {
      totalFocusTimeMinutes: 0,
      totalSessions: 0,
      totalBreaks: 0,
      dailyStats: [],
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: undefined,
        freezesAvailable: 0,
        todayCompleted: false,
      },
      achievements: [],
      ...overrides,
    };
  };

  const createMockDailyStats = (date: Date, overrides?: Partial<DailyStats>): DailyStats => {
    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);

    return {
      date: cleanDate,
      focusTimeMinutes: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      breaksTaken: 0,
      sessionsByCategory: {},
      mostProductiveHour: undefined,
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
        totalFocusTimeMinutes: 100,
        totalSessions: 5,
      });

      mockStorageService.get.mockResolvedValue(mockAnalytics);

      const result = await repository.getAnalytics();

      expect(result.totalFocusTimeMinutes).toBe(100);
      expect(result.totalSessions).toBe(5);
    });

    it('should create default analytics if not found', async () => {
      mockStorageService.get.mockResolvedValue(null);
      mockStorageService.set.mockResolvedValue(undefined);

      const result = await repository.getAnalytics();

      expect(result.totalFocusTimeMinutes).toBe(0);
      expect(result.totalSessions).toBe(0);
      expect(result.dailyStats).toEqual([]);
      expect(mockStorageService.set).toHaveBeenCalled();
    });
  });

  describe('getTodayStats', () => {
    it('should return existing today\'s stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStats = createMockDailyStats(today, { focusTimeMinutes: 50 });

      const analytics = createMockAnalytics({
        dailyStats: [todayStats],
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getTodayStats();

      expect(result.focusTimeMinutes).toBe(50);
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

      expect(result.focusTimeMinutes).toBe(0);
      expect(mockStorageService.set).toHaveBeenCalled();
    });
  });

  describe('updateTodayStats', () => {
    it('should update existing today\'s stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStats = createMockDailyStats(today, { completedSessions: 2 });

      const analytics = createMockAnalytics({
        dailyStats: [todayStats],
      });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateTodayStats({ completedSessions: 3 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.dailyStats[0].completedSessions).toBe(3);
    });

    it('should create new stats if today not found', async () => {
      const analytics = createMockAnalytics({ dailyStats: [] });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateTodayStats({ focusTimeMinutes: 25 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.dailyStats.length).toBe(1);
      expect(savedAnalytics.dailyStats[0].focusTimeMinutes).toBe(25);
    });
  });

  describe('addFocusTime', () => {
    it('should increment total focus time', async () => {
      const analytics = createMockAnalytics({ totalFocusTimeMinutes: 50 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addFocusTime(25);

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalFocusTimeMinutes).toBe(75);
    });
  });

  describe('addPomodoro', () => {
    it('should increment total Pomodoros by 1 (default)', async () => {
      const analytics = createMockAnalytics({ totalSessions: 5 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addPomodoro();

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalSessions).toBe(6);
    });

    it('should increment total Pomodoros by specified count', async () => {
      const analytics = createMockAnalytics({ totalSessions: 5 });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addPomodoro(3);

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.totalSessions).toBe(8);
    });
  });

  describe('getStatsByDate', () => {
    it('should return stats for specific date', async () => {
      const date = new Date('2025-01-15');
      const stats = createMockDailyStats(date, { focusTimeMinutes: 100 });

      const analytics = createMockAnalytics({ dailyStats: [stats] });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStatsByDate(new Date('2025-01-15'));

      expect(result).not.toBeNull();
      expect(result!.focusTimeMinutes).toBe(100);
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
          currentStreak: 5,
          longestStreak: 10,
          lastSessionDate: new Date(),
          freezesAvailable: 1,
          todayCompleted: false,
        },
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getStreak();

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
    });
  });

  describe('updateStreak', () => {
    it('should update streak data', async () => {
      const analytics = createMockAnalytics({
        streak: {
          currentStreak: 5,
          longestStreak: 10,
          lastSessionDate: new Date(),
          freezesAvailable: 0,
          todayCompleted: false,
        },
      });

      mockStorageService.get.mockResolvedValue(analytics);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateStreak({ currentStreak: 6, longestStreak: 11 });

      const savedAnalytics = mockStorageService.set.mock.calls[0][1];
      expect(savedAnalytics.streak.currentStreak).toBe(6);
      expect(savedAnalytics.streak.longestStreak).toBe(11);
    });
  });

  describe('getAchievements', () => {
    it('should return all achievements', async () => {
      const achievements: Achievement[] = [
        {
          id: 'first-pomodoro',
          name: 'First Steps',
          description: 'Completed first Pomodoro',
          category: 'sessions',
          icon: '🎯',
          unlockedAt: new Date(),
        },
      ];

      const analytics = createMockAnalytics({ achievements });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.getAchievements();

      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe('first-pomodoro');
    });
  });

  describe('addAchievement', () => {
    it('should add new achievement', async () => {
      const analytics = createMockAnalytics({ achievements: [] });

      const newAchievement: Achievement = {
        id: 'century',
        name: 'Century Club',
        description: 'Completed 100 Pomodoros',
        category: 'sessions',
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
        category: 'sessions',
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
        category: 'sessions',
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
      expect(savedAnalytics.totalFocusTimeMinutes).toBe(0);
      expect(savedAnalytics.totalSessions).toBe(0);
      expect(savedAnalytics.dailyStats).toEqual([]);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics as JSON', async () => {
      const analytics = createMockAnalytics({
        totalFocusTimeMinutes: 100,
        totalSessions: 5,
      });

      mockStorageService.get.mockResolvedValue(analytics);

      const result = await repository.exportAnalytics();

      expect(result).toContain('"totalFocusTimeMinutes": 100');
      expect(result).toContain('"totalSessions": 5');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('getSummary', () => {
    it('should return analytics summary', async () => {
      const stats = [
        createMockDailyStats(new Date('2025-01-01'), {
          completedSessions: 4,
          focusTimeMinutes: 100,
        }),
        createMockDailyStats(new Date('2025-01-02'), {
          completedSessions: 6,
          focusTimeMinutes: 150,
        }),
      ];

      const analytics = createMockAnalytics({
        totalFocusTimeMinutes: 250,
        totalSessions: 10,
        dailyStats: stats,
        streak: { currentStreak: 5, longestStreak: 10, lastSessionDate: new Date(), freezesAvailable: 0, todayCompleted: false },
        achievements: [
          {
            id: 'test',
            name: 'Test',
            description: 'Test',
            category: 'sessions',
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
