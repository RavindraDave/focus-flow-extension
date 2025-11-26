/**
 * Timer Engine
 * Focus Flow Extension
 *
 * Manages Pomodoro timer logic using chrome.alarms.
 * Handles work/break cycles, session tracking, and notifications.
 */

import { SessionRepository } from '../services/session-repository';
import { AnalyticsTracker } from './analytics-tracker';
import { StreakTracker } from './streak-tracker';
import { SettingsRepository } from '../services/settings-repository';
import { BlockerEngine } from './blocker-engine';
import { PomodoroSession } from '../types/index';

/**
 * Error class for timer engine violations
 */
export class TimerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimerError';
  }
}

/**
 * Timer states
 */
export type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';

/**
 * Timer status information
 */
export interface TimerStatus {
  state: TimerState;
  remainingSeconds: number;
  totalSeconds: number;
  sessionCount: number;
  currentSession: PomodoroSession | null;
  isPaused: boolean;
}

/**
 * Manager for Pomodoro timer functionality
 *
 * @example
 * ```typescript
 * const timer = new TimerEngine();
 * await timer.start('work', 25);
 * const status = await timer.getStatus();
 * ```
 */
export class TimerEngine {
  private sessionRepository: SessionRepository;
  private analyticsTracker: AnalyticsTracker;
  private streakTracker: StreakTracker;
  private settingsRepository: SettingsRepository;
  private blockerEngine: BlockerEngine;

  private state: TimerState = 'idle';
  private sessionCount: number = 0;
  private startTime: Date | null = null;
  private totalSeconds: number = 0;
  private remainingSeconds: number = 0;

  private static readonly ALARM_NAME = 'pomodoro-timer';
  // Badge update interval constant (currently unused, reserved for future use)
  // private static readonly BADGE_UPDATE_INTERVAL = 1000; // 1 second

  constructor(
    sessionRepository?: SessionRepository,
    analyticsTracker?: AnalyticsTracker,
    streakTracker?: StreakTracker,
    settingsRepository?: SettingsRepository,
    blockerEngine?: BlockerEngine
  ) {
    this.sessionRepository = sessionRepository || new SessionRepository();
    this.analyticsTracker = analyticsTracker || new AnalyticsTracker();
    this.streakTracker = streakTracker || new StreakTracker();
    this.settingsRepository = settingsRepository || new SettingsRepository();
    this.blockerEngine = blockerEngine || new BlockerEngine();
  }

