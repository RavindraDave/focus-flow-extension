/**
 * Application Constants
 * Focus Flow Extension
 *
 * Storage keys, default settings, and other application-wide constants.
 */

import type { UserSettings, AnalyticsData } from '../types';

/**
 * Storage keys for chrome.storage.local
 *
 * Use const assertion to get literal types
 */
export const STORAGE_KEYS = {
  VERSION: 'version',
  CURRENT_SESSION: 'currentSession',
  SESSIONS: 'sessions',
  BLOCK_RULES: 'blockRules',
  SCHEDULES: 'schedules',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  NUCLEAR_DEVICE_SECRET: 'nuclearDeviceSecret',
} as const;

/**
 * Storage key type for type safety
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Current storage schema version
 * Increment this when making breaking changes to storage schema
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Maximum storage size recommendations
 * chrome.storage.local is unlimited, but we should be mindful of performance
 */
export const STORAGE_LIMITS = {
  /**
   * Target maximum total storage size (10MB)
   * Beyond this, consider cleanup strategies
   */
  TARGET_MAX_BYTES: 10 * 1024 * 1024, // 10MB

  /**
   * Maximum number of sessions to keep in history
   * Keeps last 90 days, older sessions aggregated into daily stats
   */
  MAX_SESSIONS_HISTORY: 1000,

  /**
   * Maximum number of daily stats records
   * 90 days of detailed stats
   */
  MAX_DAILY_STATS: 90,

  /**
   * Maximum number of block rules (free tier)
   */
  MAX_BLOCK_RULES_FREE: 5,

  /**
   * Maximum number of block rules (premium tier)
   */
  MAX_BLOCK_RULES_PREMIUM: 1000,

  /**
   * Maximum number of schedules (free tier)
   */
  MAX_SCHEDULES_FREE: 1,

  /**
   * Maximum number of schedules (premium tier)
   */
  MAX_SCHEDULES_PREMIUM: 20,
} as const;

/**
 * Estimated storage size per data type (bytes)
 * Used for quota management
 */
export const STORAGE_SIZE_ESTIMATES = {
  BLOCK_RULE: 200, // ~200 bytes per rule
  SCHEDULE: 300, // ~300 bytes per schedule
  SESSION: 150, // ~150 bytes per session
  DAILY_STATS: 250, // ~250 bytes per daily stat
  ACHIEVEMENT: 200, // ~200 bytes per achievement
  SETTINGS: 1000, // ~1KB for all settings
} as const;

/**
 * Default user settings
 * Used for initialization and reset
 */
export const DEFAULT_SETTINGS: UserSettings = {
  // Pomodoro durations (in minutes)
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,

  // Behavior
  autoStartNextSession: false,
  enableSounds: true,
  enableNotifications: true,

  // Appearance
  theme: 'system',

  // YouTube controls (premium feature)
  youtubeControls: {
    enabled: false,
    hideShorts: false,
    hideRecommendations: false,
    hideComments: false,
    hideFeed: false,
  },

  // Nuclear mode
  nuclearMode: {
    active: false,
    endTime: undefined,
    signature: undefined,
    deviceSecret: '', // Will be generated on first use
    challengeAttempts: 0,
    challengeAttemptsStartTime: undefined,
  },

  // Premium
  premiumLicenseKey: undefined,
  enableSync: false,
};

/**
 * Default analytics data
 */
export const DEFAULT_ANALYTICS: AnalyticsData = {
  dailyStats: [],
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: undefined,
    freezesAvailable: 0,
    todayCompleted: false,
  },
  achievements: [],
  totalFocusTimeMinutes: 0,
  totalSessions: 0,
  totalBreaks: 0,
};

/**
 * Pomodoro timer defaults (seconds)
 */
export const TIMER_DEFAULTS = {
  WORK_DURATION: 25 * 60, // 25 minutes
  SHORT_BREAK_DURATION: 5 * 60, // 5 minutes
  LONG_BREAK_DURATION: 15 * 60, // 15 minutes
  SESSIONS_UNTIL_LONG_BREAK: 4,
} as const;

/**
 * Nuclear mode constraints
 */
export const NUCLEAR_MODE_CONSTRAINTS = {
  /**
   * Minimum duration (1 hour)
   */
  MIN_DURATION_HOURS: 1,

  /**
   * Maximum duration (8 hours)
   */
  MAX_DURATION_HOURS: 8,

  /**
   * Maximum challenge attempts before timeout
   */
  MAX_CHALLENGE_ATTEMPTS: 3,

  /**
   * Challenge attempt timeout (1 hour)
   */
  CHALLENGE_TIMEOUT_MS: 60 * 60 * 1000,

  /**
   * Cooling off period before activation (30 seconds)
   */
  COOLING_OFF_PERIOD_MS: 30 * 1000,
} as const;

