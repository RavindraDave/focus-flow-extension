/**
 * AnalyticsDashboard - Productivity analytics with charts
 * Uses Chart.js for visualizations
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks';
import { Badge } from '../../components/atoms/Badge';
import { Spinner } from '../../components/atoms/Spinner';
import {
  FocusTimeChart,
  SessionDistributionChart,
  ProductivityByHourChart,
} from '../../components/molecules';
import {
  exportSessionsAsCSV,
  exportAnalyticsAsJSON,
} from '../../utils/data-export';
import type { PomodoroSession, DailyStats, AnalyticsData } from '../../types';
import { createLogger } from '../../utils/logger';

/**
 * Weekly/Monthly productivity summary from analytics tracker
 */
interface ProductivitySummary {
  totalPomodoros: number;
  totalFocusTime: number;
  averagePerDay: number;
  completionRate: number;
  topCategories: Array<{ category: string; count: number }>;
}

/**
 * Serialized DailyStats (dates as strings from JSON)
 */
interface SerializedDailyStats extends Omit<DailyStats, 'date'> {
  date: string;
}

/**
 * Serialized PomodoroSession (dates as strings from JSON)
 */
interface SerializedPomodoroSession extends Omit<PomodoroSession, 'startTime' | 'endTime'> {
  startTime: string;
  endTime?: string;
}

const log = createLogger('AnalyticsDashboard');

/**
 * Format minutes into hours and minutes
 * Complexity: 3 (calculation + conditional formatting)
 */
function formatDuration(minutes: number): string {
  if (minutes === 0) {return '0min';}
  if (minutes < 60) {return `${minutes}min`;}

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {return `${hours}h`;}
  return `${hours}h ${mins}min`;
}

/**
 * AnalyticsDashboard component
 * Complexity: 7 (multiple data fetches + conditional rendering + data transformation)
 */
