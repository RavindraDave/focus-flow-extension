/**
 * Schedule Repository
 * Focus Flow Extension
 *
 * Manages Schedule persistence for automatic blocking.
 * Uses chrome.storage.local for unlimited storage.
 */

import { StorageService } from './storage-service';
import { Schedule } from '../types/index';
import { ScheduleSchema } from '../types/schemas';
import { STORAGE_KEYS } from '../utils/constants';
import { z } from 'zod';

/**
 * Repository for managing schedules
 *
 * @example
 * ```typescript
 * const repo = new ScheduleRepository();
 * const activeSchedules = await repo.getActiveSchedules();
 * ```
 */
export class ScheduleRepository {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * Serialize a schedule for storage
   *
   * Converts Date objects back to ISO strings for schema validation.
   *
   * @param schedule - Schedule with possible Date objects
   * @returns Schedule with date fields as ISO strings
   * @private
   */
  private serializeSchedule(schedule: Schedule): Schedule {
    return {
      ...schedule,
      createdAt: (schedule.createdAt instanceof Date
        ? schedule.createdAt.toISOString()
        : schedule.createdAt) as unknown as Date,
      updatedAt: (schedule.updatedAt instanceof Date
        ? schedule.updatedAt.toISOString()
        : schedule.updatedAt) as unknown as Date,
      exceptions: schedule.exceptions.map(exc =>
        (exc instanceof Date ? exc.toISOString() : exc) as unknown as Date
      ),
    };
  }

  /**
   * Get all schedules
   * Complexity: 3 (async + validation + default)
   *
   * @returns Array of all schedules
   */
  async getAllSchedules(): Promise<Schedule[]> {
    const schedules =
      (await this.storageService.get(
        STORAGE_KEYS.SCHEDULES,
        z.array(ScheduleSchema) as unknown as z.ZodType<Schedule[]>
      )) || [];

    return schedules;
  }

  /**
   * Get only enabled schedules
   * Complexity: 3 (async + filter)
   *
   * @returns Array of active schedules
   */
  async getActiveSchedules(): Promise<Schedule[]> {
    const allSchedules = await this.getAllSchedules();
    return allSchedules.filter(schedule => schedule.enabled);
  }

  /**
   * Add a new schedule
   * Complexity: 3 (async + validation)
   *
   * @param schedule - Schedule to add
   */
  async addSchedule(schedule: Schedule): Promise<void> {
    const schedules = await this.getAllSchedules();
    const serialized = this.serializeSchedule(schedule);
    schedules.push(serialized);

    // Serialize all schedules before saving
    const serializedSchedules = schedules.map(s => this.serializeSchedule(s));

    await this.storageService.set(
      STORAGE_KEYS.SCHEDULES,
      serializedSchedules,
      z.array(ScheduleSchema) as unknown as z.ZodType<Schedule[]>
    );
  }

  /**
   * Update an existing schedule
   * Complexity: 5 (async + find + validation + error handling)
   *
   * @param id - Schedule ID to update
   * @param updates - Partial schedule data to update
   * @throws Error if schedule not found
   */
  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<void> {
    const schedules = await this.getAllSchedules();
    const index = schedules.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: new Date().toISOString() as unknown as Date,
    } as Schedule;

    // Serialize all schedules before saving
    const serializedSchedules = schedules.map(s => this.serializeSchedule(s));

    await this.storageService.set(
      STORAGE_KEYS.SCHEDULES,
      serializedSchedules,
      z.array(ScheduleSchema) as unknown as z.ZodType<Schedule[]>
    );
  }

  /**
   * Delete a schedule
   * Complexity: 4 (async + filter + validation)
   *
   * @param id - Schedule ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteSchedule(id: string): Promise<boolean> {
    const schedules = await this.getAllSchedules();
    const initialLength = schedules.length;
    const filtered = schedules.filter(s => s.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    // Serialize all schedules before saving
    const serializedSchedules = filtered.map(s => this.serializeSchedule(s));

    await this.storageService.set(
      STORAGE_KEYS.SCHEDULES,
      serializedSchedules,
      z.array(ScheduleSchema) as unknown as z.ZodType<Schedule[]>
    );

    return true;
  }

  /**
   * Find a schedule by ID
   * Complexity: 3 (async + find)
   *
   * @param id - Schedule ID to find
   * @returns Schedule if found, null otherwise
   */
  async findById(id: string): Promise<Schedule | null> {
    const schedules = await this.getAllSchedules();
    return schedules.find(s => s.id === id) || null;
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
   * Get schedules that should be active at a given time
   * Complexity: 8 (async + date logic + filter + exception checking)
   *
   * @param dateTime - Date and time to check (defaults to now)
   * @returns Array of schedules that should be active
   */
  async getSchedulesForTime(dateTime: Date = new Date()): Promise<Schedule[]> {
    const activeSchedules = await this.getActiveSchedules();

    return activeSchedules.filter(schedule => {
      // Check if date is in exceptions list
      const dateString = dateTime.toISOString().split('T')[0];
      const isException = schedule.exceptions.some(
        exception => exception.toISOString().split('T')[0] === dateString
      );

      if (isException) {
        return false;
      }

      // Check day of week (locale-independent using getDay())
      const dayOfWeek = this.getDayName(dateTime.getDay());
      if (!schedule.daysOfWeek.includes(dayOfWeek as any)) {
        return false;
      }

      // Check time range
      const currentTime = dateTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      // Handle schedules that span midnight
      if (schedule.startTime <= schedule.endTime) {
        // Normal schedule (e.g., 09:00 - 17:00)
        return currentTime >= schedule.startTime && currentTime < schedule.endTime;
      } else {
        // Overnight schedule (e.g., 23:00 - 02:00)
        return currentTime >= schedule.startTime || currentTime < schedule.endTime;
      }
    });
  }

  /**
   * Delete all schedules
   * Complexity: 2 (async)
   */
  async deleteAllSchedules(): Promise<void> {
    await this.storageService.set(
      STORAGE_KEYS.SCHEDULES,
      [],
      z.array(ScheduleSchema) as unknown as z.ZodType<Schedule[]>,
      { debounce: false }
    );
  }
}
