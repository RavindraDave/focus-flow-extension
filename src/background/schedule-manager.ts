/**
 * Schedule Manager
 * Focus Flow Extension
 *
 * Manages automatic blocking based on user-defined schedules.
 * Uses chrome.alarms API for reliable time-based triggers.
 *
 * Performance target: Check schedules every 60 seconds
 * Timezone-aware: Uses Intl.DateTimeFormat for local time
 */

import { ScheduleRepository } from '../services/schedule-repository';
import { BlockRuleRepository } from '../services/block-rule-repository';
import type { Schedule } from '../types';

/**
 * Alarm name for schedule checks
 */
const SCHEDULE_CHECK_ALARM = 'schedule-check';

/**
 * Check interval in minutes
 */
const CHECK_INTERVAL_MINUTES = 1; // Check every minute for responsiveness

/**
 * Schedule Manager
 *
 * Coordinates automatic blocking based on time-based schedules.
 * Integrates with chrome.alarms for reliable timing.
 *
 * @example
 * ```typescript
 * const manager = new ScheduleManager(scheduleRepo, blockRuleRepo);
 * await manager.initialize();
 * ```
 */
export class ScheduleManager {
  private scheduleRepository: ScheduleRepository;
  private blockRuleRepository: BlockRuleRepository;
  private currentActiveScheduleIds: Set<string> = new Set();

  constructor(
    scheduleRepository: ScheduleRepository,
    blockRuleRepository: BlockRuleRepository
  ) {
    this.scheduleRepository = scheduleRepository;
    this.blockRuleRepository = blockRuleRepository;
  }

