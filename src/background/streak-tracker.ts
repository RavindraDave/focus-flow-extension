/**
 * Streak Tracker
 * Focus Flow Extension
 *
 * Manages daily streak tracking, including freeze system for premium users.
 * Streaks increment when users complete at least one Pomodoro per day.
 *
 * Premium Feature: Streak freezes allow missing up to 2 days without breaking streak
 */

import { AnalyticsRepository } from '../services/analytics-repository';
import { SessionRepository } from '../services/session-repository';
import { StreakData } from '../types/index';
import { createLogger } from '../utils/logger';

const log = createLogger('StreakTracker');

/**
 * Error class for streak tracking violations
 */
export class StreakError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StreakError';
  }
}

/**
 * Manager for daily streak tracking and freeze system
 *
 * @example
 * ```typescript
 * const tracker = new StreakTracker();
 * await tracker.checkDailyStreak();
 * const streak = await tracker.getCurrentStreak();
 * ```
 */
export class StreakTracker {
  private analyticsRepository: AnalyticsRepository;
  private sessionRepository: SessionRepository;

  // Premium users get 2 streak freezes per month
  private static readonly MAX_FREEZES_PER_MONTH = 2;

  // Minimum Pomodoros to count as "active day"
  private static readonly MIN_POMODOROS_FOR_STREAK = 1;

  constructor(
    analyticsRepository?: AnalyticsRepository,
    sessionRepository?: SessionRepository
  ) {
    this.analyticsRepository = analyticsRepository || new AnalyticsRepository();
    this.sessionRepository = sessionRepository || new SessionRepository();
  }

  /**
   * Check and update daily streak
   *
   * Should be called at midnight or when user completes first Pomodoro of the day.
   * Handles streak increments, breaks, and freeze consumption.
   *
   * @param isPremium - Whether user has premium license
   * @returns Updated streak data
   */
  async checkDailyStreak(isPremium: boolean = false): Promise<StreakData> {
    const streak = await this.analyticsRepository.getStreak();
    const now = new Date();
    const lastCheckIn = streak.lastSessionDate ? new Date(streak.lastSessionDate) : new Date(0);

    // Calculate days since last check-in
    const daysSinceLastCheckIn = this.getDaysDifference(lastCheckIn, now);

    if (daysSinceLastCheckIn === 0) {
      // Already checked in today
      return streak;
    }

    // Check if user completed any Pomodoros today
    const todaySessions = await this.sessionRepository.getTodaySessions();
    const completedToday = todaySessions.filter(s => s.status === 'completed');
    const hasActivity = completedToday.length >= StreakTracker.MIN_POMODOROS_FOR_STREAK;

    let updatedStreak: Partial<StreakData>;

    if (daysSinceLastCheckIn === 1) {
      // Consecutive day
      if (hasActivity) {
        updatedStreak = {
          currentStreak: streak.currentStreak + 1,
          longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
          lastSessionDate: now,
        };
      } else {
        // Missed today - try to use freeze if available
        updatedStreak = await this.handleMissedDay(streak, isPremium, now);
      }
    } else if (daysSinceLastCheckIn > 1) {
      // Missed multiple days - try to recover with freezes
      updatedStreak = await this.handleMultipleMissedDays(
        streak,
        daysSinceLastCheckIn,
        isPremium,
        now
      );
    } else {
      // Should never happen (negative days)
      throw new StreakError('Invalid check-in time: future date detected');
    }

    // Update streak in storage
    await this.analyticsRepository.updateStreak(updatedStreak);

    return {
      ...streak,
      ...updatedStreak,
    };
  }

  /**
   * Get current streak data
   *
   * @returns Current streak information
   */
  async getCurrentStreak(): Promise<StreakData> {
    return await this.analyticsRepository.getStreak();
  }

