/**
 * AnalyticsDashboard - Productivity analytics with charts
 * Uses Chart.js for visualizations
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks';
import { Badge } from '../../components/atoms/Badge';
import { Spinner } from '../../components/atoms/Spinner';

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
 * Complexity: 5 (multiple data fetches + conditional rendering)
 */
export const AnalyticsDashboard: React.FC = () => {
  const { todayStats, streak, isLoading, error } = useAnalytics();
  const [weeklyData, setWeeklyData] = useState<any>(null);

  /**
   * Fetch weekly summary from background
   * Complexity: 3 (async + error handling)
   */
  useEffect(() => {
    const fetchWeeklySummary = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ANALYTICS_GET_WEEKLY',
        });

        if (response.success && response.data) {
          setWeeklyData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch weekly summary:', err);
      }
    };

    fetchWeeklySummary();
  }, []);

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

      {/* Chart Placeholder */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          7-Day Focus Time Trend
        </h3>
        <div className="bg-neutral-50 rounded-lg p-8 text-center">
          <p className="text-neutral-500">
            📈 Chart visualization will be added with Chart.js integration
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Coming soon: Interactive charts showing daily focus time, session distribution, and productivity trends
          </p>
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
