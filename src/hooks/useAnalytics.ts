/**
 * useAnalytics - React hook for analytics and stats
 * Fetches today's stats and streak data from background service worker
 */

import { useState, useEffect, useCallback } from 'react';

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
 * Custom hook to fetch analytics data
 * Complexity: 4 (multiple async operations + error handling)
 */
export function useAnalytics(): UseAnalyticsReturn {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch analytics data from background service worker
   * Complexity: 4 (try-catch + parallel fetch)
   */
  const fetchAnalytics = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both in parallel
      const [analyticsResponse, streakResponse] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' }),
        chrome.runtime.sendMessage({ type: 'STREAK_GET' }),
      ]);

      if (analyticsResponse.success && analyticsResponse.data) {
        const analytics = analyticsResponse.data;
        // Get today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayData = analytics.dailyStats?.find(
          (s: any) => new Date(s.date).toISOString().split('T')[0] === today
        );

        setTodayStats({
          focusTime: todayData?.focusTime || 0,
          pomodorosCompleted: todayData?.pomodorosCompleted || 0,
          pomodorosAbandoned: todayData?.pomodorosAbandoned || 0,
        });
      }

      if (streakResponse.success && streakResponse.data) {
        setStreak(streakResponse.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    todayStats,
    streak,
    isLoading,
    error,
    refresh: fetchAnalytics,
  };
}
