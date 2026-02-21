/**
 * AnalyticsDashboard - Productivity analytics with charts
 * Uses Chart.js for visualizations
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks';
import type { TodayStats, StreakData } from '../../hooks/useAnalytics';
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
 * Get last 7 days of focus time data from daily stats
 */
function getLast7DaysFocusTime(dailyStats: DailyStats[]): { labels: string[]; data: number[] } {
  const labels: string[] = [];
  const data: number[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    labels.push(dayLabel);

    const stat = dailyStats.find(s => {
      const statDate = new Date(s.date);
      statDate.setHours(0, 0, 0, 0);
      return statDate.getTime() === date.getTime();
    });

    data.push(stat?.focusTimeMinutes ?? 0);
  }

  return { labels, data };
}

/**
 * Get session distribution counts
 */
function getSessionDistribution(sessions: PomodoroSession[]): {
  work: number;
  shortBreaks: number;
  longBreaks: number;
} {
  const completedSessions = sessions.filter(s => s.status === 'completed');
  return {
    work: completedSessions.filter(s => s.type === 'work').length,
    shortBreaks: completedSessions.filter(s => s.type === 'short-break').length,
    longBreaks: completedSessions.filter(s => s.type === 'long-break').length,
  };
}

/**
 * Get productivity counts grouped by hour of day
 */
function getProductivityByHour(sessions: PomodoroSession[]): number[] {
  const hourCounts: number[] = Array.from({ length: 24 }, () => 0);
  const completedSessions = sessions.filter(s => s.status === 'completed' && s.type === 'work');

  completedSessions.forEach(session => {
    const hour = session.startTime.getHours();
    hourCounts[hour]++;
  });

  return hourCounts;
}

/**
 * Compute the completion rate badge
 */
function getCompletionBadge(
  completionRate: number,
  todayStats: TodayStats | null
): React.ReactNode {
  if (completionRate >= 0.9) {
    return (
      <Badge variant="success" size="sm">
        Excellent!
      </Badge>
    );
  }
  if (completionRate >= 0.7) {
    return (
      <Badge variant="info" size="sm">
        Good
      </Badge>
    );
  }
  if (todayStats && todayStats.pomodorosCompleted > 0) {
    return (
      <Badge variant="warning" size="sm">
        Room to improve
      </Badge>
    );
  }
  return null;
}

/**
 * Fetch chart data from background service worker
 */
async function fetchChartData(): Promise<{
  weekly: ProductivitySummary | null;
  dailyStats: DailyStats[];
  sessions: PomodoroSession[];
  analytics: AnalyticsData | null;
}> {
  type WeeklyResponse = { success: boolean; data: ProductivitySummary };
  type AnalyticsResponse = { success: boolean; data: AnalyticsData & { dailyStats?: SerializedDailyStats[] } };
  type SessionsResponse = { success: boolean; data: SerializedPomodoroSession[] };

  const [weeklyResponse, analyticsResponse, sessionsResponse] = (await Promise.all([
    chrome.runtime.sendMessage({ type: 'ANALYTICS_GET_WEEKLY_SUMMARY' }),
    chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' }),
    chrome.runtime.sendMessage({ type: 'SESSION_GET_HISTORY', limit: 100 }),
  ])) as unknown as [WeeklyResponse, AnalyticsResponse, SessionsResponse];

  let weekly: ProductivitySummary | null = null;
  let daily: DailyStats[] = [];
  let sessionsList: PomodoroSession[] = [];
  let analytics: AnalyticsData | null = null;

  if (weeklyResponse.success) {
    weekly = weeklyResponse.data;
  }

  if (analyticsResponse.success) {
    analytics = analyticsResponse.data;
    const rawStats = analyticsResponse.data.dailyStats ?? [];
    daily = rawStats.map((stat: SerializedDailyStats) => ({
      ...stat,
      date: new Date(stat.date),
    }));
  }

  if (sessionsResponse.success) {
    sessionsList = sessionsResponse.data.map((session: SerializedPomodoroSession) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
    }));
  }

  return { weekly, dailyStats: daily, sessions: sessionsList, analytics };
}

interface OverviewCardsProps {
  todayStats: TodayStats | null;
  streak: StreakData | null;
  completionRate: number;
}

/**
 * Overview cards sub-component
 */
