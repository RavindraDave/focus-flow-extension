/**
 * Background Service Worker
 * Focus Flow Extension
 *
 * Main entry point for the background service worker.
 * Wires together all engines and handles Chrome extension events.
 */

import { TimerEngine } from './timer-engine';
import { BlockerEngine } from './blocker-engine';
import { AnalyticsTracker } from './analytics-tracker';
import { StreakTracker } from './streak-tracker';
import { NuclearModeManager } from './nuclear-mode-manager';
import { ScheduleManager } from './schedule-manager';
import { SessionRepository } from '../services/session-repository';
import { AnalyticsRepository } from '../services/analytics-repository';
import { SettingsRepository } from '../services/settings-repository';
import { BlockRuleRepository } from '../services/block-rule-repository';
import { ScheduleRepository } from '../services/schedule-repository';
import { z } from 'zod';

/**
 * Message validation schemas for type safety and security
 */
const MessageSchemas = {
  TIMER_START: z.object({
    type: z.literal('TIMER_START'),
    sessionType: z.enum(['work', 'short-break', 'long-break']),
    taskName: z.string().optional(),
  }),

  NUCLEAR_MODE_ACTIVATE: z.object({
    type: z.literal('NUCLEAR_MODE_ACTIVATE'),
    durationHours: z.number().int().min(1).max(8),
  }),

  SETTINGS_UPDATE: z.object({
    type: z.literal('SETTINGS_UPDATE'),
    settings: z.record(z.unknown()),
  }),

  BLOCK_RULE_ADD: z.object({
    type: z.literal('BLOCK_RULE_ADD'),
    rule: z.object({
      id: z.string(),
      pattern: z.string().min(1),
      type: z.enum(['domain', 'url', 'keyword']),
      enabled: z.boolean(),
      category: z.string().optional(),
      createdAt: z.union([z.string(), z.date()]),
      updatedAt: z.union([z.string(), z.date()]),
    }),
  }),

  BLOCK_RULE_UPDATE: z.object({
    type: z.literal('BLOCK_RULE_UPDATE'),
    id: z.string(),
    updates: z.record(z.unknown()),
  }),

  BLOCK_RULE_DELETE: z.object({
    type: z.literal('BLOCK_RULE_DELETE'),
    id: z.string(),
  }),
};

/**
 * Validate message against schema
 *
 * @param message - Message to validate
 * @param schema - Zod schema to validate against
 * @returns Validated message or null if invalid
 */
function validateMessage<T>(message: unknown, schema: z.ZodType<T>): T | null {
  const result = schema.safeParse(message);
  if (result.success) {
    return result.data;
  }
  console.warn('Message validation failed:', result.error.format());
  return null;
}

/**
 * Error class for background service worker errors
 */
export class BackgroundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackgroundError';
  }
}

/**
 * Background Service Worker Manager
 *
 * Coordinates all background services and handles Chrome extension events.
 */
class BackgroundServiceWorker {
  // Repositories
  private sessionRepository: SessionRepository;
  private analyticsRepository: AnalyticsRepository;
  private settingsRepository: SettingsRepository;
  private blockRuleRepository: BlockRuleRepository;
  private scheduleRepository: ScheduleRepository;

  // Engines
  private timerEngine: TimerEngine;
  private blockerEngine: BlockerEngine;
  private analyticsTracker: AnalyticsTracker;
  private streakTracker: StreakTracker;
  private nuclearModeManager: NuclearModeManager;
  private scheduleManager: ScheduleManager;

  // Constants
  private static readonly ALARM_TIMER_TICK = 'pomodoro-timer';
  private static readonly ALARM_MIDNIGHT_CHECK = 'midnight-check';
  private static readonly ALARM_ALLOWANCE_RESET = 'allowance-reset';

