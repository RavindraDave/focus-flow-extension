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
import { createLogger } from '../utils/logger';

const log = createLogger('TimerEngine');

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
 * Persisted timer state for service worker recovery
 */
interface PersistedTimerState {
  state: TimerState;
  remainingSeconds: number;
  totalSeconds: number;
  sessionCount: number;
  startTime: string | null;
  previousSessionType: 'work' | 'short-break' | 'long-break' | null;
  savedAt: number;
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
  private previousSessionType: 'work' | 'short-break' | 'long-break' | null = null;
  private isCompleting: boolean = false; // Idempotency guard for complete()
  private isRestoring: boolean = false; // Mutex for timer restoration

  private static readonly ALARM_NAME = 'pomodoro-timer';
  private static readonly TIMER_STATE_KEY = 'timer_engine_state'; // For persisting state

  constructor(
    sessionRepository?: SessionRepository,
    analyticsTracker?: AnalyticsTracker,
    streakTracker?: StreakTracker,
    settingsOrOptions?: SettingsRepository | {
      settingsRepository?: SettingsRepository;
      blockerEngine?: BlockerEngine;
    }
  ) {
    this.sessionRepository = sessionRepository ?? new SessionRepository();
    this.analyticsTracker = analyticsTracker ?? new AnalyticsTracker();
    this.streakTracker = streakTracker ?? new StreakTracker();

    if (settingsOrOptions instanceof SettingsRepository) {
      // Legacy: positional SettingsRepository (blockerEngine not provided here)
      this.settingsRepository = settingsOrOptions;
      this.blockerEngine = new BlockerEngine();
    } else if (settingsOrOptions) {
      // Options object form
      this.settingsRepository = settingsOrOptions.settingsRepository ?? new SettingsRepository();
      this.blockerEngine = settingsOrOptions.blockerEngine ?? new BlockerEngine();
    } else {
      this.settingsRepository = new SettingsRepository();
      this.blockerEngine = new BlockerEngine();
    }
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
      taskName: taskName ?? 'Focus Session',
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

    log.info('Timer started', { type, minutes });
  }

  /**
   * Pause the current timer
   */
  async pause(): Promise<void> {
    if (this.state !== 'work' && this.state !== 'short-break' && this.state !== 'long-break') {
      throw new TimerError('No active timer to pause');
    }

    // Store the session type before changing state
    this.previousSessionType = this.state;
    this.state = 'paused';

    // Clear alarm
    await this.clearAlarm();

    // Update session with remaining time
    const session = await this.sessionRepository.getCurrentSession();
    if (session) {
      await this.sessionRepository.saveCurrentSession({
        ...session,
        status: 'paused',
        // Store remaining seconds in the session for persistence
        pausedAt: new Date().toISOString(),
        remainingSeconds: this.remainingSeconds,
      } as PomodoroSession & { pausedAt?: string; remainingSeconds?: number });
    }

    // Persist timer state for service worker restarts
    await this.persistTimerState();

    await this.updateBadge();
    log.info('Timer paused', { remainingSeconds: this.remainingSeconds });
  }

  /**
   * Resume paused timer
   */
  async resume(): Promise<void> {
    if (this.state !== 'paused') {
      throw new TimerError('Timer not paused');
    }

    // Restore state (work/short-break/long-break was saved before pause)
    const session = await this.sessionRepository.getCurrentSession() as PomodoroSession & { pausedAt?: string; remainingSeconds?: number } | null;
    if (session) {
      this.state = session.type;

      // Restore remaining seconds from session if available
      if (typeof session.remainingSeconds === 'number' && session.remainingSeconds > 0) {
        this.remainingSeconds = session.remainingSeconds;
      }

      await this.sessionRepository.saveCurrentSession({
        ...session,
        status: 'active',
        pausedAt: undefined,
        remainingSeconds: undefined,
      } as PomodoroSession);
    }

    // Restart alarm
    await this.createAlarm();

    // Persist timer state
    await this.persistTimerState();

    await this.updateBadge();

    log.info('Timer resumed', { remainingSeconds: this.remainingSeconds });
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

    log.info('Timer stopped (abandoned)');
  }