  /**
   * Start a timer session
   *
   * @param type - Session type (work/short-break/long-break)
   * @param minutes - Duration in minutes
   * @param taskName - Optional task name for the session
   */
  async start(
    type: 'work' | 'short-break' | 'long-break',
    minutes: number,
    taskName?: string
  ): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'paused') {
      throw new TimerError('Timer already running');
    }

    this.state = type;
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.startTime = new Date();

    // Create session record
    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      type,
      duration: minutes * 60, // Convert minutes to seconds for schema validation
      startTime: this.startTime.toISOString() as unknown as Date, // Schema expects ISO string, transforms to Date
      endTime: undefined,
      taskName: taskName || 'Focus Session',
      category: 'general',
      status: 'active',
      actualDuration: undefined,
    };

    await this.sessionRepository.saveCurrentSession(session);

    // Enable blocking for work sessions
    if (type === 'work') {
      await this.blockerEngine.enableBlocking();
    } else {
      await this.blockerEngine.disableBlocking();
    }

    // Start timer alarm
    await this.createAlarm();
    await this.updateBadge();

    console.info(`⏱️  Timer started: ${type} (${minutes}m)`);
  }

  /**
   * Pause the current timer
   */
  async pause(): Promise<void> {
    if (this.state !== 'work' && this.state !== 'short-break' && this.state !== 'long-break') {
      throw new TimerError('No active timer to pause');
    }

    this.state = 'paused';

    // Clear alarm
    await this.clearAlarm();

    // Update session
    const session = await this.sessionRepository.getCurrentSession();
    if (session) {
      await this.sessionRepository.saveCurrentSession({
        ...session,
        status: 'paused',
      });
    }

    await this.updateBadge();
    console.info('⏸️  Timer paused');
  }

  /**
   * Resume paused timer
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      throw new TimerError('Timer not paused');
    }

    // Restore state (work/short-break/long-break was saved before pause)
    const session = await this.sessionRepository.getCurrentSession();
    if (session) {
      this.state = session.type;
      await this.sessionRepository.saveCurrentSession({
        ...session,
        status: 'active',
      });
    }

    // Restart alarm
    await this.createAlarm();
    await this.updateBadge();

    console.info('▶️  Timer resumed');
  }

  /**
   * Stop the current timer (abandon session)
   */
  async stop(): Promise<void> {
    if (this.state === 'idle') {
      throw new TimerError('No active timer');
    }

    const session = await this.sessionRepository.getCurrentSession();

    // Mark as abandoned
    if (session) {
      const endTime = new Date();
      const elapsed = Math.floor(
        (endTime.getTime() - session.startTime.getTime()) / 1000
      );

      // Clamp actualDuration to max allowed value to prevent validation errors
      // This handles edge cases where sessions run abnormally long
      const clampedDuration = Math.min(elapsed, 7200); // Max 2 hours

      const completedSession: PomodoroSession = {
        ...session,
        startTime: (session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime) as unknown as Date,
        status: 'abandoned',
        endTime: endTime.toISOString() as unknown as Date,
        actualDuration: clampedDuration, // in seconds, clamped to prevent validation errors
      };

      await this.sessionRepository.addToHistory(completedSession);
      await this.sessionRepository.clearCurrentSession();
      await this.analyticsTracker.trackSessionAbandonment(completedSession);
    }

    // Reset state
    await this.reset();

    console.info('🛑 Timer stopped (abandoned)');
  }

  /**
   * Handle timer tick (called by alarm)
   *
   * @internal Called by chrome.alarms.onAlarm
   */
  async tick(): Promise<void> {
    if (this.state === 'idle' || this.state === 'paused') {
      return;
    }

    this.remainingSeconds--;

    if (this.remainingSeconds <= 0) {
      await this.complete();
    } else {
      await this.updateBadge();
    }
  }

  /**
   * Complete current session
   *
   * @private
   */
  private async complete(): Promise<void> {
    const session = await this.sessionRepository.getCurrentSession();

    if (!session) {
      await this.reset();
      return;
    }

    const endTime = new Date();
    const elapsed = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 1000
    );

    // Clamp actualDuration to max allowed value to prevent validation errors
    // This handles edge cases where sessions run abnormally long
    const actualDuration = Math.min(elapsed, 7200); // Max 2 hours

    const completedSession: PomodoroSession = {
      ...session,
      startTime: (session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime) as unknown as Date,
      status: 'completed',
      endTime: endTime.toISOString() as unknown as Date,
      actualDuration, // in seconds, clamped to prevent validation errors
    };

    // Save to history
    await this.sessionRepository.addToHistory(completedSession);
    await this.sessionRepository.clearCurrentSession();

    // Track analytics
    if (session.type === 'work') {
      await this.analyticsTracker.trackSessionCompletion(completedSession);
      this.sessionCount++;

      // Check streak (daily check)
      const settings = await this.settingsRepository.getSettings();
      const isPremium = !!settings.premiumLicenseKey;
      await this.streakTracker.checkDailyStreak(isPremium);
    }

    // Send notification
    await this.sendNotification(session.type);

    // Auto-start next session if enabled
    const settings = await this.settingsRepository.getSettings();
    if (settings.autoStartNextSession) {
      await this.startNextSession();
    } else {
      await this.reset();
    }

    console.info(`✅ Session completed: ${session.type}`);
  }

  /**
   * Start next session in cycle
   *
   * @private
   */
  private async startNextSession(): Promise<void> {
    const settings = await this.settingsRepository.getSettings();

    if (this.state === 'work') {
      // After work: short break or long break
      if (this.sessionCount % settings.sessionsUntilLongBreak === 0) {
        await this.start('long-break', settings.longBreakDuration);
      } else {
        await this.start('short-break', settings.shortBreakDuration);
      }
    } else {
      // After break: work
      await this.start('work', settings.workDuration);
    }
  }

  /**
   * Reset timer to idle state
   *
   * @private
   */
  private async reset(): Promise<void> {
    this.state = 'idle';
    this.remainingSeconds = 0;
    this.totalSeconds = 0;
    this.startTime = null;

    await this.clearAlarm();
    await this.blockerEngine.disableBlocking();
    await this.updateBadge();
  }

  /**
   * Get current timer status
   *
   * @returns Timer status information
   */
  async getStatus(): Promise<TimerStatus> {
    const currentSession = await this.sessionRepository.getCurrentSession();

    return {
      state: this.state,
      remainingSeconds: Math.max(0, this.remainingSeconds),
      totalSeconds: this.totalSeconds,
      sessionCount: this.sessionCount,
      currentSession,
      isPaused: this.state === 'paused',
    };
  }

  /**
   * Create Chrome alarm for timer
   *
   * @private
   */
  private async createAlarm(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      await chrome.alarms.create(TimerEngine.ALARM_NAME, {
        periodInMinutes: 1 / 60, // Every second (minimum is 1/60 = 1 second)
      });
    }
  }

  /**
   * Clear Chrome alarm
   *
   * @private
   */
  private async clearAlarm(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      await chrome.alarms.clear(TimerEngine.ALARM_NAME);
    }
  }

  /**
   * Update extension badge with remaining time
   *
   * @private
   */
  private async updateBadge(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.action) {
      if (this.state === 'idle') {
        await chrome.action.setBadgeText({ text: '' });
        return;
      }

      const minutes = Math.ceil(this.remainingSeconds / 60);
      await chrome.action.setBadgeText({ text: minutes.toString() });

      // Color based on state
      const color =
        this.state === 'work'
          ? '#ef4444' // Red for work
          : this.state === 'paused'
            ? '#6b7280' // Gray for paused
            : '#10b981'; // Green for break

      await chrome.action.setBadgeBackgroundColor({ color });
    }
  }

  /**
   * Send desktop notification
   *
   * @param completedType - Type of session that just completed
   * @private
   */
  private async sendNotification(completedType: string): Promise<void> {
    const settings = await this.settingsRepository.getSettings();

    if (!settings.enableNotifications) {
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.notifications) {
      const title =
        completedType === 'work'
          ? '✅ Work Session Complete!'
          : '☕ Break Complete!';

      const message =
        completedType === 'work'
          ? 'Great job! Time for a well-deserved break.'
          : 'Break time is over. Ready to focus?';

      await chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/icons/icon_v7_128.png'),
        title,
        message,
      });
    }
  }

  /**
   * Reset session count (for testing/admin)
   */
  resetSessionCount(): void {
    this.sessionCount = 0;
  }
}
