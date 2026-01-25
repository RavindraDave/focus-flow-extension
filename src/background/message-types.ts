/**
 * Background Message Types
 * Focus Flow Extension
 *
 * Strict typing for background service worker messages.
 */

import { z } from 'zod';
import type { UserSettings, BlockRule, Schedule } from '../types/index';

/**
 * Timer Messages
 */
export interface TimerStartMessage {
  type: 'TIMER_START';
  sessionType: 'work' | 'short-break' | 'long-break';
  taskName?: string;
}

export interface TimerControlMessage {
  type: 'TIMER_PAUSE' | 'TIMER_RESUME' | 'TIMER_STOP' | 'TIMER_GET_STATUS';
}

/**
 * Nuclear Mode Messages
 */
export interface NuclearModeActivateMessage {
  type: 'NUCLEAR_MODE_ACTIVATE';
  durationHours: number;
}

export interface NuclearModeControlMessage {
  type: 'NUCLEAR_MODE_DEACTIVATE' | 'NUCLEAR_MODE_GET_STATUS';
}

/**
 * Analytics Messages
 */
export interface AnalyticsMessage {
  type: 'ANALYTICS_GET' | 'ANALYTICS_GET_FOCUS_SCORE' | 'ANALYTICS_GET_WEEKLY_SUMMARY' | 'ANALYTICS_GET_MONTHLY_SUMMARY';
}

/**
 * Streak Messages
 */
export interface StreakMessage {
  type: 'STREAK_GET' | 'STREAK_CHECK';
}

/**
 * Blocker Messages
 */
export interface BlockerSyncMessage {
  type: 'BLOCKER_SYNC_RULES' | 'BLOCKER_GET_STATS';
}

export interface BlockerTrackMessage {
  type: 'BLOCKER_TRACK_ATTEMPT';
  domain: string;
}

export interface BlockerCheckAllowanceMessage {
  type: 'BLOCKER_CHECK_ALLOWANCE';
  domain: string;
}

export interface BlockerGrantAccessMessage {
  type: 'BLOCKER_GRANT_ACCESS';
  domain: string;
  durationMinutes: number;
}

export interface BlockerGetTempAccessMessage {
  type: 'BLOCKER_GET_TEMP_ACCESS';
  domain: string;
}

/**
 * BlockList Messages
 */
export interface BlockListGetMessage {
  type: 'BLOCKLIST_GET_ALL';
}

