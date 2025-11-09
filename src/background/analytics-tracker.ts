/**
 * Analytics Tracker
 * Focus Flow Extension
 *
 * Aggregates session data into daily analytics and calculates focus scores.
 * Tracks productivity metrics and top tasks.
 */

import { AnalyticsRepository } from '../services/analytics-repository';
import { SessionRepository } from '../services/session-repository';
import { PomodoroSession, DailyStats, Achievement } from '../types/index';

/**
 * Error class for analytics tracking violations
 */
export class AnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

/**
 * Manager for analytics aggregation and focus score calculation
 *
 * @example
 * ```typescript
 * const tracker = new AnalyticsTracker();
 * await tracker.trackSessionCompletion(session);
 * const score = await tracker.calculateFocusScore();
 * ```
 */
export class AnalyticsTracker {
  private analyticsRepository: AnalyticsRepository;
  private sessionRepository: SessionRepository;

  // Focus score weights
  private static readonly COMPLETION_WEIGHT = 0.4; // 40% weight on completion rate
  private static readonly CONSISTENCY_WEIGHT = 0.3; // 30% weight on daily consistency
  private static readonly STREAK_WEIGHT = 0.3; // 30% weight on streak

  // Achievement thresholds
  private static readonly ACHIEVEMENT_THRESHOLDS = {
    FIRST_POMODORO: 1,
    POMODORO_MASTER: 100,
    CENTURY_CLUB: 100,
    STREAK_WARRIOR: 7,
    MARATHON_RUNNER: 30,
    FOCUS_BEAST: 1000, // 1000 minutes = ~16.7 hours
  };

  constructor(
    analyticsRepository?: AnalyticsRepository,
    sessionRepository?: SessionRepository
  ) {
    this.analyticsRepository = analyticsRepository || new AnalyticsRepository();
    this.sessionRepository = sessionRepository || new SessionRepository();
  }

  /**
   * Track completed Pomodoro session
   *
   * Updates daily stats, total counters, and checks for achievements.
   *
   * @param session - Completed session to track
   */
  async trackSessionCompletion(session: PomodoroSession): Promise<void> {
    if (session.status !== 'completed') {
      throw new AnalyticsError('Can only track completed sessions');
    }

    // Get today's stats
    const todayStats = await this.analyticsRepository.getTodayStats();

    // Calculate actual duration (in minutes)
    const durationMinutes = session.actualDuration || session.duration;

    // Update today's stats
    await this.analyticsRepository.updateTodayStats({
      focusTime: todayStats.focusTime + durationMinutes,
      pomodorosCompleted: todayStats.pomodorosCompleted + 1,
      topTasks: this.updateTopTasks(todayStats.topTasks, session.taskName),
    });

    // Update total counters
    await this.analyticsRepository.addFocusTime(durationMinutes);
    await this.analyticsRepository.addPomodoro(1);

    // Check for achievements
    await this.checkAchievements();
  }

  /**
   * Track abandoned session
   *
   * Updates daily stats with abandon count.
   *
   * @param session - Abandoned session to track
   */
  async trackSessionAbandonment(session: PomodoroSession): Promise<void> {
    if (session.status !== 'abandoned') {
      throw new AnalyticsError('Can only track abandoned sessions');
    }

    const todayStats = await this.analyticsRepository.getTodayStats();

    await this.analyticsRepository.updateTodayStats({
      pomodorosAbandoned: todayStats.pomodorosAbandoned + 1,
    });
  }

  /**
   * Track blocked website attempt
   *
   * Increments blocked attempts counter for today.
   */
  async trackBlockedAttempt(): Promise<void> {
    const todayStats = await this.analyticsRepository.getTodayStats();

    await this.analyticsRepository.updateTodayStats({
      blockedAttempts: todayStats.blockedAttempts + 1,
    });
  }