  /**
   * Convert JavaScript day number (0-6) to lowercase day name
   *
   * @param dayNumber - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   * @returns Lowercase day name matching DayOfWeekSchema
   * @private
   */
  private getDayName(dayNumber: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNumber] || 'monday';
  }

  /**
   * Initialize the schedule manager
   * Sets up chrome.alarms and performs initial check
   * Complexity: 4 (async + setup + error handling)
   */
  async initialize(): Promise<void> {
    try {
      // Clear any existing alarms
      await chrome.alarms.clear(SCHEDULE_CHECK_ALARM);

      // Create periodic alarm for schedule checks
      await chrome.alarms.create(SCHEDULE_CHECK_ALARM, {
        delayInMinutes: 0, // Run immediately
        periodInMinutes: CHECK_INTERVAL_MINUTES,
      });

      // Perform initial check
      await this.checkSchedules();

      console.log('[ScheduleManager] Initialized successfully');
    } catch (error) {
      console.error('[ScheduleManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check all schedules and activate/deactivate rules
   * Complexity: 8 (async + iteration + comparison + activation logic)
   *
   * @param dateTime - Optional datetime for testing
   */
  async checkSchedules(dateTime: Date = new Date()): Promise<void> {
    try {
      // Get schedules that should be active right now
      const activeSchedules = await this.scheduleRepository.getSchedulesForTime(dateTime);
      const newActiveScheduleIds = new Set(activeSchedules.map(s => s.id));

      // Find schedules that just became active
      const justActivated = activeSchedules.filter(
        schedule => !this.currentActiveScheduleIds.has(schedule.id)
      );

      // Find schedules that just became inactive
      const justDeactivated = Array.from(this.currentActiveScheduleIds).filter(
        id => !newActiveScheduleIds.has(id)
      );

      // Activate newly active schedules
      for (const schedule of justActivated) {
        await this.activateSchedule(schedule);
      }

      // Deactivate schedules that are no longer active
      for (const scheduleId of justDeactivated) {
        await this.deactivateSchedule(scheduleId);
      }

      // Update tracking
      this.currentActiveScheduleIds = newActiveScheduleIds;

      if (justActivated.length > 0 || justDeactivated.length > 0) {
        console.log(
          `[ScheduleManager] Activated: ${justActivated.length}, Deactivated: ${justDeactivated.length}`
        );
      }
    } catch (error) {
      console.error('[ScheduleManager] Error checking schedules:', error);
    }
  }

  /**
   * Activate a schedule by enabling its associated block rules
   * Complexity: 5 (async + iteration + notification)
   *
   * @param schedule - Schedule to activate
   */
  private async activateSchedule(schedule: Schedule): Promise<void> {
    try {
      // Enable all block rules associated with this schedule
      for (const ruleId of schedule.blockRuleIds) {
        await this.blockRuleRepository.updateRule(ruleId, { enabled: true });
      }

      // Send notification
      await this.sendScheduleNotification(schedule, true);

      console.log(`[ScheduleManager] Activated schedule: ${schedule.name}`);
    } catch (error) {
      console.error(`[ScheduleManager] Failed to activate schedule ${schedule.id}:`, error);
    }
  }

  /**
   * Deactivate a schedule by disabling its associated block rules
   * Complexity: 5 (async + iteration + notification)
   *
   * @param scheduleId - ID of schedule to deactivate
   */
  private async deactivateSchedule(scheduleId: string): Promise<void> {
    try {
      const schedule = await this.scheduleRepository.findById(scheduleId);

      if (!schedule) {
        console.warn(`[ScheduleManager] Schedule not found: ${scheduleId}`);
        return;
      }

      // Disable all block rules associated with this schedule
      // Note: Only disable if no other active schedules are using the same rules
      const otherActiveSchedules = await this.scheduleRepository.getSchedulesForTime();
      const otherActiveRuleIds = new Set(
        otherActiveSchedules
          .filter(s => s.id !== scheduleId)
          .flatMap(s => s.blockRuleIds)
      );

      for (const ruleId of schedule.blockRuleIds) {
        // Only disable if no other schedule is using this rule
        if (!otherActiveRuleIds.has(ruleId)) {
          await this.blockRuleRepository.updateRule(ruleId, { enabled: false });
        }
      }

      // Send notification
      await this.sendScheduleNotification(schedule, false);

      console.log(`[ScheduleManager] Deactivated schedule: ${schedule.name}`);
    } catch (error) {
      console.error(`[ScheduleManager] Failed to deactivate schedule ${scheduleId}:`, error);
    }
  }

  /**
   * Send notification when schedule activates/deactivates
   * Complexity: 4 (conditional + notification API)
   *
   * @param schedule - Schedule that changed state
   * @param isActivating - true if activating, false if deactivating
   */
  private async sendScheduleNotification(schedule: Schedule, isActivating: boolean): Promise<void> {
    try {
      const title = isActivating
        ? `Focus Mode Active: ${schedule.name}`
        : `Focus Mode Ended: ${schedule.name}`;

      const message = isActivating
        ? `Blocking active until ${schedule.endTime}`
        : `You can now access blocked sites`;

      await chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-128.png',
        title,
        message,
        priority: 1,
      });
    } catch (error) {
      console.error('[ScheduleManager] Failed to send notification:', error);
    }
  }

  /**
   * Get next upcoming schedule
   * Complexity: 9 (async + iteration + date calculations + sorting)
   *
   * @returns Next schedule and time until it starts
   */
  async getNextSchedule(): Promise<{
    schedule: Schedule | null;
    minutesUntilStart: number;
  }> {
    try {
      const allSchedules = await this.scheduleRepository.getActiveSchedules();
      const now = new Date();

      let nextSchedule: Schedule | null = null;
      let minMinutesUntilStart = Infinity;

      for (const schedule of allSchedules) {
        // Calculate time until next occurrence
        const minutesUntil = this.getMinutesUntilNextOccurrence(schedule, now);

        if (minutesUntil < minMinutesUntilStart) {
          minMinutesUntilStart = minutesUntil;
          nextSchedule = schedule;
        }
      }

      return {
        schedule: nextSchedule,
        minutesUntilStart: minMinutesUntilStart === Infinity ? -1 : minMinutesUntilStart,
      };
    } catch (error) {
      console.error('[ScheduleManager] Error getting next schedule:', error);
      return { schedule: null, minutesUntilStart: -1 };
    }
  }

  /**
   * Calculate minutes until next occurrence of a schedule
   * Complexity: 10 (date math + day iteration + time comparisons)
   *
   * @param schedule - Schedule to check
   * @param fromTime - Starting time (defaults to now)
   * @returns Minutes until next occurrence
   */
  private getMinutesUntilNextOccurrence(schedule: Schedule, fromTime: Date = new Date()): number {
    const timeParts = schedule.startTime.split(':').map(Number);
    const startHour = timeParts[0] || 0;
    const startMinute = timeParts[1] || 0;

    // Check each of the next 7 days
    for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
      const checkDate = new Date(fromTime);
      checkDate.setDate(checkDate.getDate() + daysAhead);
      checkDate.setHours(startHour, startMinute, 0, 0);

      // Check if this day is included in the schedule (locale-independent)
      const dayOfWeek = this.getDayName(checkDate.getDay());
      if (!schedule.daysOfWeek.includes(dayOfWeek as any)) {
        continue;
      }

      // Check if date is in exceptions
      const dateString = checkDate.toISOString().split('T')[0];
      const isException = schedule.exceptions.some(
        exception => exception.toISOString().split('T')[0] === dateString
      );

      if (isException) {
        continue;
      }

      // If this occurrence is in the future, calculate minutes until it
      if (checkDate > fromTime) {
        const msUntilStart = checkDate.getTime() - fromTime.getTime();
        return Math.floor(msUntilStart / (1000 * 60));
      }
    }

    return Infinity; // No occurrence found in next 7 days
  }

  /**
   * Handle alarm event
   * Called by chrome.alarms.onAlarm listener
   * Complexity: 2 (conditional + delegation)
   *
   * @param alarm - Chrome alarm that fired
   */
  async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === SCHEDULE_CHECK_ALARM) {
      await this.checkSchedules();
    }
  }
}
