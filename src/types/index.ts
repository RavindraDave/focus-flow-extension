/**
 * Core TypeScript Type Definitions
 * Focus Flow Extension
 *
 * All data types used throughout the extension.
 * Based on PRD.md Section 6 and architecture.md.
 */

/**
 * Block rule for website blocking
 */
export interface BlockRule {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * User-defined name for the rule
   */
  name: string;

  /**
   * URL pattern or domain to block
   * Examples: "youtube.com", "*.reddit.com", "https://twitter.com/*"
   */
  pattern: string;

  /**
   * Type of pattern matching
   */
  type: 'domain' | 'keyword' | 'url';

  /**
   * Whether this rule is currently active
   */
  enabled: boolean;

  /**
   * Optional daily time allowance in minutes
   * null = full block, no access allowed
   */
  allowance: number | null;

  /**
   * Time used today in minutes (resets at midnight)
   */
  timeUsedToday: number;

  /**
   * Timestamp when this rule was created (ISO 8601)
   */
  createdAt: Date;

  /**
   * Timestamp when this rule was last updated (ISO 8601)
   */
  updatedAt: Date;
}

/**
 * Schedule for automatic blocking
 */
export interface Schedule {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * User-defined name for the schedule
   */
  name: string;

  /**
   * Whether this schedule is active
   */
  enabled: boolean;

  /**
   * Days when this schedule applies
   */
  daysOfWeek: DayOfWeek[];

  /**
   * Start time in HH:MM format (24-hour)
   */
  startTime: string;

  /**
   * End time in HH:MM format (24-hour)
   */
  endTime: string;

  /**
   * Block rule IDs to activate during this schedule
   */
  blockRuleIds: string[];

  /**
   * Whether to automatically start a timer when schedule activates
   */
  autoStartTimer?: boolean;

  /**
   * Timezone (IANA timezone identifier)
   */
  timezone: string;

  /**
   * Specific dates to skip (ISO 8601 date strings)
   */
  exceptions: Date[];

  /**
   * Timestamp when this schedule was created (ISO 8601)
   */
  createdAt: Date;

  /**
   * Timestamp when this schedule was last updated (ISO 8601)
   */
  updatedAt: Date;
}

/**
 * Days of the week
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * Time allowance for a specific website
 */
export interface TimeAllowance {
  /**
   * Block rule ID this allowance applies to
   */
  blockRuleId: string;

  /**
   * Daily limit in minutes
   */
  dailyLimitMinutes: number;

  /**
   * Time used today in minutes
   */
  timeUsedTodayMinutes: number;

  /**
   * Date when time was last reset (ISO 8601)
   */
  lastResetDate: Date;
}

/**
 * Pomodoro session record
 */
export interface PomodoroSession {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * Session type
   */
  type: SessionType;

  /**
   * Planned duration in seconds
   */
  duration: number;

  /**
   * When the session started (ISO 8601)
   */
  startTime: Date;

  /**
   * When the session ended (ISO 8601)
   * undefined if session is still active
   */
  endTime: Date | undefined;

  /**
   * Optional task name/description
   */
  taskName: string | undefined;

  /**
   * Optional category for analytics
   */
  category: string | undefined;

  /**
   * Session status
   */
  status: SessionStatus;

  /**
   * Actual time spent in seconds
   * (may differ from duration if session was paused/abandoned)
   */
  actualDuration: number | undefined;
}

/**
 * Session type discriminator
 */
export type SessionType = 'work' | 'short-break' | 'long-break';

/**
 * Session status discriminator
 */
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/**
 * User settings/preferences
 */
export interface UserSettings {
  /**
   * Pomodoro work duration in minutes
   * @default 25
   */
  workDuration: number;

  /**
   * Short break duration in minutes
   * @default 5
   */
  shortBreakDuration: number;

  /**
   * Long break duration in minutes
   * @default 15
   */
  longBreakDuration: number;

  /**
   * Number of work sessions before long break
   * @default 4
   */
  sessionsUntilLongBreak: number;

  /**
   * Whether to auto-start next session
   * @default false
   */
  autoStartNextSession: boolean;

  /**
   * Whether to play notification sounds
   * @default true
   */
  enableSounds: boolean;

  /**
   * Whether to show desktop notifications
   * @default true
   */
  enableNotifications: boolean;

  /**
   * Blocking mode
   * blacklist: Block specified sites (default)
   * whitelist: Allow only specified sites
   * @default 'blacklist'
   */
  blockingMode: 'blacklist' | 'whitelist';

  /**
   * Whether dark mode is enabled
   * @default 'system' (follows OS preference)
   */
  theme: 'light' | 'dark' | 'system';

  /**
   * YouTube-specific controls
   */
  youtubeControls: YouTubeConfig;

  /**
   * Nuclear mode configuration
   */
  nuclearMode: NuclearConfig;

  /**
   * Premium license key (encrypted)
   * undefined = free tier user
   */
  premiumLicenseKey: string | undefined;

  /**
   * Whether to sync settings across devices
   * Requires chrome.storage.sync permission
   * @default false
   */
  enableSync: boolean;
}

