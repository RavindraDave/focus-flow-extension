/**
 * useNuclearMode - React hook for Nuclear Mode management
 * Fetches status and provides activation/deactivation functions
 */

import { useState, useEffect, useCallback } from 'react';
import type { BackgroundResponse } from '../types/messages';
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
 * Send a typed message to background for nuclear mode
 */
async function sendNuclearMessage<T>(
  message: Record<string, unknown>
): Promise<BackgroundResponse<T>> {
  return chrome.runtime.sendMessage<Record<string, unknown>, BackgroundResponse<T>>(message);
}

/**
 * Hook for fetching Nuclear Mode status
 */
function useFetchNuclearStatus(
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
  setRemainingSeconds: React.Dispatch<React.SetStateAction<number>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const response = await sendNuclearMessage<NuclearModeStatus>({
        type: 'NUCLEAR_MODE_GET_STATUS',
      });

      if (response.success) {
        const status = response.data;
        setIsActive(status.isActive);
        setRemainingSeconds(status.remainingTime);
      } else {
        throw new Error(response.error ?? 'Failed to fetch Nuclear Mode status');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Nuclear Mode status';
      setError(message);
      log.error('Failed to fetch Nuclear Mode status', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [setIsActive, setRemainingSeconds, setIsLoading, setError]);
}

/**
 * Hook for Nuclear Mode activate/deactivate actions
 */
function useNuclearActions(
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchStatus: () => Promise<void>
): {
  activate: (durationHours: number) => Promise<void>;
  deactivate: () => Promise<void>;
} {
  const activate = useCallback(async (durationHours: number): Promise<void> => {
    if (durationHours < 1 || durationHours > 8) {
      throw new Error('Duration must be between 1 and 8 hours');
    }

    try {
      setError(null);

      const response = await sendNuclearMessage<boolean>({
        type: 'NUCLEAR_MODE_ACTIVATE',
        durationHours,
      });

      if (response.success) {
        await fetchStatus();
      } else {
        throw new Error(response.error ?? 'Failed to activate Nuclear Mode');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate Nuclear Mode';
      setError(message);
      throw err;
    }
  }, [fetchStatus, setError]);

  const deactivate = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const response = await sendNuclearMessage<boolean>({
        type: 'NUCLEAR_MODE_DEACTIVATE',
      });

      if (response.success) {
        await fetchStatus();
      } else {
        throw new Error(response.error ?? 'Failed to deactivate Nuclear Mode');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate Nuclear Mode';
      setError(message);
      throw err;
    }
  }, [fetchStatus, setError]);

  return { activate, deactivate };
}

/**
 * Custom hook to manage Nuclear Mode
 */
export function useNuclearMode(): UseNuclearModeReturn {
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useFetchNuclearStatus(setIsActive, setRemainingSeconds, setIsLoading, setError);
  const { activate, deactivate } = useNuclearActions(setError, fetchStatus);

  useEffect(() => {
    void fetchStatus();

    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        void fetchStatus();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchStatus]);

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