  /**
   * Handle timer tick (called by alarm)
   *
   * Uses time-based calculation for accuracy since Chrome alarms
   * have a minimum 1-minute period in production.
   * @internal Called by chrome.alarms.onAlarm
   */
  async tick(): Promise<void> {
    if (this.state === 'idle' || this.state === 'paused') {
      return;
    }

    // Calculate remaining time based on actual elapsed time (more accurate than decrement)
    if (this.startTime) {
      const elapsedSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      this.remainingSeconds = Math.max(0, this.totalSeconds - elapsedSeconds);
    } else {
      // Fallback to decrement if startTime not available
      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
    }

    if (this.remainingSeconds <= 0) {
      await this.complete();
    } else {
      await this.updateBadge();
      // Persist state periodically for service worker recovery
      await this.persistTimerState();
    }
  }

  /**
   * Build a completed session record
   * @private
   */
  private buildCompletedSession(session: PomodoroSession, status: 'completed' | 'abandoned'): PomodoroSession {
    const endTime = new Date();
    const elapsed = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 1000
    );

    // Clamp actualDuration to max allowed value to prevent validation errors
    const actualDuration = Math.min(elapsed, 7200); // Max 2 hours

    return {
      ...session,
      startTime: (session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime) as unknown as Date,
      status,
      endTime: endTime.toISOString() as unknown as Date,
      actualDuration,
    };
  }

  /**
   * Save completed session and track analytics
   * @private
   */
  private async saveAndTrackSession(session: PomodoroSession, completedSession: PomodoroSession): Promise<void> {
    await this.sessionRepository.addToHistory(completedSession);
    await this.sessionRepository.clearCurrentSession();

    if (session.type === 'work') {
      await this.analyticsTracker.trackSessionCompletion(completedSession);
      this.sessionCount++;

      const settings = await this.settingsRepository.getSettings();
      const isPremium = !!settings.premiumLicenseKey;
      await this.streakTracker.checkDailyStreak(isPremium);
    }
  }

  /**
   * Complete current session
   *
   * @private
   */
  private async complete(): Promise<void> {
    if (this.isCompleting) {
      log.warn('Complete already in progress, skipping duplicate call');
      return;
    }

    if (this.state === 'idle') {
      log.warn('Cannot complete: timer already idle');
      return;
    }

    this.isCompleting = true;

    try {
      const session = await this.sessionRepository.getCurrentSession();

      if (!session) {
        await this.reset();
        return;
      }

      this.previousSessionType = session.type;
      const completedSession = this.buildCompletedSession(session, 'completed');
      await this.saveAndTrackSession(session, completedSession);
      await this.sendNotification(session.type);

      const settings = await this.settingsRepository.getSettings();
      if (settings.autoStartNextSession) {
        await this.startNextSession();
      } else {
        await this.reset();
      }

      log.info('Session completed', { type: session.type });
    } finally {
      this.isCompleting = false;
    }
  }

  /**
   * Start next session in cycle
   *
   * Uses previousSessionType since this.state may already be reset
   * @private
   */
  private async startNextSession(): Promise<void> {
    const settings = await this.settingsRepository.getSettings();

    // Use previousSessionType which was saved before complete() reset the state
    const completedType = this.previousSessionType;

    if (completedType === 'work') {
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

    // Clear previousSessionType after use
    this.previousSessionType = null;
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
    this.previousSessionType = null;

    await this.clearAlarm();
    await this.blockerEngine.disableBlocking();
    await this.updateBadge();
    await this.clearPersistedState();
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
   * Uses a per-minute alarm since Chrome enforces 1-minute minimum.
   * The tick() method calculates actual elapsed time for accuracy.
   * @private
   */
  private async createAlarm(): Promise<void> {
    if (chrome?.alarms) {
      // Chrome alarms have a minimum period of 1 minute in production
      // We use delayInMinutes for the first tick, then periodInMinutes for subsequent
      await chrome.alarms.create(TimerEngine.ALARM_NAME, {
        delayInMinutes: 1 / 60, // First tick as soon as possible
        periodInMinutes: 1, // Subsequent ticks every minute
      });

      // Also persist timer state so we can accurately calculate remaining time
      await this.persistTimerState();
    }
  }

  /**
   * Clear Chrome alarm
   *
   * @private
   */
  private async clearAlarm(): Promise<void> {
    if (chrome?.alarms) {
      await chrome.alarms.clear(TimerEngine.ALARM_NAME);
    }
  }

  /**
   * Update extension badge with remaining time
   *
   * @private
   */
  private async updateBadge(): Promise<void> {
    if (chrome?.action) {
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

    if (chrome?.notifications) {
      const title =
        completedType === 'work'
          ? '✅ Work Session Complete!'
          : '☕ Break Complete!';

      const message =
        completedType === 'work'
          ? 'Great job! Time for a well-deserved break.'
          : 'Break time is over. Ready to focus?';

      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/icons/icon_v10_128.png'),
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

  /**
   * Persist timer state to storage for service worker recovery
   *
   * Called periodically during tick and on pause/resume.
   * @private
   */
  private async persistTimerState(): Promise<void> {
    if (!chrome?.storage?.local) {
      return;
    }

    const timerState: PersistedTimerState = {
      state: this.state,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      sessionCount: this.sessionCount,
      startTime: this.startTime?.toISOString() ?? null,
      previousSessionType: this.previousSessionType,
      savedAt: Date.now(),
    };

    try {
      await chrome.storage.local.set({ [TimerEngine.TIMER_STATE_KEY]: timerState });
    } catch (error) {
      log.error('Failed to persist timer state', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Load persisted timer state from storage
   * @returns The saved state, or null if unavailable or stale
   * @private
   */
  private async loadPersistedState(): Promise<PersistedTimerState | null> {
    if (!chrome?.storage?.local) {
      return null;
    }

    const result = await chrome.storage.local.get(TimerEngine.TIMER_STATE_KEY);
    const savedState = result[TimerEngine.TIMER_STATE_KEY] as PersistedTimerState | undefined;

    if (!savedState) {
      return null;
    }

    // Check if state is stale (saved more than 2 hours ago)
    const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours
    if (Date.now() - savedState.savedAt > staleThreshold) {
      log.info('Timer state too old, discarding');
      await chrome.storage.local.remove(TimerEngine.TIMER_STATE_KEY);
      return null;
    }

    // Only restore if was running (not idle)
    if (savedState.state === 'idle') {
      return null;
    }

    return savedState;
  }

  /**
   * Apply persisted state to the timer and resume
   * @param savedState - The validated persisted state
   * @returns true if restoration succeeded
   * @private
   */
  private async applyPersistedState(savedState: PersistedTimerState): Promise<boolean> {
    this.state = savedState.state;
    this.totalSeconds = savedState.totalSeconds;
    this.sessionCount = savedState.sessionCount;
    this.previousSessionType = savedState.previousSessionType;

    if (savedState.startTime) {
      this.startTime = new Date(savedState.startTime);
      const elapsedSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      this.remainingSeconds = Math.max(0, this.totalSeconds - elapsedSeconds);
    } else {
      this.remainingSeconds = savedState.remainingSeconds;
    }

    if (this.remainingSeconds <= 0 && this.state !== 'paused') {
      log.info('Timer expired during suspension, completing session');
      await this.complete();
      return true;
    }

    if (this.state !== 'paused') {
      await this.createAlarm();
    }

    await this.updateBadge();
    log.info('Timer state restored', { state: this.state, remainingSeconds: this.remainingSeconds });
    return true;
  }

  /**
   * Restore timer state from storage after service worker restart
   *
   * Should be called during initialization with mutex protection.
   */
  async restoreFromStorage(): Promise<boolean> {
    if (this.isRestoring) {
      log.warn('Timer restoration already in progress');
      return false;
    }

    if (this.state !== 'idle') {
      log.info('Timer already running, skipping restoration');
      return false;
    }

    this.isRestoring = true;

    try {
      const savedState = await this.loadPersistedState();
      if (!savedState) {
        return false;
      }
      return await this.applyPersistedState(savedState);
    } catch (error) {
      log.error('Failed to restore timer state', error instanceof Error ? error : undefined);
      return false;
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Clear persisted timer state
   * Called on reset to clean up storage
   */
  private async clearPersistedState(): Promise<void> {
    if (chrome?.storage?.local) {
      try {
        await chrome.storage.local.remove(TimerEngine.TIMER_STATE_KEY);
      } catch (error) {
        log.error('Failed to clear persisted timer state', error instanceof Error ? error : undefined);
      }
    }
  }
}
