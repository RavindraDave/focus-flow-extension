/**
 * Unit Tests for AnalyticsTracker
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsTracker, AnalyticsError } from '../../../src/background/analytics-tracker';
import { AnalyticsRepository } from '../../../src/services/analytics-repository';
import { SessionRepository } from '../../../src/services/session-repository';
import { PomodoroSession, DailyStats, AnalyticsData } from '../../../src/types/index';

// Mock repositories
vi.mock('../../../src/services/analytics-repository');
vi.mock('../../../src/services/session-repository');

describe('AnalyticsTracker', () => {
  let tracker: AnalyticsTracker;
  let mockAnalyticsRepository: any;
  let mockSessionRepository: any;

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

  const createMockDailyStats = (overrides?: Partial<DailyStats>): DailyStats => {
    return {
      date: new Date(),
      focusTime: 0,
      pomodorosCompleted: 0,
      pomodorosAbandoned: 0,
      topTasks: [],
      blockedAttempts: 0,
      ...overrides,
    };
  };

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

  beforeEach(() => {
    mockAnalyticsRepository = {
      getTodayStats: vi.fn(),
      updateTodayStats: vi.fn(),
      addFocusTime: vi.fn(),
      addPomodoro: vi.fn(),
      getAnalytics: vi.fn(),
      addAchievement: vi.fn(),
      hasAchievement: vi.fn(),
      getStatsByDateRange: vi.fn(),
      resetAnalytics: vi.fn(),
    };

    mockSessionRepository = {
      getSessionHistory: vi.fn(),
      getSessionsByDateRange: vi.fn(),
    };

    tracker = new AnalyticsTracker(mockAnalyticsRepository, mockSessionRepository);
    vi.clearAllMocks();
  });

  describe('trackSessionCompletion', () => {
    it('should update daily stats and totals for completed session', async () => {
      const session = createMockSession({
        taskName: 'Write Code',
        actualDuration: 25,
      });

      const todayStats = createMockDailyStats({
        focusTime: 50,
        pomodorosCompleted: 2,
        topTasks: [],
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(createMockAnalytics());
      mockAnalyticsRepository.hasAchievement.mockResolvedValue(true); // No new achievements

      await tracker.trackSessionCompletion(session);

      expect(mockAnalyticsRepository.updateTodayStats).toHaveBeenCalledWith({
        focusTime: 75, // 50 + 25
        pomodorosCompleted: 3, // 2 + 1
        topTasks: [{ task: 'Write Code', count: 1 }],
      });

      expect(mockAnalyticsRepository.addFocusTime).toHaveBeenCalledWith(25);
      expect(mockAnalyticsRepository.addPomodoro).toHaveBeenCalledWith(1);
    });

    it('should throw error for non-completed session', async () => {
      const session = createMockSession({ status: 'active' });

      await expect(tracker.trackSessionCompletion(session)).rejects.toThrow(
        AnalyticsError
      );
      await expect(tracker.trackSessionCompletion(session)).rejects.toThrow(
        'only track completed sessions'
      );
    });

    it('should update top tasks correctly', async () => {
      const session = createMockSession({ taskName: 'Task A' });

      const todayStats = createMockDailyStats({
        topTasks: [
          { task: 'Task B', count: 3 },
          { task: 'Task A', count: 1 },
        ],
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(createMockAnalytics());
      mockAnalyticsRepository.hasAchievement.mockResolvedValue(true);

      await tracker.trackSessionCompletion(session);

      const updatedTopTasks = mockAnalyticsRepository.updateTodayStats.mock.calls[0][0]
        .topTasks;

      expect(updatedTopTasks).toEqual([
        { task: 'Task B', count: 3 },
        { task: 'Task A', count: 2 }, // Incremented
      ]);
    });

    it('should limit top tasks to 3', async () => {
      const session = createMockSession({ taskName: 'Task D' });

      const todayStats = createMockDailyStats({
        topTasks: [
          { task: 'Task A', count: 5 },
          { task: 'Task B', count: 3 },
          { task: 'Task C', count: 2 },
        ],
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(createMockAnalytics());
      mockAnalyticsRepository.hasAchievement.mockResolvedValue(true);

      await tracker.trackSessionCompletion(session);

      const updatedTopTasks = mockAnalyticsRepository.updateTodayStats.mock.calls[0][0]
        .topTasks;

      expect(updatedTopTasks.length).toBe(3);
      expect(updatedTopTasks).toEqual([
        { task: 'Task A', count: 5 },
        { task: 'Task B', count: 3 },
        { task: 'Task C', count: 2 },
      ]);
    });
  });

  describe('trackSessionAbandonment', () => {
    it('should update daily stats for abandoned session', async () => {
      const session = createMockSession({ status: 'abandoned' });

      const todayStats = createMockDailyStats({
        pomodorosAbandoned: 1,
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);

      await tracker.trackSessionAbandonment(session);

      expect(mockAnalyticsRepository.updateTodayStats).toHaveBeenCalledWith({
        pomodorosAbandoned: 2, // 1 + 1
      });
    });

    it('should throw error for non-abandoned session', async () => {
      const session = createMockSession({ status: 'completed' });

      await expect(tracker.trackSessionAbandonment(session)).rejects.toThrow(
        AnalyticsError
      );
    });
  });

  describe('trackBlockedAttempt', () => {
    it('should increment blocked attempts counter', async () => {
      const todayStats = createMockDailyStats({
        blockedAttempts: 5,
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);

      await tracker.trackBlockedAttempt();

      expect(mockAnalyticsRepository.updateTodayStats).toHaveBeenCalledWith({
        blockedAttempts: 6, // 5 + 1
      });
    });
  });

  describe('calculateFocusScore', () => {
    it('should calculate perfect score (100)', async () => {
      // Perfect scenario: 100% completion, 7/7 days active, 30+ day streak
      const sessions = [
        ...Array(20).fill(null).map(() => createMockSession({ status: 'completed' })),
      ];

      const recentStats = Array(7)
        .fill(null)
        .map(() => createMockDailyStats({ pomodorosCompleted: 3 }));

      const analytics = createMockAnalytics({
        streak: { current: 30, longest: 30, lastCheckIn: new Date(), freezesAvailable: 0, freezesUsed: 0 },
      });

      mockSessionRepository.getSessionHistory.mockResolvedValue(sessions);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue(recentStats);

      const score = await tracker.calculateFocusScore();

      expect(score).toBe(100);
    });

    it('should calculate score with mixed completion rate', async () => {
      // 70% completion rate, 5/7 days active, 10-day streak
      const sessions = [
        ...Array(7).fill(null).map(() => createMockSession({ status: 'completed' })),
        ...Array(3).fill(null).map(() => createMockSession({ status: 'abandoned' })),
      ];

      const recentStats = [
        ...Array(5).fill(null).map(() => createMockDailyStats({ pomodorosCompleted: 2 })),
        ...Array(2).fill(null).map(() => createMockDailyStats({ pomodorosCompleted: 0 })),
      ];

      const analytics = createMockAnalytics({
        streak: { current: 10, longest: 15, lastCheckIn: new Date(), freezesAvailable: 0, freezesUsed: 0 },
      });

      mockSessionRepository.getSessionHistory.mockResolvedValue(sessions);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue(recentStats);

      const score = await tracker.calculateFocusScore();

      // Expected: (0.7 * 40) + (5/7 * 30) + (10/30 * 30) = 28 + 21.4 + 10 = 59.4 ≈ 59
      expect(score).toBeGreaterThanOrEqual(55);
      expect(score).toBeLessThanOrEqual(65);
    });

    it('should return 0 for no activity', async () => {
      mockSessionRepository.getSessionHistory.mockResolvedValue([]);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(createMockAnalytics());
      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue([]);

      const score = await tracker.calculateFocusScore();

      expect(score).toBe(0);
    });
  });

  describe('getProductivitySummary', () => {
    it('should aggregate stats for date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      const dailyStats = [
        createMockDailyStats({
          date: new Date('2025-01-01'),
          pomodorosCompleted: 5,
          focusTime: 125,
          topTasks: [{ task: 'Coding', count: 3 }],
        }),
        createMockDailyStats({
          date: new Date('2025-01-02'),
          pomodorosCompleted: 3,
          focusTime: 75,
          topTasks: [{ task: 'Reading', count: 2 }],
        }),
      ];

      const sessions = [
        ...Array(8).fill(null).map(() => createMockSession({ status: 'completed' })),
        ...Array(2).fill(null).map(() => createMockSession({ status: 'abandoned' })),
      ];

      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue(dailyStats);
      mockSessionRepository.getSessionsByDateRange.mockResolvedValue(sessions);

      const summary = await tracker.getProductivitySummary(startDate, endDate);

      expect(summary.totalPomodoros).toBe(8); // 5 + 3
      expect(summary.totalFocusTime).toBe(200); // 125 + 75
      expect(summary.averagePerDay).toBe(4); // 8 / 2 days
      expect(summary.completionRate).toBe(0.8); // 8 / (8 + 2)
      expect(summary.topTasks.length).toBeGreaterThan(0);
    });
  });

  describe('getWeeklySummary', () => {
    it('should return summary for last 7 days', async () => {
      const dailyStats = Array(7)
        .fill(null)
        .map(() => createMockDailyStats({ pomodorosCompleted: 2, focusTime: 50 }));

      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue(dailyStats);
      mockSessionRepository.getSessionsByDateRange.mockResolvedValue([]);

      const summary = await tracker.getWeeklySummary();

      expect(summary.totalPomodoros).toBe(14); // 2 * 7
      expect(summary.totalFocusTime).toBe(350); // 50 * 7
    });
  });

  describe('getMonthlySummary', () => {
    it('should return summary for last 30 days', async () => {
      const dailyStats = Array(30)
        .fill(null)
        .map(() => createMockDailyStats({ pomodorosCompleted: 3, focusTime: 75 }));

      mockAnalyticsRepository.getStatsByDateRange.mockResolvedValue(dailyStats);
      mockSessionRepository.getSessionsByDateRange.mockResolvedValue([]);

      const summary = await tracker.getMonthlySummary();

      expect(summary.totalPomodoros).toBe(90); // 3 * 30
      expect(summary.totalFocusTime).toBe(2250); // 75 * 30
    });
  });

  describe('Achievement Tracking', () => {
    it('should award "First Pomodoro" achievement', async () => {
      const session = createMockSession();
      const todayStats = createMockDailyStats();

      const analytics = createMockAnalytics({
        totalPomodoros: 1, // First Pomodoro
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.hasAchievement.mockResolvedValue(false); // Not yet awarded
      mockAnalyticsRepository.addAchievement.mockResolvedValue(undefined);

      await tracker.trackSessionCompletion(session);

      expect(mockAnalyticsRepository.addAchievement).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'first-pomodoro',
          name: 'First Pomodoro',
        })
      );
    });

    it('should award "Century Club" achievement at 100 Pomodoros', async () => {
      const session = createMockSession();
      const todayStats = createMockDailyStats();

      const analytics = createMockAnalytics({
        totalPomodoros: 100,
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.hasAchievement.mockImplementation((id: string) =>
        Promise.resolve(id !== 'century-club')
      );
      mockAnalyticsRepository.addAchievement.mockResolvedValue(undefined);

      await tracker.trackSessionCompletion(session);

      expect(mockAnalyticsRepository.addAchievement).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'century-club',
          name: 'Century Club',
        })
      );
    });

    it('should award "Streak Warrior" at 7-day streak', async () => {
      const session = createMockSession();
      const todayStats = createMockDailyStats();

      const analytics = createMockAnalytics({
        streak: { current: 7, longest: 7, lastCheckIn: new Date(), freezesAvailable: 0, freezesUsed: 0 },
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.hasAchievement.mockImplementation((id: string) =>
        Promise.resolve(id !== 'streak-warrior')
      );
      mockAnalyticsRepository.addAchievement.mockResolvedValue(undefined);

      await tracker.trackSessionCompletion(session);

      expect(mockAnalyticsRepository.addAchievement).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'streak-warrior',
          name: 'Streak Warrior',
        })
      );
    });

    it('should not re-award existing achievements', async () => {
      const session = createMockSession();
      const todayStats = createMockDailyStats();

      const analytics = createMockAnalytics({
        totalPomodoros: 100,
      });

      mockAnalyticsRepository.getTodayStats.mockResolvedValue(todayStats);
      mockAnalyticsRepository.updateTodayStats.mockResolvedValue(undefined);
      mockAnalyticsRepository.addFocusTime.mockResolvedValue(undefined);
      mockAnalyticsRepository.addPomodoro.mockResolvedValue(undefined);
      mockAnalyticsRepository.getAnalytics.mockResolvedValue(analytics);
      mockAnalyticsRepository.hasAchievement.mockResolvedValue(true); // Already has all achievements
      mockAnalyticsRepository.addAchievement.mockResolvedValue(undefined);

      await tracker.trackSessionCompletion(session);

      expect(mockAnalyticsRepository.addAchievement).not.toHaveBeenCalled();
    });
  });

  describe('resetAnalytics', () => {
    it('should reset all analytics', async () => {
      mockAnalyticsRepository.resetAnalytics.mockResolvedValue(undefined);

      await tracker.resetAnalytics();

      expect(mockAnalyticsRepository.resetAnalytics).toHaveBeenCalled();
    });
  });
});
