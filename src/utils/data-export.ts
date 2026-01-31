/**
 * Data Export Utilities
 * Focus Flow Extension
 *
 * Export session and analytics data in CSV and JSON formats
 * Implements PRD Section 3.1 (FR-AN-004)
 */

import type { PomodoroSession, AnalyticsData } from '../types';

/**
 * Format date to ISO 8601 string
 * Complexity: 1 (simple formatting)
 */
function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Format duration in minutes to readable string
 * Complexity: 2 (calculation + formatting)
 */
function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes}`;
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 * Complexity: 3 (multiple escape rules)
 */
function escapeCSVField(field: string | number | undefined): string {
  if (field === undefined || field === null) {return '';}

  const str = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export sessions to CSV format
 * Complexity: 6 (array mapping + formatting + string building)
 *
 * @param sessions - Array of Pomodoro sessions to export
 * @returns CSV string with headers
 */
export function exportSessionsToCSV(sessions: PomodoroSession[]): string {
  // CSV headers
  const headers = [
    'ID',
    'Type',
    'Status',
    'Start Time',
    'End Time',
    'Planned Duration (min)',
    'Actual Duration (min)',
    'Task Name',
    'Category',
  ];

  // Build CSV rows
  const rows = sessions.map(session => [
    escapeCSVField(session.id),
    escapeCSVField(session.type),
    escapeCSVField(session.status),
    escapeCSVField(formatDate(session.startTime)),
    escapeCSVField(session.endTime ? formatDate(session.endTime) : ''),
    escapeCSVField(formatDuration(session.duration)),
    escapeCSVField(session.actualDuration ? formatDuration(session.actualDuration) : ''),
    escapeCSVField(session.taskName || ''),
    escapeCSVField(session.category || ''),
  ]);

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];

  return csvLines.join('\n');
}

/**
 * Export analytics data to JSON format
 * Complexity: 4 (data transformation + serialization)
 *
 * @param analytics - Complete analytics data
 * @param sessions - Optional session history to include
 * @returns Pretty-printed JSON string
 */
export function exportAnalyticsToJSON(
  analytics: AnalyticsData,
  sessions?: PomodoroSession[]
): string {
  const extensionVersion = chrome?.runtime?.getManifest?.()?.version ?? '1.0.0';

  const exportData = {
    exportDate: new Date().toISOString(),
    extensionVersion,
    analytics: {
      totalFocusTimeMinutes: analytics.totalFocusTimeMinutes,
      totalSessions: analytics.totalSessions,
      totalBreaks: analytics.totalBreaks,
      streak: {
        current: analytics.streak.currentStreak,
        longest: analytics.streak.longestStreak,
        lastSessionDate: analytics.streak.lastSessionDate
          ? formatDate(analytics.streak.lastSessionDate)
          : null,
        todayCompleted: analytics.streak.todayCompleted,
      },
      dailyStats: analytics.dailyStats.map(stat => ({
        date: formatDate(stat.date),
        focusTimeMinutes: stat.focusTimeMinutes,
        completedSessions: stat.completedSessions,
        abandonedSessions: stat.abandonedSessions,
        breaksTaken: stat.breaksTaken,
        sessionsByCategory: stat.sessionsByCategory,
        mostProductiveHour: stat.mostProductiveHour,
      })),
      achievements: analytics.achievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        unlockedAt: formatDate(achievement.unlockedAt),
        icon: achievement.icon,
      })),
    },
    sessions: sessions?.map(session => ({
      id: session.id,
      type: session.type,
      status: session.status,
      startTime: formatDate(session.startTime),
      endTime: session.endTime ? formatDate(session.endTime) : null,
      duration: session.duration,
      actualDuration: session.actualDuration,
      taskName: session.taskName,
      category: session.category,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Trigger browser download of data
 * Complexity: 4 (blob creation + URL + download + cleanup)
 *
 * @param content - File content (CSV or JSON string)
 * @param filename - Filename for download
 * @param mimeType - MIME type of file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  // Create blob from content
  const blob = new Blob([content], { type: mimeType });

  // Create object URL
  const url = URL.createObjectURL(blob);

  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Generate filename with timestamp
 * Complexity: 2 (date formatting + string building)
 *
 * @param prefix - Filename prefix (e.g., 'focus-flow-sessions')
 * @param extension - File extension (e.g., 'csv')
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0]?.replace(/:/g, '-'); // HH-MM-SS

  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}

/**
 * Export sessions as CSV and trigger download
 * Complexity: 3 (export + filename + download)
 *
 * @param sessions - Sessions to export
 */
export function exportSessionsAsCSV(sessions: PomodoroSession[]): void {
  const csv = exportSessionsToCSV(sessions);
  const filename = generateFilename('focus-flow-sessions', 'csv');
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export analytics as JSON and trigger download
 * Complexity: 3 (export + filename + download)
 *
 * @param analytics - Analytics data to export
 * @param sessions - Optional sessions to include
 */
export function exportAnalyticsAsJSON(
  analytics: AnalyticsData,
  sessions?: PomodoroSession[]
): void {
  const json = exportAnalyticsToJSON(analytics, sessions);
  const filename = generateFilename('focus-flow-data', 'json');
  downloadFile(json, filename, 'application/json;charset=utf-8;');
}