export interface BlockListAddMessage {
  type: 'BLOCKLIST_ADD';
  rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface BlockListUpdateMessage {
  type: 'BLOCKLIST_UPDATE';
  id: string;
  updates: Partial<BlockRule>;
}

export interface BlockListDeleteMessage {
  type: 'BLOCKLIST_DELETE';
  id: string;
}

/**
 * Session Messages
 */
export interface SessionGetHistoryMessage {
  type: 'SESSION_GET_HISTORY';
  limit?: number;
}

export interface SessionGetTodayMessage {
  type: 'SESSION_GET_TODAY';
}

/**
 * Settings Messages
 */
export interface SettingsGetMessage {
  type: 'SETTINGS_GET';
}

export interface SettingsUpdateMessage {
  type: 'SETTINGS_UPDATE';
  updates: Partial<UserSettings>;
}

/**
 * Schedule Messages
 */
export interface ScheduleGetMessage {
  type: 'SCHEDULE_GET_ALL' | 'SCHEDULE_GET_NEXT';
}

export interface ScheduleAddMessage {
  type: 'SCHEDULE_ADD';
  schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface ScheduleUpdateMessage {
  type: 'SCHEDULE_UPDATE';
  id: string;
  updates: Partial<Schedule>;
}

export interface ScheduleDeleteMessage {
  type: 'SCHEDULE_DELETE';
  id: string;
}

/**
 * Union of all background messages
 */
export type BackgroundMessage =
  | TimerStartMessage
  | TimerControlMessage
  | NuclearModeActivateMessage
  | NuclearModeControlMessage
  | AnalyticsMessage
  | StreakMessage
  | BlockerSyncMessage
  | BlockerTrackMessage
  | BlockerCheckAllowanceMessage
  | BlockerGrantAccessMessage
  | BlockerGetTempAccessMessage
  | BlockListGetMessage
  | BlockListAddMessage
  | BlockListUpdateMessage
  | BlockListDeleteMessage
  | SessionGetHistoryMessage
  | SessionGetTodayMessage
  | SettingsGetMessage
  | SettingsUpdateMessage
  | ScheduleGetMessage
  | ScheduleAddMessage
  | ScheduleUpdateMessage
  | ScheduleDeleteMessage;

/**
 * Background response wrapper
 */
export interface BackgroundSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface BackgroundErrorResponse {
  success: false;
  error: string;
}

export type BackgroundResponse<T = unknown> = BackgroundSuccessResponse<T> | BackgroundErrorResponse;

/**
 * Message Validation Schemas (Runtime)
 * SECURITY: Validates message structure at runtime to prevent injection attacks
 */

// Base message type validator
const MessageTypeSchema = z.object({
  type: z.string().min(1).max(50),
});

// Timer messages
const TimerStartMessageSchema = z.object({
  type: z.literal('TIMER_START'),
  sessionType: z.enum(['work', 'short-break', 'long-break']),
  taskName: z.string().max(200).optional(),
});

// Nuclear mode messages
const NuclearModeActivateMessageSchema = z.object({
  type: z.literal('NUCLEAR_MODE_ACTIVATE'),
  durationHours: z.number().int().min(1).max(24),
});

// Blocker messages with domain validation
const BlockerTrackMessageSchema = z.object({
  type: z.literal('BLOCKER_TRACK_ATTEMPT'),
  domain: z.string().min(1).max(253),
});

const BlockerCheckAllowanceMessageSchema = z.object({
  type: z.literal('BLOCKER_CHECK_ALLOWANCE'),
  domain: z.string().min(1).max(253),
});

const BlockerGrantAccessMessageSchema = z.object({
  type: z.literal('BLOCKER_GRANT_ACCESS'),
  domain: z.string().min(1).max(253),
  durationMinutes: z.number().int().min(1).max(480),
});

const BlockerGetTempAccessMessageSchema = z.object({
  type: z.literal('BLOCKER_GET_TEMP_ACCESS'),
  domain: z.string().min(1).max(253),
});

// BlockList messages
const BlockListAddMessageSchema = z.object({
  type: z.literal('BLOCKLIST_ADD'),
  rule: z.object({
    name: z.string().min(1).max(100),
    pattern: z.string().min(1).max(2048),
    type: z.enum(['domain', 'url', 'keyword']),
    enabled: z.boolean(),
    allowance: z.number().int().min(1).max(480).nullable(),
  }),
});

const BlockListUpdateMessageSchema = z.object({
  type: z.literal('BLOCKLIST_UPDATE'),
  id: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    pattern: z.string().min(1).max(2048).optional(),
    type: z.enum(['domain', 'url', 'keyword']).optional(),
    enabled: z.boolean().optional(),
    allowance: z.number().int().min(1).max(480).nullable().optional(),
  }),
});

const BlockListDeleteMessageSchema = z.object({
  type: z.literal('BLOCKLIST_DELETE'),
  id: z.string().uuid(),
});

// Session messages
const SessionGetHistoryMessageSchema = z.object({
  type: z.literal('SESSION_GET_HISTORY'),
  limit: z.number().int().min(1).max(1000).optional(),
});

// Settings messages
const SettingsUpdateMessageSchema = z.object({
  type: z.literal('SETTINGS_UPDATE'),
  updates: z.object({
    workDuration: z.number().int().min(1).max(180).optional(),
    shortBreakDuration: z.number().int().min(1).max(60).optional(),
    longBreakDuration: z.number().int().min(1).max(120).optional(),
    sessionsUntilLongBreak: z.number().int().min(1).max(10).optional(),
    autoStartNextSession: z.boolean().optional(),
    enableNotifications: z.boolean().optional(),
    blockingMode: z.enum(['blacklist', 'whitelist']).optional(),
  }).passthrough(),
});

// Schedule messages
const ScheduleAddMessageSchema = z.object({
  type: z.literal('SCHEDULE_ADD'),
  schedule: z.object({
    name: z.string().min(1).max(100),
    enabled: z.boolean(),
    daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    timezone: z.string().min(1).max(50),
    blockRuleIds: z.array(z.string().uuid()),
    exceptions: z.array(z.string()),
    autoStartTimer: z.boolean().optional(),
  }),
});