export const AnalyticsDashboard: React.FC = () => {
  const { todayStats, streak, isLoading, error } = useAnalytics();
  const [weeklyData, setWeeklyData] = useState<ProductivitySummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Fetch analytics data and sessions for charts
   * Complexity: 5 (async + parallel fetches + error handling)
   */
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const [weeklyResponse, analyticsResponse, sessionsResponse] = await Promise.all([
          chrome.runtime.sendMessage({ type: 'ANALYTICS_GET_WEEKLY_SUMMARY' }),
          chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' }),
          chrome.runtime.sendMessage({ type: 'SESSION_GET_HISTORY', limit: 100 }),
        ]);

        if (weeklyResponse.success && weeklyResponse.data) {
          setWeeklyData(weeklyResponse.data);
        }

        if (analyticsResponse.success && analyticsResponse.data) {
          // Store full analytics data for export
          setAnalyticsData(analyticsResponse.data);

          // Convert date strings back to Date objects
          const statsWithDates = (analyticsResponse.data.dailyStats || []).map((stat: SerializedDailyStats) => ({
            ...stat,
            date: new Date(stat.date),
          }));
          setDailyStats(statsWithDates);
        }

        if (sessionsResponse.success && sessionsResponse.data) {
          // Convert date strings back to Date objects
          const sessionsWithDates = sessionsResponse.data.map((session: SerializedPomodoroSession) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
          }));
          setSessions(sessionsWithDates);
        }
      } catch (err) {
        log.error('Failed to fetch chart data', err instanceof Error ? err : undefined);
      }
    };

    fetchChartData();
  }, []);

  /**
   * Get last 7 days of focus time data
   * Complexity: 5 (date manipulation + array operations)
   */
  const getLast7DaysFocusTime = (): { labels: string[]; data: number[] } => {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();

    // Get last 7 days in reverse order (oldest to newest)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Format label (e.g., "Mon", "Tue")
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayLabel);

      // Find matching stat
      const stat = dailyStats.find(s => {
        const statDate = new Date(s.date);
        statDate.setHours(0, 0, 0, 0);
        return statDate.getTime() === date.getTime();
      });

      data.push(stat?.focusTimeMinutes || 0);
    }

    return { labels, data };
  };

  /**
   * Get session distribution data
   * Complexity: 4 (filtering + counting)
   */
  const getSessionDistribution = (): {
    work: number;
    shortBreaks: number;
    longBreaks: number;
  } => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    return {
      work: completedSessions.filter(s => s.type === 'work').length,
      shortBreaks: completedSessions.filter(s => s.type === 'short-break').length,
      longBreaks: completedSessions.filter(s => s.type === 'long-break').length,
    };
  };

  /**
   * Get productivity by hour data
   * Complexity: 5 (array operations + grouping)
   */
  const getProductivityByHour = (): number[] => {
    const hourCounts = Array(24).fill(0);
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.type === 'work');

    completedSessions.forEach(session => {
      const hour = session.startTime.getHours();
      hourCounts[hour]++;
    });

    return hourCounts;
  };

  const focusTimeData = getLast7DaysFocusTime();
  const sessionDistribution = getSessionDistribution();
  const productivityByHour = getProductivityByHour();

  /**
   * Handle CSV export
   * Complexity: 4 (async + error handling + state updates)
   */
  const handleExportCSV = async (): Promise<void> => {
    if (isExporting || sessions.length === 0) {return;}

    try {
      setIsExporting(true);
      exportSessionsAsCSV(sessions);
    } catch (err) {
      log.error('Failed to export CSV', err instanceof Error ? err : undefined);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle JSON export
   * Complexity: 4 (async + error handling + state updates)
   */
  const handleExportJSON = async (): Promise<void> => {
    if (isExporting || !analyticsData) {return;}

    try {
      setIsExporting(true);
      exportAnalyticsAsJSON(analyticsData, sessions);
    } catch (err) {
      log.error('Failed to export JSON', err instanceof Error ? err : undefined);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
        <span className="ml-3 text-neutral-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <p className="text-error-700">Failed to load analytics: {error}</p>
      </div>
    );
  }

  const completionRate = todayStats
    ? todayStats.pomodorosCompleted /
    (todayStats.pomodorosCompleted + (todayStats.pomodorosAbandoned || 0))
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Focus Time */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              Today's Focus Time
            </h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-3xl font-bold text-text-primary tabular-nums">
            {formatDuration(todayStats?.focusTime || 0)}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {todayStats?.pomodorosCompleted || 0} Pomodoros completed
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              Current Streak
            </h3>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {streak?.current || 0}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Personal best: {streak?.longest || 0} days
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
              Completion Rate
            </h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-text-primary tabular-nums">
            {isNaN(completionRate) ? '0' : Math.round(completionRate * 100)}%
          </p>
          <div className="mt-2">
            {completionRate >= 0.9 && (
              <Badge variant="success" size="sm">
                Excellent!
              </Badge>
            )}
            {completionRate >= 0.7 && completionRate < 0.9 && (
              <Badge variant="info" size="sm">
                Good
              </Badge>
            )}
            {completionRate < 0.7 && todayStats && todayStats.pomodorosCompleted > 0 && (
              <Badge variant="warning" size="sm">
                Room to improve
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklyData && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            This Week
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Pomodoros</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {weeklyData.totalPomodoros || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Focus Time</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatDuration(weeklyData.totalFocusTime || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {weeklyData.averagePerDay ? weeklyData.averagePerDay.toFixed(1) : '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-tertiary mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {weeklyData.completionRate
                  ? Math.round(weeklyData.completionRate * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Focus Time Trend */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            7-Day Focus Time Trend
          </h3>
          <FocusTimeChart
            dailyFocusTime={focusTimeData.data}
            labels={focusTimeData.labels}
            height={250}
          />
        </div>

        {/* Session Distribution and Productivity by Hour */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Distribution */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Session Distribution
            </h3>
            <SessionDistributionChart
              workSessions={sessionDistribution.work}
              shortBreaks={sessionDistribution.shortBreaks}
              longBreaks={sessionDistribution.longBreaks}
              height={250}
            />
          </div>

          {/* Productivity by Hour */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Productivity by Hour
            </h3>
            <ProductivityByHourChart sessionsPerHour={productivityByHour} height={250} />
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Export Your Data
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Download your productivity data in JSON or CSV format for analysis in other tools.
        </p>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 border border-border"
            onClick={handleExportJSON}
            disabled={isExporting || !analyticsData}
            aria-label="Export analytics data as JSON"
          >
            {isExporting ? 'Exporting...' : 'Export as JSON'}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 border border-border"
            onClick={handleExportCSV}
            disabled={isExporting || sessions.length === 0}
            aria-label="Export session data as CSV"
          >
            {isExporting ? 'Exporting...' : 'Export as CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};
