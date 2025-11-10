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
import type { PomodoroSession, DailyStats } from '../../types';

/**
 * Format minutes into hours and minutes
 * Complexity: 3 (calculation + conditional formatting)
 */
function formatDuration(minutes: number): string {
  if (minutes === 0) return '0min';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * AnalyticsDashboard component
 * Complexity: 7 (multiple data fetches + conditional rendering + data transformation)
 */
export const AnalyticsDashboard: React.FC = () => {
  const { todayStats, streak, isLoading, error } = useAnalytics();
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

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
          // Convert date strings back to Date objects
          const statsWithDates = (analyticsResponse.data.dailyStats || []).map((stat: any) => ({
            ...stat,
            date: new Date(stat.date),
          }));
          setDailyStats(statsWithDates);
        }

        if (sessionsResponse.success && sessionsResponse.data) {
          // Convert date strings back to Date objects
          const sessionsWithDates = sessionsResponse.data.map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
          }));
          setSessions(sessionsWithDates);
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
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
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
              Today's Focus Time
            </h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">
            {formatDuration(todayStats?.focusTime || 0)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {todayStats?.pomodorosCompleted || 0} Pomodoros completed
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-primary-50 to-success-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">
              Current Streak
            </h3>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-primary-600 tabular-nums">
            {streak?.current || 0}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Personal best: {streak?.longest || 0} days
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
              Completion Rate
            </h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 tabular-nums">
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
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            This Week
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Pomodoros</p>
              <p className="text-2xl font-bold text-neutral-900 tabular-nums">
                {weeklyData.totalPomodoros || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Focus Time</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatDuration(weeklyData.totalFocusTime || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-neutral-900 tabular-nums">
                {weeklyData.averagePerDay ? weeklyData.averagePerDay.toFixed(1) : '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-neutral-900 tabular-nums">
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
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
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
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
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
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Productivity by Hour
            </h3>
            <ProductivityByHourChart sessionsPerHour={productivityByHour} height={250} />
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">
          Export Your Data
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Download your productivity data in JSON or CSV format for analysis in other tools.
        </p>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => {
              console.log('Export as JSON');
              // TODO: Implement JSON export
            }}
          >
            Export as JSON
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => {
              console.log('Export as CSV');
              // TODO: Implement CSV export
            }}
          >
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
};
