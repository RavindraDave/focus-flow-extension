/**
 * useAnalytics - React hook for analytics and stats
 * Fetches today's stats and streak data from background service worker
 */

import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '../utils/logger';
import type { BackgroundResponse } from '../types/messages';

const log = createLogger('useAnalytics');

/**
 * Serialized DailyStats (dates as strings from JSON)
 */
interface SerializedDailyStats {
  date: string;
  focusTime: number;
  pomodorosCompleted: number;
  pomodorosAbandoned: number;
}

interface AnalyticsResponseData {
  dailyStats?: SerializedDailyStats[];
}

export interface TodayStats {
  focusTime: number; // minutes
  pomodorosCompleted: number;
  pomodorosAbandoned: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastCheckIn: Date;
  freezesAvailable: number;
}

export interface UseAnalyticsReturn {
  todayStats: TodayStats | null;
  streak: StreakData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch and process analytics data from the background service worker
 */
function processAnalyticsResponse(
  analyticsResponse: BackgroundResponse<AnalyticsResponseData>
): TodayStats | null {
  if (!analyticsResponse.success) {
    return null;
  }
  const analytics = analyticsResponse.data;
  const today = new Date().toISOString().split('T')[0];
  const todayData = analytics.dailyStats?.find(
    (s: SerializedDailyStats) => new Date(s.date).toISOString().split('T')[0] === today
  );

  return {
    focusTime: todayData?.focusTime ?? 0,
    pomodorosCompleted: todayData?.pomodorosCompleted ?? 0,
    pomodorosAbandoned: todayData?.pomodorosAbandoned ?? 0,
  };
}

/**
 * Custom hook to fetch analytics data
 */
export function useAnalytics(): UseAnalyticsReturn {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch analytics data from background service worker
   */
  const fetchAnalytics = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both in parallel
      const [analyticsResponse, streakResponse] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' }) as Promise<BackgroundResponse<AnalyticsResponseData>>,
        chrome.runtime.sendMessage({ type: 'STREAK_GET' }) as Promise<BackgroundResponse<StreakData>>,
      ]);

      const stats = processAnalyticsResponse(analyticsResponse);
      if (stats) {
        setTodayStats(stats);
      }

      if (streakResponse.success) {
        setStreak(streakResponse.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      log.error('Failed to fetch analytics', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    todayStats,
    streak,
    isLoading,
    error,
    refresh: fetchAnalytics,
  };
}
