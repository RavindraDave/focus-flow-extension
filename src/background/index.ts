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
import { TimerMessageHandler } from './handlers/timer-handler';
import { BlockListMessageHandler } from './handlers/blocklist-handler';
import { ScheduleMessageHandler } from './handlers/schedule-handler';
import { validateBackgroundMessage } from './message-types';
import type { BackgroundMessage, BackgroundResponse } from './message-types';
import { createLogger } from '../utils/logger';

const log = createLogger('BackgroundServiceWorker');

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

  // Message Handlers
  private timerHandler: TimerMessageHandler;
  private blockListHandler: BlockListMessageHandler;
  private scheduleHandler: ScheduleMessageHandler;

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
    this.blockerEngine = new BlockerEngine(
      this.blockRuleRepository,
      this.settingsRepository
    );
    this.streakTracker = new StreakTracker(
      this.analyticsRepository,
      this.sessionRepository
    );
    this.analyticsTracker = new AnalyticsTracker(
      this.analyticsRepository,
      this.sessionRepository
    );
    this.nuclearModeManager = new NuclearModeManager(this.settingsRepository);
    this.timerEngine = new TimerEngine(
      this.sessionRepository,
      this.analyticsTracker,
      this.streakTracker,
      this.settingsRepository,
      this.blockerEngine
    );
    // Initialize schedule manager after timer engine so it can auto-start timer
    this.scheduleManager = new ScheduleManager(
      this.scheduleRepository,
      this.blockRuleRepository,
      this.timerEngine
    );

    // Initialize message handlers
    this.timerHandler = new TimerMessageHandler(
      this.timerEngine,
      this.settingsRepository
    );
    this.blockListHandler = new BlockListMessageHandler(
      this.blockRuleRepository,
      this.blockerEngine
    );
    this.scheduleHandler = new ScheduleMessageHandler(
      this.scheduleRepository,
      this.scheduleManager,
      this.settingsRepository
    );

    if (process.env.NODE_ENV === 'development') {
      log.info('Background service worker initialized');
    }
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
    this.setupSuspendListener();

    // Schedule midnight check alarm (runs daily at midnight)
    await this.scheduleMidnightCheck();

    // Initialize schedule manager (sets up schedule checks)
    await this.scheduleManager.initialize();

    // Restore timer state if browser was restarted
    await this.restoreTimerState();

    if (process.env.NODE_ENV === 'development') {
      log.info('Background service worker ready');
    }
  }

  /**
   * Set up chrome.runtime.onMessage listener
   *
   * Handles messages from popup, options page, and content scripts.
   * @private
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (
        message: BackgroundMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: BackgroundResponse) => void
      ) => {
        // SECURITY: Validate message at runtime before processing
        const validation = validateBackgroundMessage(message);
        if (!validation.valid) {
          if (process.env.NODE_ENV === 'development') {
            log.warn('Invalid message rejected', { error: validation.error });
          }
          sendResponse({
            success: false,
            error: validation.error ?? 'Invalid message format',
          });
          return true;
        }

        // Handle message asynchronously
        void this.handleMessage(message, sender)
          .then(response => sendResponse({ success: true, data: response }))
          .catch((error: unknown) => {
            if (process.env.NODE_ENV === 'development') {
              log.error('Message handler error', error as Error);
            }
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
   * @param _sender - Message sender info
   * @returns Response data
   * @private
   */
  private async handleMessage(
    message: BackgroundMessage,
    _sender: chrome.runtime.MessageSender
  ): Promise<unknown> {
    const { type } = message;

    // Route message to appropriate handler based on type prefix
    if (type.startsWith('TIMER_')) {
      return await this.handleTimerMessage(message);
    }

    if (type.startsWith('NUCLEAR_MODE_')) {
      return await this.handleNuclearModeMessage(message);
    }

    if (type.startsWith('ANALYTICS_')) {
      return await this.handleAnalyticsMessage(message);
    }

    if (type.startsWith('STREAK_')) {
      return await this.handleStreakMessage(message);
    }

    if (type.startsWith('BLOCKER_')) {
      return await this.handleBlockerMessage(message);
    }

    if (type.startsWith('BLOCKLIST_')) {
      return await this.handleBlockListMessage(message);
    }

    if (type.startsWith('SESSION_')) {
      return await this.handleSessionMessage(message);
    }

    if (type.startsWith('SETTINGS_')) {
      return await this.handleSettingsMessage(message);
    }

    if (type.startsWith('SCHEDULE_')) {
      return await this.handleScheduleMessage(message);
    }

    throw new BackgroundError(`Unknown message type: ${type}`);
  }

  /** Handle timer messages */
  private async handleTimerMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'TIMER_START':
        return await this.timerHandler.handleStart(message);
      case 'TIMER_PAUSE':
      case 'TIMER_RESUME':
      case 'TIMER_STOP':
      case 'TIMER_GET_STATUS':
        return await this.timerHandler.handleControl(message);
      default:
        throw new BackgroundError(`Unknown timer message type: ${message.type}`);
    }
  }

  /** Handle nuclear mode messages */
  private async handleNuclearModeMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'NUCLEAR_MODE_ACTIVATE':
        return await this.nuclearModeManager.activate(message.durationHours);
      case 'NUCLEAR_MODE_DEACTIVATE':
        return await this.nuclearModeManager.deactivate();
      case 'NUCLEAR_MODE_GET_STATUS':
        return {
          isActive: await this.nuclearModeManager.isActive(),
          remainingTime: await this.nuclearModeManager.getRemainingTime(),
        };
      default:
        throw new BackgroundError(`Unknown nuclear mode message type: ${message.type}`);
    }
  }

  /** Handle analytics messages */
  private async handleAnalyticsMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'ANALYTICS_GET':
        return await this.analyticsRepository.getAnalytics();
      case 'ANALYTICS_GET_FOCUS_SCORE':
        return await this.analyticsTracker.calculateFocusScore();
      case 'ANALYTICS_GET_WEEKLY_SUMMARY':
        return await this.analyticsTracker.getWeeklySummary();
      case 'ANALYTICS_GET_MONTHLY_SUMMARY':
        return await this.analyticsTracker.getMonthlySummary();
      default:
        throw new BackgroundError(`Unknown analytics message type: ${message.type}`);
    }
  }

  /** Handle streak messages */
  private async handleStreakMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'STREAK_GET':
        return await this.analyticsRepository.getStreak();
      case 'STREAK_CHECK': {
        const settings = await this.settingsRepository.getSettings();
        return await this.streakTracker.checkDailyStreak(
          settings.premiumLicenseKey !== undefined
        );
      }
      default:
        throw new BackgroundError(`Unknown streak message type: ${message.type}`);
    }
  }

  /** Handle blocker messages */
  private async handleBlockerMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'BLOCKER_SYNC_RULES':
        return await this.blockerEngine.syncRules();
      case 'BLOCKER_GET_STATS':
        return await this.blockerEngine.getStats();
      case 'BLOCKER_TRACK_ATTEMPT':
        return await this.blockerEngine.handleBlockedAttempt(message.domain);
      case 'BLOCKER_CHECK_ALLOWANCE':
        return await this.blockerEngine.checkAllowance(message.domain);
      case 'BLOCKER_GRANT_ACCESS':
        return await this.blockerEngine.grantTemporaryAccess(
          message.domain,
          message.durationMinutes
        );
      case 'BLOCKER_GET_TEMP_ACCESS':
        return await this.blockerEngine.getActiveTemporaryAccess(message.domain);
      default:
        throw new BackgroundError(`Unknown blocker message type: ${message.type}`);
    }
  }

  /** Handle blocklist messages */
  private async handleBlockListMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'BLOCKLIST_GET_ALL':
        return await this.blockListHandler.handleGetAll(message);
      case 'BLOCKLIST_ADD':
        return await this.blockListHandler.handleAdd(message);
      case 'BLOCKLIST_UPDATE':
        return await this.blockListHandler.handleUpdate(message);
      case 'BLOCKLIST_DELETE':
        return await this.blockListHandler.handleDelete(message);
      default:
        throw new BackgroundError(`Unknown blocklist message type: ${message.type}`);
    }
  }

  /** Handle session messages */
  private async handleSessionMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'SESSION_GET_HISTORY':
        return await this.sessionRepository.getSessionHistory(message.limit);
      case 'SESSION_GET_TODAY':
        return await this.sessionRepository.getTodaySessions();
      default:
        throw new BackgroundError(`Unknown session message type: ${message.type}`);
    }
  }

  /** Handle settings messages */
  private async handleSettingsMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'SETTINGS_GET':
        return await this.settingsRepository.getSettings();
      case 'SETTINGS_UPDATE':
        return await this.settingsRepository.updateSettings(message.updates);
      default:
        throw new BackgroundError(`Unknown settings message type: ${message.type}`);
    }
  }

  /** Handle schedule messages */
  private async handleScheduleMessage(message: BackgroundMessage): Promise<unknown> {
    switch (message.type) {
      case 'SCHEDULE_GET_ALL':
      case 'SCHEDULE_GET_NEXT':
        return await this.scheduleHandler.handleGet(message);
      case 'SCHEDULE_ADD':
        return await this.scheduleHandler.handleAdd(message);
      case 'SCHEDULE_UPDATE':
        return await this.scheduleHandler.handleUpdate(message);
      case 'SCHEDULE_DELETE':
        return await this.scheduleHandler.handleDelete(message);
      default:
        throw new BackgroundError(`Unknown schedule message type: ${message.type}`);
    }
  }

  /**
   * Set up chrome.alarms listener
   *
   * Handles timer ticks, midnight checks, and allowance resets.
   * @private
   */
  private setupAlarmListener(): void {
    chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
      void this.handleAlarm(alarm);
    });
  }

  /**
   * Handle alarm events
   * @private
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    try {
      switch (alarm.name) {
        case BackgroundServiceWorker.ALARM_TIMER_TICK: {
          // Timer engine handles its own ticks
          await this.timerEngine.tick();
          break;
        }

        case BackgroundServiceWorker.ALARM_MIDNIGHT_CHECK: {
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
        }

        case BackgroundServiceWorker.ALARM_ALLOWANCE_RESET: {
          // Reset daily allowances at midnight
          await this.blockerEngine.resetDailyAllowances();
          break;
        }

        default: {
          // Handle re-block alarms for temporary access expiry
          if (alarm.name.startsWith('reblock-')) {
            const domain = alarm.name.replace('reblock-', '');
            await this.blockerEngine.handleTemporaryAccessExpired(domain);
            break;
          }

          // Delegate to schedule manager for schedule-related alarms
          await this.scheduleManager.handleAlarm(alarm);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error(`Alarm handler error (${alarm.name})`, error as Error);
      }
    }
  }

  /**
   * Set up chrome.runtime.onSuspend listener
   *
   * Handles cleanup before service worker unloads.
   * @private
   */
  private setupSuspendListener(): void {
    if (chrome.runtime?.onSuspend) {
      chrome.runtime.onSuspend.addListener(() => {
        if (process.env.NODE_ENV === 'development') {
          log.info('Service worker suspending - performing cleanup');
        }
        // Note: Can't use async operations here as they may not complete
        // Storage writes are already debounced and will flush automatically
      });
    }
  }

  /**
   * Set up chrome.runtime.onInstalled listener
   *
   * Handles extension installation and updates.
   * @private
   */
  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
      void this.handleInstall(details);
    });
  }

  /**
   * Handle extension installation and updates
   * @private
   */
  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    try {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        if (process.env.NODE_ENV === 'development') {
          log.info('Extension installed');
        }

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
          iconUrl: chrome.runtime.getURL('/icons/icon_v10_128.png'),
          title: 'Focus Flow Installed!',
          message: "Welcome! Let's get you started with Focus Flow.",
        });
      } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (process.env.NODE_ENV === 'development') {
          log.info('Extension updated', { version: chrome.runtime.getManifest().version });
        }

        // Run migrations if needed
        await this.runMigrations(details.previousVersion);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        log.error('Install handler error', error as Error);
      }
    }
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

    if (process.env.NODE_ENV === 'development') {
      log.info('Midnight check scheduled', { minutesUntilMidnight: Math.round(minutesUntilMidnight) });
    }
  }

  /**
   * Restore timer state after browser restart
   *
   * Checks if there was an active session before restart and resumes it.
   * @private
   */
  private async restoreTimerState(): Promise<void> {
    const currentSession = await this.sessionRepository.getCurrentSession();

    if (currentSession?.status === 'active') {
      if (process.env.NODE_ENV === 'development') {
        log.info('Restoring timer state from session', { sessionId: currentSession.id });
      }

      // Calculate remaining time
      const elapsed = Math.floor(
        (Date.now() - currentSession.startTime.getTime()) / 1000
      );
      const totalSeconds = currentSession.duration; // duration is already in seconds
      const remainingSeconds = Math.max(0, totalSeconds - elapsed);

      if (remainingSeconds > 0) {
        // Resume the session (convert seconds to minutes for start method)
        await this.timerEngine.start(currentSession.type, currentSession.duration / 60);
      } else {
        // Session expired while browser was closed
        if (process.env.NODE_ENV === 'development') {
          log.info('Session expired, marking as abandoned');
        }
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
    if (!previousVersion) {
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      log.info('Running migrations', { fromVersion: previousVersion });
    }

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
  log.error('Failed to initialize background service worker', error as Error);
});

// Export for testing
export { BackgroundServiceWorker };