  /**
   * Calculate focus score (0-100)
   *
   * Formula:
   * - 40% Completion Rate (completed / (completed + abandoned))
   * - 30% Consistency (days with activity in last 7 days)
   * - 30% Streak (current streak / 30, capped at 100%)
   *
   * @returns Focus score between 0 and 100
   */
  async calculateFocusScore(): Promise<number> {
    const analytics = await this.analyticsRepository.getAnalytics();
    const sessions = await this.sessionRepository.getSessionHistory();

    // 1. Completion Rate (40%)
    const completedCount = sessions.filter(s => s.status === 'completed').length;
    const abandonedCount = sessions.filter(s => s.status === 'abandoned').length;
    const totalRelevant = completedCount + abandonedCount;
    const completionRate = totalRelevant > 0 ? completedCount / totalRelevant : 0;
    const completionScore = completionRate * 100 * AnalyticsTracker.COMPLETION_WEIGHT;

    // 2. Consistency (30%) - Days with activity in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentStats = await this.analyticsRepository.getStatsByDateRange(
      sevenDaysAgo,
      new Date()
    );
    const activeDays = recentStats.filter(s => s.pomodorosCompleted > 0).length;
    const consistencyRate = activeDays / 7;
    const consistencyScore = consistencyRate * 100 * AnalyticsTracker.CONSISTENCY_WEIGHT;

    // 3. Streak (30%) - Current streak / 30 days (capped at 100%)
    const streakRate = Math.min(analytics.streak.current / 30, 1);
    const streakScore = streakRate * 100 * AnalyticsTracker.STREAK_WEIGHT;

    // Total score
    const focusScore = Math.round(completionScore + consistencyScore + streakScore);

