/**
 * Message Types
 * Focus Flow Extension
 *
 * Type-safe message passing between popup/options and background service worker.
 * Uses discriminated unions for compile-time type safety.
 */

import { z } from 'zod';
import { PomodoroSession, AnalyticsData, StreakData, DailyStats, Settings } from './index';

/**
 * Background Message Types
 *
 * Discriminated union of all possible messages sent to background service worker.
 */
export type BackgroundMessage =
  // Timer commands
  | { type: 'TIMER_START'; sessionType: 'work' | 'short_break' | 'long_break'; duration: number }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME' }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_GET_STATUS' }

  // Nuclear mode commands
  | { type: 'NUCLEAR_MODE_ACTIVATE'; durationHours: number }
  | { type: 'NUCLEAR_MODE_DEACTIVATE' }
  | { type: 'NUCLEAR_MODE_GET_STATUS' }

  // Analytics queries
  | { type: 'ANALYTICS_GET' }
  | { type: 'ANALYTICS_GET_FOCUS_SCORE' }
  | { type: 'ANALYTICS_GET_WEEKLY_SUMMARY' }
  | { type: 'ANALYTICS_GET_MONTHLY_SUMMARY' }

  // Streak operations
  | { type: 'STREAK_GET' }
  | { type: 'STREAK_CHECK' }

  // Blocker operations
  | { type: 'BLOCKER_SYNC_RULES' }
  | { type: 'BLOCKER_GET_STATS' }
  | { type: 'BLOCKER_TRACK_ATTEMPT'; domain: string }

  // Session queries
  | { type: 'SESSION_GET_HISTORY'; limit?: number }
  | { type: 'SESSION_GET_TODAY' }

  // Settings operations
  | { type: 'SETTINGS_GET' }
  | { type: 'SETTINGS_UPDATE'; updates: Partial<Settings> };

/**
 * Background Response Type
 *
 * Generic wrapper for background service worker responses.
 * Includes success/failure discrimination for error handling.
 */
export type BackgroundResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Specific Response Types
 *
 * Type definitions for specific message responses.
 */
export interface TimerStatus {
  state: 'idle' | 'work' | 'short_break' | 'long_break' | 'paused';
  remainingSeconds: number;
  totalSeconds: number;
  sessionCount: number;
  isPaused: boolean;
}

export interface NuclearModeStatus {
  isActive: boolean;
  remainingTime: number; // seconds
}

export interface BlockerStats {
  isActive: boolean;
  rulesCount: number;
  blockedToday: number;
}

export interface ProductivitySummary {
  totalPomodoros: number;
  totalFocusTime: number; // minutes
  averagePerDay: number;
  completionRate: number; // 0-1
  topTasks: Array<{ task: string; count: number }>;
}

/**
 * Message Schemas (Zod)
 *
 * Runtime validation schemas for messages.
 */
export const TimerStartMessageSchema = z.object({
  type: z.literal('TIMER_START'),
  sessionType: z.enum(['work', 'short_break', 'long_break']),
  duration: z.number().int().positive().max(180), // Max 3 hours
});

export const NuclearModeActivateMessageSchema = z.object({
  type: z.literal('NUCLEAR_MODE_ACTIVATE'),
  durationHours: z.number().int().min(1).max(8),
});

export const BlockerTrackAttemptMessageSchema = z.object({
  type: z.literal('BLOCKER_TRACK_ATTEMPT'),
  domain: z.string().min(1).max(253), // Max domain length
});

export const SessionGetHistoryMessageSchema = z.object({
  type: z.literal('SESSION_GET_HISTORY'),
  limit: z.number().int().positive().max(1000).optional(),
});

export const SettingsUpdateMessageSchema = z.object({
  type: z.literal('SETTINGS_UPDATE'),
  updates: z.object({
    workDuration: z.number().int().positive().max(180).optional(),
    shortBreakDuration: z.number().int().positive().max(60).optional(),
    longBreakDuration: z.number().int().positive().max(120).optional(),
    sessionsUntilLongBreak: z.number().int().min(2).max(10).optional(),
    autoStartNextSession: z.boolean().optional(),
    enableNotifications: z.boolean().optional(),
    premiumLicenseKey: z.string().optional(),
  }),
});

/**
 * Type Guards
 *
 * Runtime type checking for messages.
 */
export function isTimerStartMessage(
  message: BackgroundMessage
): message is Extract<BackgroundMessage, { type: 'TIMER_START' }> {
  return message.type === 'TIMER_START';
}

export function isNuclearModeActivateMessage(
  message: BackgroundMessage
): message is Extract<BackgroundMessage, { type: 'NUCLEAR_MODE_ACTIVATE' }> {
  return message.type === 'NUCLEAR_MODE_ACTIVATE';
}

export function isBlockerTrackAttemptMessage(
  message: BackgroundMessage
): message is Extract<BackgroundMessage, { type: 'BLOCKER_TRACK_ATTEMPT' }> {
  return message.type === 'BLOCKER_TRACK_ATTEMPT';
}

export function isSettingsUpdateMessage(
  message: BackgroundMessage
): message is Extract<BackgroundMessage, { type: 'SETTINGS_UPDATE' }> {
  return message.type === 'SETTINGS_UPDATE';
}

/**
 * Message Sender Helper
 *
 * Type-safe wrapper for sending messages to background service worker.
 *
 * @example
 * ```typescript
 * const status = await sendBackgroundMessage({ type: 'TIMER_GET_STATUS' });
 * if (status.success) {
 *   console.log('Timer state:', status.data.state);
 * }
 * ```
 */
export async function sendBackgroundMessage<T = any>(
  message: BackgroundMessage
): Promise<BackgroundResponse<T>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Message Validator
 *
 * Validates messages against Zod schemas before sending.
 *
 * @param message - Message to validate
 * @returns Validation result
 */
export function validateMessage(message: BackgroundMessage): {
  valid: boolean;
  error?: string;
} {
  try {
    switch (message.type) {
      case 'TIMER_START':
        TimerStartMessageSchema.parse(message);
        break;

      case 'NUCLEAR_MODE_ACTIVATE':
        NuclearModeActivateMessageSchema.parse(message);
        break;

      case 'BLOCKER_TRACK_ATTEMPT':
        BlockerTrackAttemptMessageSchema.parse(message);
        break;

      case 'SESSION_GET_HISTORY':
        SessionGetHistoryMessageSchema.parse(message);
        break;

      case 'SETTINGS_UPDATE':
        SettingsUpdateMessageSchema.parse(message);
        break;

      // Other message types don't require additional validation
      default:
        break;
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}