/**
 * Analytics constraints
 */
export const ANALYTICS_CONSTRAINTS = {
  /**
   * Days to keep detailed session history
   */
  DETAILED_HISTORY_DAYS: 90,

  /**
   * Days to keep aggregated stats
   */
  AGGREGATED_STATS_DAYS: 365,
} as const;

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  /**
   * Maximum storage writes per minute
   * Chrome limit: 120/minute
   * Our limit: 60/minute (leave headroom)
   */
  STORAGE_WRITES_PER_MINUTE: 60,

  /**
   * Debounce delay for storage writes (ms)
   */
  STORAGE_WRITE_DEBOUNCE_MS: 500,

  /**
   * Maximum AI API calls per hour (premium feature)
   */
  AI_API_CALLS_PER_HOUR: 60,
} as const;

/**
 * Feature flags for free vs premium tiers
 */
export const FEATURE_FLAGS = {
  FREE: {
    maxBlockRules: STORAGE_LIMITS.MAX_BLOCK_RULES_FREE,
    maxSchedules: STORAGE_LIMITS.MAX_SCHEDULES_FREE,
    youtubeControls: false,
    nuclearMode: false,
    taskCategorization: false,
    aiInsights: false,
    streakFreezes: false,
    dataExport: false,
    detailedAnalytics: false, // Only today + this week
  },
  PREMIUM: {
    maxBlockRules: STORAGE_LIMITS.MAX_BLOCK_RULES_PREMIUM,
    maxSchedules: STORAGE_LIMITS.MAX_SCHEDULES_PREMIUM,
    youtubeControls: true,
    nuclearMode: true,
    taskCategorization: true,
    aiInsights: false, // Premium+ only
    streakFreezes: true,
    dataExport: true,
    detailedAnalytics: true, // 90 days detailed
  },
  PREMIUM_PLUS: {
    maxBlockRules: STORAGE_LIMITS.MAX_BLOCK_RULES_PREMIUM,
    maxSchedules: STORAGE_LIMITS.MAX_SCHEDULES_PREMIUM,
    youtubeControls: true,
    nuclearMode: true,
    taskCategorization: true,
    aiInsights: true,
    streakFreezes: true,
    dataExport: true,
    detailedAnalytics: true,
  },
} as const;

/**
 * Security constants
 */
export const SECURITY = {
  /**
   * HMAC secret minimum length (bytes)
   */
  HMAC_SECRET_MIN_LENGTH: 32,

  /**
   * HMAC signature length (hex string, SHA-256 = 64 chars)
   */
  HMAC_SIGNATURE_LENGTH: 64,

  /**
   * Maximum URL pattern length (prevent DoS)
   */
  MAX_URL_PATTERN_LENGTH: 2048,

  /**
   * Maximum text input length (prevent storage exhaustion)
   */
  MAX_TEXT_INPUT_LENGTH: 1000,

  /**
   * Dangerous object keys (prototype pollution prevention)
   */
  DANGEROUS_KEYS: ['__proto__', 'constructor', 'prototype'] as const,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Please clear old data or upgrade to premium.',
  INVALID_LICENSE_KEY: 'Invalid license key format.',
  NUCLEAR_MODE_ACTIVE: 'Cannot modify settings while nuclear mode is active.',
  MAX_BLOCK_RULES_REACHED: 'Maximum block rules reached. Upgrade to premium for unlimited rules.',
  MAX_SCHEDULES_REACHED: 'Maximum schedules reached. Upgrade to premium for more schedules.',
  VALIDATION_FAILED: 'Data validation failed. Please check your input.',
  MIGRATION_FAILED: 'Storage migration failed. Please contact support.',
  PROTOTYPE_POLLUTION: 'Dangerous key detected. Operation blocked for security.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SETTINGS_SAVED: 'Settings saved successfully.',
  BLOCK_RULE_CREATED: 'Block rule created successfully.',
  BLOCK_RULE_UPDATED: 'Block rule updated successfully.',
  BLOCK_RULE_DELETED: 'Block rule deleted successfully.',
  SCHEDULE_CREATED: 'Schedule created successfully.',
  SCHEDULE_UPDATED: 'Schedule updated successfully.',
  SCHEDULE_DELETED: 'Schedule deleted successfully.',
  NUCLEAR_MODE_ACTIVATED: 'Nuclear mode activated. Stay focused!',
  NUCLEAR_MODE_DEACTIVATED: 'Nuclear mode deactivated.',
  DATA_EXPORTED: 'Data exported successfully.',
} as const;
