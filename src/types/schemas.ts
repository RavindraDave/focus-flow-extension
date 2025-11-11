/**
 * Zod Validation Schemas
 * Focus Flow Extension
 *
 * Runtime validation for all data types.
 * Implements security validations from security-standards.md (OWASP ASVS Level 2).
 */

import { z } from 'zod';

/**
 * Dangerous keys that could cause prototype pollution
 * ASVS V5.1.1 - Prevent prototype pollution attacks
 */
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Validate that object keys don't include dangerous property names
 */
function validateNoPrototypePollution(obj: Record<string, unknown>): boolean {
  return !Object.keys(obj).some((key) => DANGEROUS_KEYS.includes(key));
}

/**
 * Custom refinement for safe objects
 */
const safeObjectRefinement = z.record(z.unknown()).refine(
  (obj) => validateNoPrototypePollution(obj),
  {
    message: 'Object contains dangerous prototype pollution keys',
  }
);

/**
 * URL pattern validation
 * ASVS V5.2.6 - Prevent SSRF attacks
 *
 * Validates:
 * - Max length (2048 chars)
 * - Allowed protocols (http/https only)
 * - No localhost/private IPs
 * - No special characters that could cause injection
 */
export const UrlPatternSchema = z
  .string()
  .min(1, 'Pattern cannot be empty')
  .max(2048, 'Pattern too long (max 2048 characters)')
  .refine(
    (pattern) => {
      // Allow domain patterns (no protocol)
      if (!pattern.includes('://')) {
        // Domain or wildcard domain pattern
        const domainPattern = /^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)*$/i;
        return domainPattern.test(pattern);
      }

      // Full URL validation
      try {
        const url = new URL(pattern);

        // Only HTTP/HTTPS allowed
        if (!['http:', 'https:'].includes(url.protocol)) {
          return false;
        }

        // Prevent localhost/private IPs (SSRF protection)
        const hostname = url.hostname.toLowerCase();
        const privatePatterns = [
          /^localhost$/,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[01])\./,
          /^192\.168\./,
          /^0\.0\.0\.0$/,
          /^\[::1\]$/, // IPv6 localhost
        ];

        if (privatePatterns.some((p) => p.test(hostname))) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    },
    {
      message:
        'Invalid URL pattern. Must be a domain (e.g., "youtube.com") or HTTP/HTTPS URL. Localhost/private IPs not allowed.',
    }
  );

/**
 * Time format validation (HH:MM in 24-hour format)
 * ASVS V5.1.1 - Input validation
 */
export const TimeFormatSchema = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM (24-hour format)',
  });

/**
 * IANA timezone validation
 */
