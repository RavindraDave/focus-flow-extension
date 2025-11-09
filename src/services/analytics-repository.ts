/**
 * Analytics Repository
 * Focus Flow Extension
 *
 * Manages AnalyticsData persistence including daily stats, streak data,
 * and achievements.
 */

import { StorageService } from './storage-service';
import {
  AnalyticsData,
  DailyStats,
  StreakData,
  Achievement,
} from '../types/index';
import {
  AnalyticsDataSchema,
  DailyStatsSchema,
  StreakDataSchema,
  AchievementSchema,
} from '../types/schemas';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../utils/constants';
import { z } from 'zod';

/**
 * Repository for managing analytics data
 *
 * Responsibilities:
 * - CRUD for analytics data
 * - Daily stats aggregation
 * - Streak tracking
 * - Achievement management
 * - Cleanup old stats (90 days retention)
 *
 * @example
 * ```typescript
 * const repo = new AnalyticsRepository();
 * const today = await repo.getTodayStats();
 * await repo.updateTodayStats({ pomodorosCompleted: today.pomodorosCompleted + 1 });
 * ```
 */
export class AnalyticsRepository {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * Get all analytics data
   *
   * Initializes with default values if not found.
   *
   * @returns Complete analytics data
   */
  async getAnalytics(): Promise<AnalyticsData> {
    let analytics = await this.storageService.get(
      STORAGE_KEYS.ANALYTICS,
      AnalyticsDataSchema
    );

    if (!analytics) {
      analytics = this.createDefaultAnalytics();
      await this.storageService.set(
        STORAGE_KEYS.ANALYTICS,
        analytics,
        AnalyticsDataSchema,
        { debounce: false }
      );
    }

    return analytics;
  }

  /**
   * Get today's daily stats
   *
   * Creates new entry if doesn't exist for today.
   *
   * @returns Today's daily stats
   */
  async getTodayStats(): Promise<DailyStats> {
    const analytics = await this.getAnalytics();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's stats
    let todayStats = analytics.dailyStats.find((s) => {
      const statDate = new Date(s.date);
      statDate.setHours(0, 0, 0, 0);
      return statDate.getTime() === today.getTime();
    });

    // Create if doesn't exist
    if (!todayStats) {
      todayStats = this.createDailyStats(today);
      analytics.dailyStats.push(todayStats);

      await this.storageService.set(
        STORAGE_KEYS.ANALYTICS,
        analytics,
        AnalyticsDataSchema
      );
    }

    return todayStats;
  }

