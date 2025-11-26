/**
 * Schedule Message Handler
 * Focus Flow Extension
 *
 * Handles all schedule-related messages.
 */

import type { ScheduleRepository } from '../../services/schedule-repository';
import type { ScheduleManager } from '../schedule-manager';
import type {
  ScheduleGetMessage,
  ScheduleAddMessage,
  ScheduleUpdateMessage,
  ScheduleDeleteMessage
} from '../message-types';
import type { Schedule } from '../../types/index';

export class ScheduleMessageHandler {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private scheduleManager: ScheduleManager
  ) {}

  /**
   * Handle get schedule messages
   */
  async handleGet(message: ScheduleGetMessage): Promise<unknown> {
    switch (message.type) {
      case 'SCHEDULE_GET_ALL':
        return await this.scheduleRepository.getAllSchedules();
      case 'SCHEDULE_GET_NEXT':
        return await this.scheduleManager.getNextSchedule();
    }
  }

  /**
   * Handle add schedule
   */
  async handleAdd(message: ScheduleAddMessage): Promise<Schedule> {
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...message.schedule,
      id: crypto.randomUUID(),
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date
    };
    await this.scheduleRepository.addSchedule(newSchedule);
    await this.scheduleManager.checkSchedules();
    return newSchedule;
  }

  /**
   * Handle update schedule
   */
  async handleUpdate(message: ScheduleUpdateMessage): Promise<boolean> {
    const updates = {
      ...message.updates,
      updatedAt: new Date().toISOString() as unknown as Date
    };
    await this.scheduleRepository.updateSchedule(message.id, updates);
    await this.scheduleManager.checkSchedules();
    return true;
  }

  /**
   * Handle delete schedule
   */
  async handleDelete(message: ScheduleDeleteMessage): Promise<boolean> {
    const deleted = await this.scheduleRepository.deleteSchedule(message.id);
    if (deleted) {
      await this.scheduleManager.checkSchedules();
    }
    return deleted;
  }
}