  /**
   * Award streak freeze (premium feature)
   *
   * Users earn freezes through achievements or monthly reset.
   *
   * @param count - Number of freezes to award (default 1)
   * @throws StreakError if exceeding maximum freezes
   */
  async awardFreeze(count: number = 1): Promise<void> {
    const streak = await this.analyticsRepository.getStreak();
    const newTotal = streak.freezesAvailable + count;

    if (newTotal > StreakTracker.MAX_FREEZES_PER_MONTH) {
      throw new StreakError(
        `Cannot exceed ${StreakTracker.MAX_FREEZES_PER_MONTH} freezes per month`
      );
    }

    await this.analyticsRepository.updateStreak({
      freezesAvailable: newTotal,
    });
  }

  /**
   * Reset monthly freezes (should be called on 1st of each month)
   *
   * @param isPremium - Whether user has premium license
   */
  async resetMonthlyFreezes(isPremium: boolean): Promise<void> {
    if (!isPremium) {
      return; // Only premium users get freezes
    }

    await this.analyticsRepository.updateStreak({
      freezesAvailable: StreakTracker.MAX_FREEZES_PER_MONTH,
    });
  }

  /**
   * Get available freezes
   *
   * @returns Number of freezes available
   */
  async getAvailableFreezes(): Promise<number> {
    const streak = await this.analyticsRepository.getStreak();
    return streak.freezesAvailable;
  }

  /**
   * Check if user maintained streak today
   *
   * @returns true if user completed at least one Pomodoro today
   */
  async hasActivityToday(): Promise<boolean> {
    const todaySessions = await this.sessionRepository.getTodaySessions();
    const completedToday = todaySessions.filter(s => s.status === 'completed');
    return completedToday.length >= StreakTracker.MIN_POMODOROS_FOR_STREAK;
  }

  /**
   * Handle single missed day
   *
   * @param streak - Current streak data
   * @param isPremium - Whether user has premium
   * @param now - Current date
   * @returns Updated streak data
   * @private
   */
  private async handleMissedDay(
    streak: StreakData,
    isPremium: boolean,
    now: Date
  ): Promise<Partial<StreakData>> {
    if (isPremium && streak.freezesAvailable > 0) {
      // Use a freeze to maintain streak
      log.info('Using streak freeze to maintain streak');
      return {
        // Streak maintained
        lastSessionDate: now,
        freezesAvailable: streak.freezesAvailable - 1,
      };
    } else {
      // Break streak
      log.warn('Streak broken: no activity and no freezes available');
      return {
        currentStreak: 0,
        lastSessionDate: now,
      };
    }
  }

  /**
   * Handle multiple missed days
   *
   * @param streak - Current streak data
   * @param daysMissed - Number of days missed
   * @param isPremium - Whether user has premium
   * @param now - Current date
   * @returns Updated streak data
   * @private
   */
  private async handleMultipleMissedDays(
    streak: StreakData,
    daysMissed: number,
    isPremium: boolean,
    now: Date
  ): Promise<Partial<StreakData>> {
    const daysToRecover = daysMissed - 1; // Today is covered by current session

    if (isPremium && streak.freezesAvailable >= daysToRecover) {
      // Use freezes to recover streak
      log.info('Using freezes to maintain streak', { daysToRecover });
      return {
        lastSessionDate: now,
        freezesAvailable: streak.freezesAvailable - daysToRecover,
      };
    } else {
      // Cannot recover - break streak
      log.warn('Streak broken: insufficient freezes', { daysMissed });
      return {
        currentStreak: 0,
        lastSessionDate: now,
      };
    }
  }

  /**
   * Calculate difference in days between two dates
   *
   * Ignores time component, only counts calendar days.
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns Number of days difference
   * @private
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Set to midnight for accurate day comparison
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Reset streak to zero (admin/testing function)
   *
   * Use with caution - typically for testing or data deletion.
   */
  async resetStreak(): Promise<void> {
    await this.analyticsRepository.updateStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: new Date().toISOString() as unknown as Date,
      freezesAvailable: 0,
      todayCompleted: false,
    });
  }
}