  constructor() {
    // Initialize repositories
    this.sessionRepository = new SessionRepository();
    this.analyticsRepository = new AnalyticsRepository();
    this.settingsRepository = new SettingsRepository();
    this.blockRuleRepository = new BlockRuleRepository();
    this.scheduleRepository = new ScheduleRepository();

    // Initialize engines
    this.blockerEngine = new BlockerEngine(this.blockRuleRepository);
    this.streakTracker = new StreakTracker(
      this.analyticsRepository,
      this.sessionRepository
    );
    this.analyticsTracker = new AnalyticsTracker(
      this.analyticsRepository,
      this.sessionRepository
    );
    this.nuclearModeManager = new NuclearModeManager(this.settingsRepository);
    this.scheduleManager = new ScheduleManager(
      this.scheduleRepository,
      this.blockRuleRepository
    );
    this.timerEngine = new TimerEngine(
      this.sessionRepository,
      this.analyticsTracker,
      this.streakTracker,
      this.settingsRepository,
      this.blockerEngine
    );

    console.info('🚀 Focus Flow background service worker initialized');
  }

  /**
   * Initialize the background service worker
   *
   * Sets up event listeners and schedules recurring alarms.
   */
  async initialize(): Promise<void> {
    // Set up Chrome event listeners
    this.setupMessageListener();
    this.setupAlarmListener();
    this.setupInstallListener();

    // Schedule midnight check alarm (runs daily at midnight)
    await this.scheduleMidnightCheck();

    // Initialize schedule manager (sets up schedule checks)
    await this.scheduleManager.initialize();

    // Restore timer state if browser was restarted
    await this.restoreTimerState();

    console.info('✅ Background service worker ready');
  }