  /**
   * Update today's daily stats
   *
   * @param updates - Partial daily stats to update
   */
  async updateTodayStats(updates: Partial<DailyStats>): Promise<void> {
    const analytics = await this.getAnalytics();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's stats
    const index = analytics.dailyStats.findIndex((s) => {
      const statDate = new Date(s.date);
      statDate.setHours(0, 0, 0, 0);
      return statDate.getTime() === today.getTime();
    });

    if (index === -1) {
      // Create new entry
      const newStats = {
        ...this.createDailyStats(today),
        ...updates,
      };
      analytics.dailyStats.push(newStats);
    } else {
      // Update existing
      analytics.dailyStats[index] = {
        ...analytics.dailyStats[index],
        ...updates,
      };
    }

    // Update lastUpdated timestamp
    analytics.lastUpdated = new Date();

    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      analytics,
      AnalyticsDataSchema
    );
  }

  /**
   * Increment total focus time
   *
   * @param minutes - Minutes to add
   */
  async addFocusTime(minutes: number): Promise<void> {
    const analytics = await this.getAnalytics();
    analytics.totalFocusTime += minutes;
    analytics.lastUpdated = new Date();

    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      analytics,
      AnalyticsDataSchema
    );
  }

  /**
   * Increment total Pomodoros count
   *
   * @param count - Number to add (default 1)
   */
  async addPomodoro(count: number = 1): Promise<void> {
    const analytics = await this.getAnalytics();
    analytics.totalPomodoros += count;
    analytics.lastUpdated = new Date();

    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      analytics,
      AnalyticsDataSchema
    );
  }

  /**
   * Get daily stats for a specific date
   *
   * @param date - Date to get stats for
   * @returns Daily stats or null if not found
   */
  async getStatsByDate(date: Date): Promise<DailyStats | null> {
    const analytics = await this.getAnalytics();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return (
      analytics.dailyStats.find((s) => {
        const statDate = new Date(s.date);
        statDate.setHours(0, 0, 0, 0);
        return statDate.getTime() === targetDate.getTime();
      }) || null
    );
  }

  /**
   * Get daily stats for date range
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Array of daily stats
   */
  async getStatsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> {
    const analytics = await this.getAnalytics();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return analytics.dailyStats.filter((s) => {
      const statDate = new Date(s.date);
      return statDate >= start && statDate <= end;
    });
  }

  /**
   * Get streak data
   *
   * @returns Current streak data
   */
  async getStreak(): Promise<StreakData> {
    const analytics = await this.getAnalytics();
    return analytics.streak;
  }

  /**
   * Update streak data
   *
   * @param updates - Partial streak data to update
   */
  async updateStreak(updates: Partial<StreakData>): Promise<void> {
    const analytics = await this.getAnalytics();
    analytics.streak = {
      ...analytics.streak,
      ...updates,
    };
    analytics.lastUpdated = new Date();

    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      analytics,
      AnalyticsDataSchema
    );
  }

  /**
   * Get all achievements
   *
   * @returns Array of achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    const analytics = await this.getAnalytics();
    return analytics.achievements;
  }

  /**
   * Add a new achievement
   *
   * @param achievement - Achievement to add
   */
  async addAchievement(achievement: Achievement): Promise<void> {
    const analytics = await this.getAnalytics();

    // Check if already exists
    const exists = analytics.achievements.some((a) => a.id === achievement.id);
    if (exists) {
      return; // Already unlocked
    }

    analytics.achievements.push(achievement);
    analytics.lastUpdated = new Date();

    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      analytics,
      AnalyticsDataSchema
    );
  }

  /**
   * Check if achievement is unlocked
   *
   * @param achievementId - Achievement ID to check
   * @returns true if unlocked
   */
  async hasAchievement(achievementId: string): Promise<boolean> {
    const achievements = await this.getAchievements();
    return achievements.some((a) => a.id === achievementId);
  }

  /**
   * Clean up old daily stats (keep last 90 days)
   *
   * Runs automatically to maintain storage limits.
   */
  async cleanupOldStats(): Promise<void> {
    const analytics = await this.getAnalytics();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STORAGE_LIMITS.MAX_DAILY_STATS);
    cutoffDate.setHours(0, 0, 0, 0);

    // Filter stats to keep only last 90 days
    const filtered = analytics.dailyStats.filter((s) => {
      const statDate = new Date(s.date);
      return statDate >= cutoffDate;
    });

    // Only update if we actually removed something
    if (filtered.length < analytics.dailyStats.length) {
      analytics.dailyStats = filtered;
      analytics.lastUpdated = new Date();

      await this.storageService.set(
        STORAGE_KEYS.ANALYTICS,
        analytics,
        AnalyticsDataSchema,
        { debounce: false }
      );
    }
  }

  /**
   * Reset all analytics data
   *
   * Use with caution - typically for data deletion features.
   */
  async resetAnalytics(): Promise<void> {
    const defaultAnalytics = this.createDefaultAnalytics();
    await this.storageService.set(
      STORAGE_KEYS.ANALYTICS,
      defaultAnalytics,
      AnalyticsDataSchema,
      { debounce: false }
    );
  }

  /**
   * Export analytics data as JSON
   *
   * @returns JSON string of all analytics
   */
  async exportAnalytics(): Promise<string> {
    const analytics = await this.getAnalytics();
    return JSON.stringify(analytics, null, 2);
  }

  /**
   * Get analytics summary statistics
   *
   * @returns Object with summary stats
   */
  async getSummary(): Promise<{
    totalFocusTime: number;
    totalPomodoros: number;
    currentStreak: number;
    longestStreak: number;
    totalDaysTracked: number;
    totalAchievements: number;
    averageDailyPomodoros: number;
    averageDailyFocusTime: number;
  }> {
    const analytics = await this.getAnalytics();

    const totalDaysTracked = analytics.dailyStats.length;
    const totalDailyPomodoros = analytics.dailyStats.reduce(
      (sum, s) => sum + s.pomodorosCompleted,
      0
    );
    const totalDailyFocusTime = analytics.dailyStats.reduce(
      (sum, s) => sum + s.focusTime,
      0
    );

    return {
      totalFocusTime: analytics.totalFocusTime,
      totalPomodoros: analytics.totalPomodoros,
      currentStreak: analytics.streak.current,
      longestStreak: analytics.streak.longest,
      totalDaysTracked,
      totalAchievements: analytics.achievements.length,
      averageDailyPomodoros:
        totalDaysTracked > 0 ? totalDailyPomodoros / totalDaysTracked : 0,
      averageDailyFocusTime:
        totalDaysTracked > 0 ? totalDailyFocusTime / totalDaysTracked : 0,
    };
  }

  /**
   * Create default analytics data
   *
   * @private
   */
  private createDefaultAnalytics(): AnalyticsData {
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
    };
  }

  /**
   * Create default daily stats for a date
   *
   * @param date - Date for the stats
   * @private
   */
  private createDailyStats(date: Date): DailyStats {
    const cleanDate = new Date(date);
    cleanDate.setHours(0, 0, 0, 0);

    return {
      date: cleanDate,
      focusTime: 0,
      pomodorosCompleted: 0,
      pomodorosAbandoned: 0,
      topTasks: [],
      blockedAttempts: 0,
    };
  }
}
