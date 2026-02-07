/**
 * useNuclearMode - React hook for Nuclear Mode management
 * Fetches status and provides activation/deactivation functions
 */

import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useNuclearMode');

export interface NuclearModeStatus {
  isActive: boolean;
  remainingTime: number; // seconds
}

export interface UseNuclearModeReturn {
  isActive: boolean;
  remainingSeconds: number;
  isLoading: boolean;
  error: string | null;
  activate: (durationHours: number) => Promise<void>;
  deactivate: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to manage Nuclear Mode
 * Complexity: 6 (multiple async operations + polling + error handling)
 */
export function useNuclearMode(): UseNuclearModeReturn {
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch Nuclear Mode status from background
   * Complexity: 4 (async + error handling)
   */
  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'NUCLEAR_MODE_GET_STATUS',
      });

      if (response.success && response.data) {
        const status: NuclearModeStatus = response.data;
        setIsActive(status.isActive);
        setRemainingSeconds(status.remainingTime);
      } else {
        throw new Error(response.error || 'Failed to fetch Nuclear Mode status');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Nuclear Mode status';
      setError(message);
      log.error('Failed to fetch Nuclear Mode status', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Activate Nuclear Mode
   * Complexity: 4 (async + error handling + validation)
   */
  const activate = useCallback(async (durationHours: number): Promise<void> => {
    if (durationHours < 1 || durationHours > 8) {
      throw new Error('Duration must be between 1 and 8 hours');
    }

    try {
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours,
      });

      if (response.success) {
        await fetchStatus();
      } else {
        throw new Error(response.error || 'Failed to activate Nuclear Mode');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate Nuclear Mode';
      setError(message);
      throw err;
    }
  }, [fetchStatus]);

  /**
   * Deactivate Nuclear Mode (only works if expired)
   * Complexity: 3 (async + error handling)
   */
  const deactivate = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'NUCLEAR_MODE_DEACTIVATE',
      });

      if (response.success) {
        await fetchStatus();
      } else {
        throw new Error(response.error || 'Failed to deactivate Nuclear Mode');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate Nuclear Mode';
      setError(message);
      throw err;
    }
  }, [fetchStatus]);

  /**
   * Fetch on mount and setup polling
   */
  useEffect(() => {
    fetchStatus();

    // Poll every 5 seconds when active
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchStatus]);

  /**
   * Countdown timer (update every second when active)
   */
  useEffect(() => {
    if (isActive && remainingSeconds > 0) {
      const timer = setTimeout(() => {
        setRemainingSeconds(Math.max(0, remainingSeconds - 1));
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive, remainingSeconds]);

  return {
    isActive,
    remainingSeconds,
    isLoading,
    error,
    activate,
    deactivate,
    refresh: fetchStatus,
  };
}