  /**
   * Set up chrome.runtime.onMessage listener
   *
   * Handles messages from popup, options page, and content scripts.
   * @private
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
        // Handle message asynchronously
        this.handleMessage(message, sender)
          .then(response => sendResponse({ success: true, data: response }))
          .catch(error => {
            console.error('Message handler error:', error);
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });

        // Return true to indicate async response
        return true;
      }
    );
  }

  /**
   * Handle incoming message
   *
   * @param message - Message from popup/options/content script
   * @param sender - Message sender info
   * @returns Response data
   * @private
   */
  private async handleMessage(
    message: any,
    _sender: chrome.runtime.MessageSender
  ): Promise<any> {
    const { type } = message;

    switch (type) {
      // Timer controls
      case 'TIMER_START': {
        // Validate message structure
        const validatedMsg = validateMessage(message, MessageSchemas.TIMER_START);
        if (!validatedMsg) {
          throw new BackgroundError('Invalid TIMER_START message format');
        }

        // Use user settings for duration, ignore client-provided fallback
        const settings = await this.settingsRepository.getSettings();
        let duration: number;

        switch (validatedMsg.sessionType) {
          case 'work':
            duration = settings.workDuration;
            break;
          case 'short-break':
            duration = settings.shortBreakDuration;
            break;
          case 'long-break':
            duration = settings.longBreakDuration;
            break;
          default:
            duration = 25; // Fallback only if sessionType is somehow invalid
        }

        return await this.timerEngine.start(validatedMsg.sessionType, duration, validatedMsg.taskName);
      }

      case 'TIMER_PAUSE':
        return await this.timerEngine.pause();

      case 'TIMER_RESUME':
        return await this.timerEngine.resume();

      case 'TIMER_STOP':
        return await this.timerEngine.stop();

      case 'TIMER_GET_STATUS':
        return await this.timerEngine.getStatus();

      // Nuclear mode
      case 'NUCLEAR_MODE_ACTIVATE': {
        // Validate message structure
        const validatedMsg = validateMessage(message, MessageSchemas.NUCLEAR_MODE_ACTIVATE);
        if (!validatedMsg) {
          throw new BackgroundError('Invalid NUCLEAR_MODE_ACTIVATE message format');
        }
        return await this.nuclearModeManager.activate(validatedMsg.durationHours);
      }

      case 'NUCLEAR_MODE_DEACTIVATE':
        return await this.nuclearModeManager.deactivate();

      case 'NUCLEAR_MODE_GET_STATUS':
        return {
          isActive: await this.nuclearModeManager.isActive(),
          remainingTime: await this.nuclearModeManager.getRemainingTime(),
        };

      // Analytics
      case 'ANALYTICS_GET':
        return await this.analyticsRepository.getAnalytics();

      case 'ANALYTICS_GET_FOCUS_SCORE':
        return await this.analyticsTracker.calculateFocusScore();

      case 'ANALYTICS_GET_WEEKLY_SUMMARY':
        return await this.analyticsTracker.getWeeklySummary();

      case 'ANALYTICS_GET_MONTHLY_SUMMARY':
        return await this.analyticsTracker.getMonthlySummary();

      // Streak
      case 'STREAK_GET':
        return await this.analyticsRepository.getStreak();

      case 'STREAK_CHECK':
        const settings = await this.settingsRepository.getSettings();
        return await this.streakTracker.checkDailyStreak(
          settings.premiumLicenseKey !== undefined
        );

      // Blocker
      case 'BLOCKER_SYNC_RULES':
        return await this.blockerEngine.syncRules();

      case 'BLOCKER_GET_STATS':
        return await this.blockerEngine.getStats();

      case 'BLOCKER_TRACK_ATTEMPT':
        return await this.blockerEngine.handleBlockedAttempt(message.domain);

      // Block List CRUD
      case 'BLOCKLIST_GET_ALL':
        return await this.blockRuleRepository.getAllRules();

      case 'BLOCKLIST_ADD': {
        // Check for duplicate pattern
        const existingRules = await this.blockRuleRepository.getAllRules();
        const isDuplicate = existingRules.some(
          rule => rule.pattern === message.rule.pattern && rule.type === message.rule.type
        );

        if (isDuplicate) {
          // Return existing rule instead of creating duplicate
          const existing = existingRules.find(
            rule => rule.pattern === message.rule.pattern && rule.type === message.rule.type
          );
          return existing;
        }

        const now = new Date().toISOString();
        const newRule = {
          ...message.rule,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await this.blockRuleRepository.addRule(newRule);
        await this.blockerEngine.syncRules(); // Sync rules to declarativeNetRequest
        return newRule;
      }

      case 'BLOCKLIST_UPDATE': {
        const updates = {
          ...message.updates,
          updatedAt: new Date().toISOString(),
        };
        await this.blockRuleRepository.updateRule(message.id, updates);
        await this.blockerEngine.syncRules(); // Sync rules to declarativeNetRequest
        return true;
      }

      case 'BLOCKLIST_DELETE': {
        const deleted = await this.blockRuleRepository.deleteRule(message.id);
        if (deleted) {
          await this.blockerEngine.syncRules(); // Sync rules to declarativeNetRequest
        }
        return deleted;
      }

      // Session history
      case 'SESSION_GET_HISTORY':
        return await this.sessionRepository.getSessionHistory(message.limit);

      case 'SESSION_GET_TODAY':
        return await this.sessionRepository.getTodaySessions();

      // Settings
      case 'SETTINGS_GET':
        return await this.settingsRepository.getSettings();

      case 'SETTINGS_UPDATE':
        return await this.settingsRepository.updateSettings(message.updates);

      // Schedules
      case 'SCHEDULE_GET_ALL':
        return await this.scheduleRepository.getAllSchedules();

      case 'SCHEDULE_ADD': {
        const now = new Date().toISOString();
        const newSchedule = {
          ...message.schedule,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await this.scheduleRepository.addSchedule(newSchedule);
        // Trigger immediate schedule check
        await this.scheduleManager.checkSchedules();
        return newSchedule;
      }

      case 'SCHEDULE_UPDATE': {
        const updates = {
          ...message.updates,
          updatedAt: new Date().toISOString(),
        };
        await this.scheduleRepository.updateSchedule(message.id, updates);
        // Trigger immediate schedule check
        await this.scheduleManager.checkSchedules();
        return true;
      }

      case 'SCHEDULE_DELETE': {
        const deleted = await this.scheduleRepository.deleteSchedule(message.id);
        if (deleted) {
          // Trigger immediate schedule check
          await this.scheduleManager.checkSchedules();
        }
        return deleted;
      }

      case 'SCHEDULE_GET_NEXT':
        return await this.scheduleManager.getNextSchedule();

      default:
        throw new BackgroundError(`Unknown message type: ${type}`);
    }
  }

  /**
   * Set up chrome.alarms listener
   *
   * Handles timer ticks, midnight checks, and allowance resets.
   * @private
   */
  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
      try {
        switch (alarm.name) {
          case BackgroundServiceWorker.ALARM_TIMER_TICK:
            // Timer engine handles its own ticks
            await this.timerEngine.tick();
            break;

          case BackgroundServiceWorker.ALARM_MIDNIGHT_CHECK:
            // Check daily streak at midnight
            const settings = await this.settingsRepository.getSettings();
            await this.streakTracker.checkDailyStreak(
              settings.premiumLicenseKey !== undefined
            );

            // Clean up old data
            await this.sessionRepository.cleanupOldSessions();
            await this.analyticsRepository.cleanupOldStats();

            // Schedule next midnight check
            await this.scheduleMidnightCheck();
            break;

          case BackgroundServiceWorker.ALARM_ALLOWANCE_RESET:
            // Reset daily allowances at midnight
            await this.blockerEngine.resetDailyAllowances();
            break;

          default:
            // Delegate to schedule manager for schedule-related alarms
            await this.scheduleManager.handleAlarm(alarm);
        }
      } catch (error) {
        console.error(`Alarm handler error (${alarm.name}):`, error);
      }
    });
  }

  /**
   * Set up chrome.runtime.onInstalled listener
   *
   * Handles extension installation and updates.
   * @private
   */
  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
      try {
        if (details.reason === 'install') {
          console.info('🎉 Extension installed');

          // Initialize default settings
          const settings = await this.settingsRepository.getSettings();
          if (!settings) {
            await this.settingsRepository.updateSettings({
              workDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              sessionsUntilLongBreak: 4,
              autoStartNextSession: false,
              enableNotifications: true,
            });
          }

          // Schedule midnight check
          await this.scheduleMidnightCheck();

          // Open onboarding page on first install
          await chrome.tabs.create({
            url: chrome.runtime.getURL('onboarding.html'),
          });

          // Show welcome notification
          await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('/icons/icon_v7_128.png'),
            title: 'Focus Flow Installed!',
            message: 'Welcome! Let\'s get you started with Focus Flow.',
          });
        } else if (details.reason === 'update') {
          console.info(`📦 Extension updated to version ${chrome.runtime.getManifest().version}`);

          // Run migrations if needed
          await this.runMigrations(details.previousVersion);
        }
      } catch (error) {
        console.error('Install handler error:', error);
      }
    });
  }

  /**
   * Schedule midnight check alarm
   *
   * Creates an alarm that fires at midnight local time.
   * @private
   */
  private async scheduleMidnightCheck(): Promise<void> {
    // Clear existing alarm
    await chrome.alarms.clear(BackgroundServiceWorker.ALARM_MIDNIGHT_CHECK);

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const minutesUntilMidnight = (tomorrow.getTime() - now.getTime()) / (1000 * 60);

    // Schedule alarm
    await chrome.alarms.create(BackgroundServiceWorker.ALARM_MIDNIGHT_CHECK, {
      delayInMinutes: minutesUntilMidnight,
    });

    console.info(`⏰ Midnight check scheduled in ${Math.round(minutesUntilMidnight)} minutes`);
  }

  /**
   * Restore timer state after browser restart
   *
   * Checks if there was an active session before restart and resumes it.
   * @private
   */
  private async restoreTimerState(): Promise<void> {
    const currentSession = await this.sessionRepository.getCurrentSession();

    if (currentSession && currentSession.status === 'active') {
      console.info('🔄 Restoring timer state from session:', currentSession.id);

      // Calculate remaining time
      const elapsed = Math.floor(
        (Date.now() - currentSession.startTime.getTime()) / 1000
      );
      const totalSeconds = currentSession.duration * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsed);

      if (remainingSeconds > 0) {
        // Resume the session
        await this.timerEngine.start(currentSession.type, currentSession.duration);
      } else {
        // Session expired while browser was closed
        console.info('⏱️ Session expired, marking as abandoned');
        await this.timerEngine.stop();
      }
    }
  }

  /**
   * Run migrations for extension updates
   *
   * @param previousVersion - Previous extension version
   * @private
   */
  private async runMigrations(previousVersion?: string): Promise<void> {
    if (!previousVersion) return;

    console.info(`🔄 Running migrations from version ${previousVersion}`);

    // Add migration logic here as needed for future updates
    // Example:
    // if (semver.lt(previousVersion, '2.0.0')) {
    //   await this.migrateToV2();
    // }
  }
}

// Initialize the background service worker
const backgroundService = new BackgroundServiceWorker();
backgroundService.initialize().catch(error => {
  console.error('Failed to initialize background service worker:', error);
});

// Export for testing
export { BackgroundServiceWorker };