    return Math.min(100, Math.max(0, focusScore));
  }

  /**
   * Get productivity summary for date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Summary statistics
   */
  async getProductivitySummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPomodoros: number;
    totalFocusTime: number;
    averagePerDay: number;
    completionRate: number;
    topTasks: Array<{ task: string; count: number }>;
  }> {
    const dailyStats = await this.analyticsRepository.getStatsByDateRange(
      startDate,
      endDate
    );

    const sessions = await this.sessionRepository.getSessionsByDateRange(
      startDate,
      endDate
    );

    const totalPomodoros = dailyStats.reduce(
      (sum, s) => sum + s.pomodorosCompleted,
      0
    );
    const totalFocusTime = dailyStats.reduce((sum, s) => sum + s.focusTime, 0);

    const dayCount = dailyStats.length || 1;
    const averagePerDay = totalPomodoros / dayCount;

    const completedCount = sessions.filter(s => s.status === 'completed').length;
    const abandonedCount = sessions.filter(s => s.status === 'abandoned').length;
    const totalRelevant = completedCount + abandonedCount;
    const completionRate = totalRelevant > 0 ? completedCount / totalRelevant : 0;

    // Aggregate top tasks from all days
    const taskCounts = new Map<string, number>();
    dailyStats.forEach(stat => {
      stat.topTasks.forEach(task => {
        taskCounts.set(task.task, (taskCounts.get(task.task) || 0) + task.count);
      });
    });

    const topTasks = Array.from(taskCounts.entries())
      .map(([task, count]) => ({ task, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 tasks

    return {
      totalPomodoros,
      totalFocusTime,
      averagePerDay,
      completionRate,
      topTasks,
    };
  }

  /**
   * Get weekly summary (last 7 days)
   *
   * @returns Weekly productivity summary
   */
  async getWeeklySummary(): Promise<ReturnType<typeof this.getProductivitySummary>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await this.getProductivitySummary(startDate, endDate);
  }

  /**
   * Get monthly summary (last 30 days)
   *
   * @returns Monthly productivity summary
   */
  async getMonthlySummary(): Promise<ReturnType<typeof this.getProductivitySummary>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return await this.getProductivitySummary(startDate, endDate);
  }

  /**
   * Update top tasks list with new task
   *
   * Maintains top 3 tasks sorted by count.
   *
   * @param topTasks - Current top tasks
   * @param taskName - Task name to add/update
   * @returns Updated top tasks list
   * @private
   */
  private updateTopTasks(
    topTasks: Array<{ task: string; count: number }>,
    taskName: string
  ): Array<{ task: string; count: number }> {
    // Find existing task
    const existing = topTasks.find(t => t.task === taskName);

    let updated: Array<{ task: string; count: number }>;

    if (existing) {
      // Increment count
      updated = topTasks.map(t =>
        t.task === taskName ? { ...t, count: t.count + 1 } : t
      );
    } else {
      // Add new task
      updated = [...topTasks, { task: taskName, count: 1 }];
    }

    // Sort by count (descending) and keep top 3
    return updated.sort((a, b) => b.count - a.count).slice(0, 3);
  }

  /**
   * Check and award achievements
   *
   * Checks all achievement thresholds and awards new achievements.
   *
   * @private
   */
  private async checkAchievements(): Promise<void> {
    const analytics = await this.analyticsRepository.getAnalytics();

    // First Pomodoro
    if (
      analytics.totalPomodoros === 1 &&
      !(await this.analyticsRepository.hasAchievement('first-pomodoro'))
    ) {
      await this.awardAchievement({
        id: 'first-pomodoro',
        name: 'First Pomodoro',
        description: 'Complete your first Pomodoro session',
        icon: '🍅',
        unlockedAt: new Date(),
      });
    }

    // Century Club (100 Pomodoros)
    if (
      analytics.totalPomodoros >= AnalyticsTracker.ACHIEVEMENT_THRESHOLDS.CENTURY_CLUB &&
      !(await this.analyticsRepository.hasAchievement('century-club'))
    ) {
      await this.awardAchievement({
        id: 'century-club',
        name: 'Century Club',
        description: 'Complete 100 Pomodoro sessions',
        icon: '💯',
        unlockedAt: new Date(),
      });
    }

    // Streak Warrior (7-day streak)
    if (
      analytics.streak.current >= AnalyticsTracker.ACHIEVEMENT_THRESHOLDS.STREAK_WARRIOR &&
      !(await this.analyticsRepository.hasAchievement('streak-warrior'))
    ) {
      await this.awardAchievement({
        id: 'streak-warrior',
        name: 'Streak Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        unlockedAt: new Date(),
      });
    }

    // Marathon Runner (30-day streak)
    if (
      analytics.streak.current >= AnalyticsTracker.ACHIEVEMENT_THRESHOLDS.MARATHON_RUNNER &&
      !(await this.analyticsRepository.hasAchievement('marathon-runner'))
    ) {
      await this.awardAchievement({
        id: 'marathon-runner',
        name: 'Marathon Runner',
        description: 'Maintain a 30-day streak',
        icon: '🏃',
        unlockedAt: new Date(),
      });
    }

    // Focus Beast (1000+ minutes)
    if (
      analytics.totalFocusTime >= AnalyticsTracker.ACHIEVEMENT_THRESHOLDS.FOCUS_BEAST &&
      !(await this.analyticsRepository.hasAchievement('focus-beast'))
    ) {
      await this.awardAchievement({
        id: 'focus-beast',
        name: 'Focus Beast',
        description: 'Accumulate 1000 minutes of focus time',
        icon: '🦁',
        unlockedAt: new Date(),
      });
    }
  }

  /**
   * Award achievement to user
   *
   * @param achievement - Achievement to award
   * @private
   */
  private async awardAchievement(achievement: Achievement): Promise<void> {
    await this.analyticsRepository.addAchievement(achievement);
    console.info(`🎉 Achievement unlocked: ${achievement.name}`);
  }

  /**
   * Reset all analytics (admin/testing function)
   *
   * Use with caution - typically for testing or data deletion.
   */
  async resetAnalytics(): Promise<void> {
    await this.analyticsRepository.resetAnalytics();
  }
}