const ScheduleUpdateMessageSchema = z.object({
  type: z.literal('SCHEDULE_UPDATE'),
  id: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    enabled: z.boolean().optional(),
    daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    timezone: z.string().min(1).max(50).optional(),
    blockRuleIds: z.array(z.string().uuid()).optional(),
    exceptions: z.array(z.string()).optional(),
    autoStartTimer: z.boolean().optional(),
  }),
});

const ScheduleDeleteMessageSchema = z.object({
  type: z.literal('SCHEDULE_DELETE'),
  id: z.string().uuid(),
});

/**
 * Validate a background message at runtime
 * SECURITY: Prevents malformed/malicious messages from being processed
 *
 * @param message - The message to validate
 * @returns Validation result with optional error message
 */
export function validateBackgroundMessage(message: unknown): { valid: boolean; error?: string } {
  // First, check basic message structure
  const baseResult = MessageTypeSchema.safeParse(message);
  if (!baseResult.success) {
    return { valid: false, error: 'Invalid message structure: missing or invalid type' };
  }

  const msg = message as { type: string };

  try {
    // Validate based on message type
    switch (msg.type) {
      case 'TIMER_START':
        TimerStartMessageSchema.parse(message);
        break;

      case 'NUCLEAR_MODE_ACTIVATE':
        NuclearModeActivateMessageSchema.parse(message);
        break;

      case 'BLOCKER_TRACK_ATTEMPT':
        BlockerTrackMessageSchema.parse(message);
        break;

      case 'BLOCKER_CHECK_ALLOWANCE':
        BlockerCheckAllowanceMessageSchema.parse(message);
        break;

      case 'BLOCKER_GRANT_ACCESS':
        BlockerGrantAccessMessageSchema.parse(message);
        break;

      case 'BLOCKER_GET_TEMP_ACCESS':
        BlockerGetTempAccessMessageSchema.parse(message);
        break;

      case 'BLOCKLIST_ADD':
        BlockListAddMessageSchema.parse(message);
        break;

      case 'BLOCKLIST_UPDATE':
        BlockListUpdateMessageSchema.parse(message);
        break;

      case 'BLOCKLIST_DELETE':
        BlockListDeleteMessageSchema.parse(message);
        break;

      case 'SESSION_GET_HISTORY':
        SessionGetHistoryMessageSchema.parse(message);
        break;

      case 'SETTINGS_UPDATE':
        SettingsUpdateMessageSchema.parse(message);
        break;

      case 'SCHEDULE_ADD':
        ScheduleAddMessageSchema.parse(message);
        break;

      case 'SCHEDULE_UPDATE':
        ScheduleUpdateMessageSchema.parse(message);
        break;

      case 'SCHEDULE_DELETE':
        ScheduleDeleteMessageSchema.parse(message);
        break;

      // Messages that don't require additional validation (no payload)
      case 'TIMER_PAUSE':
      case 'TIMER_RESUME':
      case 'TIMER_STOP':
      case 'TIMER_GET_STATUS':
      case 'NUCLEAR_MODE_DEACTIVATE':
      case 'NUCLEAR_MODE_GET_STATUS':
      case 'ANALYTICS_GET':
      case 'ANALYTICS_GET_FOCUS_SCORE':
      case 'ANALYTICS_GET_WEEKLY_SUMMARY':
      case 'ANALYTICS_GET_MONTHLY_SUMMARY':
      case 'STREAK_GET':
      case 'STREAK_CHECK':
      case 'BLOCKER_SYNC_RULES':
      case 'BLOCKER_GET_STATS':
      case 'BLOCKLIST_GET_ALL':
      case 'SESSION_GET_TODAY':
      case 'SETTINGS_GET':
      case 'SCHEDULE_GET_ALL':
      case 'SCHEDULE_GET_NEXT':
        // These messages only have a type field, no additional validation needed
        break;

      default:
        return { valid: false, error: `Unknown message type: ${msg.type}` };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        valid: false,
        error: `Validation failed: ${firstError?.path.join('.')} - ${firstError?.message}`
      };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}
