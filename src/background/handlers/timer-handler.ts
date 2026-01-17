/**
 * Timer Message Handler
 * Focus Flow Extension
 *
 * Handles all timer-related messages.
 */

import type { TimerEngine } from '../timer-engine';
import type { SettingsRepository } from '../../services/settings-repository';
import type { TimerStartMessage, TimerControlMessage } from '../message-types';

export class TimerMessageHandler {
  constructor(
    private timerEngine: TimerEngine,
    private settingsRepository: SettingsRepository
  ) {}

  /**
   * Handle timer start message
   */
  async handleStart(message: TimerStartMessage): Promise<void> {
    const settings = await this.settingsRepository.getSettings();
    let duration: number;

    switch (message.sessionType) {
      case 'work':
        duration = settings.workDuration;
        break;
      case 'short-break':
        duration = settings.shortBreakDuration;
        break;
      case 'long-break':
        duration = settings.longBreakDuration;
        break;
    }

    return await this.timerEngine.start(message.sessionType, duration, message.taskName);
  }

  /**
   * Handle timer control messages
   */
  async handleControl(message: TimerControlMessage): Promise<unknown> {
    switch (message.type) {
      case 'TIMER_PAUSE':
        return await this.timerEngine.pause();
      case 'TIMER_RESUME':
        return await this.timerEngine.resume();
      case 'TIMER_STOP':
        return await this.timerEngine.stop();
      case 'TIMER_GET_STATUS':
        return await this.timerEngine.getStatus();
    }
  }
}
