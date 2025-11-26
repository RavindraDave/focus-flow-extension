/**
 * Background Message Types
 * Focus Flow Extension
 *
 * Strict typing for background service worker messages.
 */

import type { PomodoroSession, UserSettings, BlockRule, Schedule } from '../types/index';

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