export const TimezoneSchema = z
  .string()
  .min(1)
  .refine(
    (tz) => {
      try {
        // Validate timezone by attempting to create a formatter
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid timezone. Use IANA timezone identifier (e.g., "America/New_York")',
    }
  );

/**
 * UUID v4 validation
 */
export const UUIDSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * ISO 8601 date string schema
 */
export const DateSchema = z
  .string()
  .datetime({ message: 'Invalid ISO 8601 date format' })
  .transform((str) => new Date(str));

/**
 * Sanitized text input helper function
 * ASVS V5.2.8 - Input sanitization
 *
 * Prevents:
 * - HTML injection
 * - Script injection
 * - Excessive length
 */
export function createSanitizedTextSchema(maxLength: number = 1000) {
  return z
    .string()
    .max(maxLength, `Text too long (max ${maxLength} characters)`)
    .refine(
      (text) => {
        // No HTML tags allowed
        const hasHtml = /<[^>]*>/g.test(text);
        return !hasHtml;
      },
      {
        message: 'HTML tags not allowed in text input',
      }
    );
}

/**
 * Default sanitized text schema (max 1000 chars)
 */
export const SanitizedTextSchema = createSanitizedTextSchema(1000);

/**
 * Days of week enum
 */
export const DayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/**
 * Session type enum
 */
export const SessionTypeSchema = z.enum(['work', 'short-break', 'long-break']);

/**
 * Session status enum
 */
export const SessionStatusSchema = z.enum(['active', 'paused', 'completed', 'abandoned']);

/**
 * Achievement category enum
 */
export const AchievementCategorySchema = z.enum([
  'streak',
  'focus-time',
  'sessions',
  'consistency',
  'special',
]);

/**
 * BlockRule schema
 */
export const BlockRuleSchema = z.object({
  id: UUIDSchema,
  name: createSanitizedTextSchema(100),
  pattern: UrlPatternSchema,
  type: z.enum(['domain', 'keyword', 'url']),
  enabled: z.boolean(),
  allowance: z.number().int().min(0).max(1440).nullable(),
  timeUsedToday: z.number().int().min(0).max(1440).default(0),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

/**
 * Schedule schema
 */
export const ScheduleSchema = z.object({
  id: UUIDSchema,
  name: createSanitizedTextSchema(100),
  enabled: z.boolean(),
  daysOfWeek: z.array(DayOfWeekSchema).min(1, 'At least one day must be selected'),
  startTime: TimeFormatSchema,
  endTime: TimeFormatSchema,
  blockRuleIds: z.array(UUIDSchema),
  timezone: TimezoneSchema,
  exceptions: z.array(DateSchema).default([]),
  createdAt: DateSchema,
  updatedAt: DateSchema,
}).refine(
  (schedule) => {
    // Validate that endTime is after startTime
    const startParts = schedule.startTime.split(':').map(Number);
    const endParts = schedule.endTime.split(':').map(Number);
    const startHour = startParts[0] ?? 0;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 0;
    const endMin = endParts[1] ?? 0;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

/**
 * TimeAllowance schema
 */
export const TimeAllowanceSchema = z.object({
  blockRuleId: UUIDSchema,
  dailyLimitMinutes: z.number().int().min(1).max(1440),
  timeUsedTodayMinutes: z.number().int().min(0).max(1440),
  lastResetDate: DateSchema,
});

/**
 * PomodoroSession schema
 */
export const PomodoroSessionSchema = z.object({
  id: UUIDSchema,
  type: SessionTypeSchema,
  duration: z.number().int().min(60).max(3600), // 1 minute to 1 hour
  startTime: DateSchema,
  endTime: DateSchema.optional(),
  taskName: createSanitizedTextSchema(200).optional(),
  category: createSanitizedTextSchema(50).optional(),
  status: SessionStatusSchema,
  actualDuration: z.number().int().min(0).max(3600).optional(),
});

/**
 * YouTubeConfig schema
 */
export const YouTubeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  hideShorts: z.boolean().default(false),
  hideRecommendations: z.boolean().default(false),
  hideComments: z.boolean().default(false),
  hideFeed: z.boolean().default(false),
});

/**
 * NuclearConfig schema
 * ASVS V6.2.1 - Cryptographic integrity
 */
export const NuclearConfigSchema = z.object({
  active: z.boolean(),
  endTime: DateSchema.optional(),
  signature: z.string().length(64).optional(), // HMAC-SHA256 = 64 hex chars
  deviceSecret: z.string().min(32), // Cryptographically secure random
  challengeAttempts: z.number().int().min(0).max(10).default(0),
  challengeAttemptsStartTime: DateSchema.optional(),
}).refine(
  (config) => {
    // If active, must have endTime and signature
    if (config.active) {
      return config.endTime !== undefined && config.signature !== undefined;
    }
    return true;
  },
  {
    message: 'Active nuclear mode must have endTime and signature',
  }
);

/**
 * UserSettings schema
 */
export const UserSettingsSchema = z.object({
  workDuration: z.number().int().min(1).max(120).default(25),
  shortBreakDuration: z.number().int().min(1).max(30).default(5),
  longBreakDuration: z.number().int().min(1).max(60).default(15),
  sessionsUntilLongBreak: z.number().int().min(2).max(10).default(4),
  autoStartNextSession: z.boolean().default(false),
  enableSounds: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  youtubeControls: YouTubeConfigSchema,
  nuclearMode: NuclearConfigSchema,
  premiumLicenseKey: z.string().optional(),
  enableSync: z.boolean().default(false),
});

/**
 * DailyStats schema
 */
export const DailyStatsSchema = z.object({
  date: DateSchema,
  focusTimeMinutes: z.number().int().min(0),
  completedSessions: z.number().int().min(0),
  abandonedSessions: z.number().int().min(0),
  breaksTaken: z.number().int().min(0),
  sessionsByCategory: safeObjectRefinement,
  mostProductiveHour: z.number().int().min(0).max(23).optional(),
});

/**
 * StreakData schema
 */
export const StreakDataSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastSessionDate: DateSchema.optional(),
  freezesAvailable: z.number().int().min(0).max(7).default(0),
  todayCompleted: z.boolean().default(false),
});

/**
 * Achievement schema
 */
export const AchievementSchema = z.object({
  id: UUIDSchema,
  name: createSanitizedTextSchema(100),
  description: createSanitizedTextSchema(500),
  category: AchievementCategorySchema,
  unlockedAt: DateSchema,
  icon: z.string().max(50), // Emoji or icon identifier
});

/**
 * AnalyticsData schema
 */
export const AnalyticsDataSchema = z.object({
  dailyStats: z.array(DailyStatsSchema),
  streak: StreakDataSchema,
  achievements: z.array(AchievementSchema),
  totalFocusTimeMinutes: z.number().int().min(0),
  totalSessions: z.number().int().min(0),
  totalBreaks: z.number().int().min(0),
});

/**
 * ExtensionStorage schema
 * Complete storage schema for the extension
 */
export const ExtensionStorageSchema = z.object({
  version: z.number().int().min(0).default(1),
  currentSession: PomodoroSessionSchema.optional(),
  sessions: z.array(PomodoroSessionSchema).default([]),
  blockRules: z.array(BlockRuleSchema).default([]),
  schedules: z.array(ScheduleSchema).default([]),
  settings: UserSettingsSchema,
  analytics: AnalyticsDataSchema,
});

/**
 * Partial settings update schema
 * For updating only specific settings fields
 */
export const PartialUserSettingsSchema = UserSettingsSchema.partial();

/**
 * Storage key validation
 * ASVS V5.1.1 - Prevent prototype pollution via storage keys
 */
export const StorageKeySchema = z
  .string()
  .min(1, 'Storage key cannot be empty')
  .max(100, 'Storage key too long (max 100 characters)')
  .refine(
    (key) => !DANGEROUS_KEYS.includes(key),
    {
      message: 'Storage key contains dangerous prototype pollution key',
    }
  );

/**
 * Type exports for TypeScript inference
 */
export type BlockRuleInput = z.input<typeof BlockRuleSchema>;
export type BlockRuleOutput = z.output<typeof BlockRuleSchema>;

export type ScheduleInput = z.input<typeof ScheduleSchema>;
export type ScheduleOutput = z.output<typeof ScheduleSchema>;

export type PomodoroSessionInput = z.input<typeof PomodoroSessionSchema>;
export type PomodoroSessionOutput = z.output<typeof PomodoroSessionSchema>;

export type UserSettingsInput = z.input<typeof UserSettingsSchema>;
export type UserSettingsOutput = z.output<typeof UserSettingsSchema>;

export type ExtensionStorageInput = z.input<typeof ExtensionStorageSchema>;
export type ExtensionStorageOutput = z.output<typeof ExtensionStorageSchema>;