const OverviewCards: React.FC<OverviewCardsProps> = ({ todayStats, streak, completionRate }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
          {"Today's Focus Time"}
        </h3>
        <span className="text-2xl">⏱️</span>
      </div>
      <p className="text-3xl font-bold text-text-primary tabular-nums">
        {formatDuration(todayStats?.focusTime ?? 0)}
      </p>
      <p className="text-xs text-text-tertiary mt-1">
        {todayStats?.pomodorosCompleted ?? 0} Pomodoros completed
      </p>
    </div>

    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
          Current Streak
        </h3>
        <span className="text-2xl">🔥</span>
      </div>
      <p className="text-3xl font-bold text-accent tabular-nums">
        {streak?.current ?? 0}
      </p>
      <p className="text-xs text-text-secondary mt-1">
        Personal best: {streak?.longest ?? 0} days
      </p>
    </div>

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
        {getCompletionBadge(completionRate, todayStats)}
      </div>
    </div>
  </div>
);

interface WeeklySummaryProps {
  weeklyData: ProductivitySummary;
}

/**
 * Weekly summary sub-component
 */
const WeeklySummary: React.FC<WeeklySummaryProps> = ({ weeklyData }) => (
  <div className="bg-surface border border-border rounded-lg p-6">
    <h3 className="text-lg font-semibold text-text-primary mb-4">
      This Week
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-sm text-text-tertiary mb-1">Total Pomodoros</p>
        <p className="text-2xl font-bold text-text-primary tabular-nums">
          {weeklyData.totalPomodoros}
        </p>
      </div>
      <div>
        <p className="text-sm text-text-tertiary mb-1">Total Focus Time</p>
        <p className="text-2xl font-bold text-text-primary">
          {formatDuration(weeklyData.totalFocusTime)}
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
);

interface ChartsSectionProps {
  focusTimeData: { labels: string[]; data: number[] };
  sessionDistribution: { work: number; shortBreaks: number; longBreaks: number };
  productivityByHour: number[];
}

/**
 * Charts section sub-component
 */
const ChartsSection: React.FC<ChartsSectionProps> = ({
  focusTimeData,
  sessionDistribution,
  productivityByHour,
}) => (
  <div className="space-y-6">
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Productivity by Hour
        </h3>
        <ProductivityByHourChart sessionsPerHour={productivityByHour} height={250} />
      </div>
    </div>
  </div>
);

interface ExportSectionProps {
  isExporting: boolean;
  analyticsData: AnalyticsData | null;
  sessions: PomodoroSession[];
  onExportJSON: () => void;
  onExportCSV: () => void;
}

/**
 * Export section sub-component
 */
const ExportSection: React.FC<ExportSectionProps> = ({
  isExporting,
  analyticsData,
  sessions,
  onExportJSON,
  onExportCSV,
}) => (
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
        onClick={onExportJSON}
        disabled={isExporting || !analyticsData}
        aria-label="Export analytics data as JSON"
      >
        {isExporting ? 'Exporting...' : 'Export as JSON'}
      </button>
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 border border-border"
        onClick={onExportCSV}
        disabled={isExporting || sessions.length === 0}
        aria-label="Export session data as CSV"
      >
        {isExporting ? 'Exporting...' : 'Export as CSV'}
      </button>
    </div>
  </div>
);

/**
 * AnalyticsDashboard component
 */
// eslint-disable-next-line max-lines-per-function
export const AnalyticsDashboard: React.FC = () => {
  const { todayStats, streak, isLoading, error } = useAnalytics();
  const [weeklyData, setWeeklyData] = useState<ProductivitySummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void fetchChartData().then(result => {
      setWeeklyData(result.weekly);
      setDailyStats(result.dailyStats);
      setSessions(result.sessions);
      setAnalyticsData(result.analytics);
    }).catch((err: unknown) => {
      log.error('Failed to fetch chart data', err instanceof Error ? err : undefined);
    });
  }, []);

  const focusTimeData = getLast7DaysFocusTime(dailyStats);
  const sessionDistribution = getSessionDistribution(sessions);
  const productivityByHour = getProductivityByHour(sessions);

  const handleExportCSV = (): void => {
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

  const handleExportJSON = (): void => {
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
    (todayStats.pomodorosCompleted + (todayStats.pomodorosAbandoned ?? 0))
    : 0;

  return (
    <div className="space-y-6">
      <OverviewCards todayStats={todayStats} streak={streak} completionRate={completionRate} />
      {weeklyData && <WeeklySummary weeklyData={weeklyData} />}
      <ChartsSection
        focusTimeData={focusTimeData}
        sessionDistribution={sessionDistribution}
        productivityByHour={productivityByHour}
      />
      <ExportSection
        isExporting={isExporting}
        analyticsData={analyticsData}
        sessions={sessions}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
};
