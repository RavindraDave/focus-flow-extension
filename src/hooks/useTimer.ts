/**
 * useTimer - React hook for Pomodoro timer state and controls
 * Communicates with background service worker via chrome.runtime messaging
 */

import { useState, useEffect, useCallback } from 'react';
import type { TimerStatus } from '../types/messages';
import type { SessionType } from '../types';

/**
 * Check if Chrome extension APIs are available
 */
const isChromeApiAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.sendMessage;
};

export interface UseTimerReturn {
  // State
  isActive: boolean;
  isPaused: boolean;
  sessionType: SessionType | null;
  remainingSeconds: number;
  totalSeconds: number;
  taskName: string | undefined;

  // Actions
  start: (sessionType: SessionType, taskName?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;

  // Status
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to manage timer state and controls
 * Fetches status every second when active
 */
export function useTimer(): UseTimerReturn {
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch timer status from background service worker
   * Complexity: 3 (try-catch + message sending)
   */
  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!isChromeApiAvailable()) {
      setError('Chrome extension APIs not available');
      setIsLoading(false);
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage<
        { type: 'TIMER_GET_STATUS' },
        { success: boolean; data?: TimerStatus; error?: string }
      >({
        type: 'TIMER_GET_STATUS',
      });

      if (response.success && response.data) {
        setStatus(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to get timer status');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch timer status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Poll timer status every second when active and tab is visible
   * Uses Page Visibility API to reduce CPU usage when tab is hidden
   */
  useEffect(() => {
    fetchStatus();

    // Track document visibility
    const handleVisibilityChange = (): void => {
      if (!document.hidden) {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Poll every second only if tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStatus();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  /**
   * Start a new timer session
   * Complexity: 3 (validation + try-catch)
   */
  const start = useCallback(
    async (sessionType: SessionType, taskName?: string): Promise<void> => {
      if (!isChromeApiAvailable()) {
        setError('Chrome extension APIs not available');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Background worker uses user settings for duration
        const response = await chrome.runtime.sendMessage({
          type: 'TIMER_START',
          sessionType,
          taskName,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to start timer');
        }

        await fetchStatus();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start timer';
        setError(message);
        console.error('Failed to start timer:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStatus]
  );

  /**
   * Pause the active timer
   * Complexity: 2 (try-catch)
   */
  const pause = useCallback(async (): Promise<void> => {
    if (!isChromeApiAvailable()) {
      setError('Chrome extension APIs not available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({ type: 'TIMER_PAUSE' });

      if (!response.success) {
        throw new Error(response.error || 'Failed to pause timer');
      }

      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause timer';
      setError(message);
      console.error('Failed to pause timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  /**
   * Resume a paused timer
   * Complexity: 2 (try-catch)
   */
  const resume = useCallback(async (): Promise<void> => {
    if (!isChromeApiAvailable()) {
      setError('Chrome extension APIs not available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({ type: 'TIMER_RESUME' });

      if (!response.success) {
        throw new Error(response.error || 'Failed to resume timer');
      }

      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume timer';
      setError(message);
      console.error('Failed to resume timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  /**
   * Stop and abandon the active timer
   * Complexity: 2 (try-catch)
   */
  const stop = useCallback(async (): Promise<void> => {
    if (!isChromeApiAvailable()) {
      setError('Chrome extension APIs not available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({ type: 'TIMER_STOP' });

      if (!response.success) {
        throw new Error(response.error || 'Failed to stop timer');
      }

      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop timer';
      setError(message);
      console.error('Failed to stop timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  return {
    // State
    isActive: status?.state !== 'idle' && !status?.isPaused,
    isPaused: status?.isPaused || false,
    sessionType: status?.currentSession?.type || null,
    remainingSeconds: status?.remainingSeconds || 0,
    totalSeconds: status?.totalSeconds || 0,
    taskName: status?.currentSession?.taskName,

    // Actions
    start,
    pause,
    resume,
    stop,

    // Status
    isLoading,
    error,
  };
}