/**
 * YouTube-specific controls configuration
 */
export interface YouTubeConfig {
  /**
   * Whether YouTube controls are enabled
   * Premium feature
   * @default false
   */
  enabled: boolean;

  /**
   * Hide YouTube Shorts
   * @default false
   */
  hideShorts: boolean;

  /**
   * Hide recommended videos sidebar
   * @default false
   */
  hideRecommendations: boolean;

  /**
   * Hide comments section
   * @default false
   */
  hideComments: boolean;

  /**
   * Hide trending/home feed
   * @default false
   */
  hideFeed: boolean;
}

/**
 * Nuclear mode configuration
 */
export interface NuclearConfig {
  /**
   * Whether nuclear mode is currently active
   */
  active: boolean;

  /**
   * When nuclear mode will end (ISO 8601)
   * undefined if not active
   */
  endTime: Date | undefined;

  /**
   * HMAC-SHA256 signature of endTime
   * Used to detect tampering
   * undefined if not active
   */
  signature: string | undefined;

  /**
   * Device-specific secret for HMAC
   * Generated once per browser profile
   */
  deviceSecret: string;

  /**
   * Number of failed challenge attempts
   * Resets after timeout
   */
  challengeAttempts: number;

  /**
   * When challenge attempts counter was first incremented
   * undefined if no recent attempts
   */
  challengeAttemptsStartTime: Date | undefined;
}

/**
 * Analytics data aggregations
 */
export interface AnalyticsData {
  /**
   * Daily statistics (last 90 days)
   */
  dailyStats: DailyStats[];

  /**
   * Streak information
   */
  streak: StreakData;

  /**
   * Earned achievements
   */
  achievements: Achievement[];

  /**
   * Total focus time across all days (minutes)
   */
  totalFocusTimeMinutes: number;

  /**
   * Total sessions completed
   */
  totalSessions: number;

  /**
   * Total breaks taken
   */
  totalBreaks: number;
}

/**
 * Daily statistics
 */
export interface DailyStats {
  /**
   * Date (ISO 8601 date only, no time)
   */
  date: Date;

  /**
   * Total focus time in minutes
   */
  focusTimeMinutes: number;

  /**
   * Number of completed work sessions
   */
  completedSessions: number;

  /**
   * Number of abandoned sessions
   */
  abandonedSessions: number;

  /**
   * Number of breaks taken
   */
  breaksTaken: number;

  /**
   * Sessions by category (category name → count)
   */
  sessionsByCategory: Record<string, number>;

  /**
   * Most productive hour (0-23)
   * undefined if no sessions that day
   */
  mostProductiveHour: number | undefined;
}

/**
 * Streak tracking data
 */
export interface StreakData {
  /**
   * Current consecutive days with at least one completed session
   */
  currentStreak: number;

  /**
   * Longest streak ever achieved
   */
  longestStreak: number;

  /**
   * Last date a session was completed (ISO 8601)
   */
  lastSessionDate: Date | undefined;

  /**
   * Number of streak freezes available (premium feature)
   * Allows skipping one day without breaking streak
   */
  freezesAvailable: number;

  /**
   * Whether today's streak requirement is satisfied
   */
  todayCompleted: boolean;
}

/**
 * Achievement/badge
 */
export interface Achievement {
  /**
   * Achievement identifier
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Description
   */
  description: string;

  /**
   * Achievement category
   */
  category: AchievementCategory;

  /**
   * When this achievement was unlocked (ISO 8601)
   */
  unlockedAt: Date;

  /**
   * Icon identifier (emoji or icon name)
   */
  icon: string;
}

/**
 * Achievement categories
 */
export type AchievementCategory =
  | 'streak'
  | 'focus-time'
  | 'sessions'
  | 'consistency'
  | 'special';

/**
 * Complete extension storage schema
 */
export interface ExtensionStorage {
  /**
   * Schema version for migrations
   */
  version: number;

  /**
   * Currently active Pomodoro session
   * undefined if no active session
   */
  currentSession: PomodoroSession | undefined;

  /**
   * Historical sessions (last 90 days)
   */
  sessions: PomodoroSession[];

  /**
   * Block rules
   */
  blockRules: BlockRule[];

  /**
   * Schedules
   */
  schedules: Schedule[];

  /**
   * User settings
   */
  settings: UserSettings;

  /**
   * Analytics data
   */
  analytics: AnalyticsData;
}

/**
 * Validation result from schema validation
 */
export interface ValidationResult<T = unknown> {
  /**
   * Whether validation passed
   */
  success: boolean;

  /**
   * Validated data (only present if success = true)
   */
  data?: T;

  /**
   * Error message (only present if success = false)
   */
  error?: string;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  /**
   * Total bytes used
   */
  bytesUsed: number;

  /**
   * Total bytes available
   * chrome.storage.local = unlimited (but recommend <10MB)
   */
  bytesAvailable: number;

  /**
   * Percentage used (0-100)
   */
  percentageUsed: number;
}

/**
 * Type alias for backward compatibility
 */
export type Settings = UserSettings;
