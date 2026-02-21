/**
 * useSettings - React hook for user settings management
 * Communicates with background service worker for settings CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserSettings } from '../types';
import type { BackgroundResponse } from '../types/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('useSettings');

export interface UseSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Send a typed message to background for settings operations
 */
async function sendSettingsMessage<T>(
  message: Record<string, unknown>
): Promise<BackgroundResponse<T>> {
  return chrome.runtime.sendMessage<Record<string, unknown>, BackgroundResponse<T>>(message);
}

/**
 * Hook to fetch settings from background
 */
function useFetchSettings(
  setSettings: React.Dispatch<React.SetStateAction<UserSettings | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendSettingsMessage<UserSettings>({
        type: 'SETTINGS_GET',
      });

      if (response.success) {
        setSettings(response.data);
      } else {
        throw new Error(response.error ?? 'Failed to get settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
      log.error('Failed to fetch settings', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [setSettings, setIsLoading, setError]);
}

/**
 * Hook for updating settings
 */
function useUpdateSettings(
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchSettings: () => Promise<void>
): (updates: Partial<UserSettings>) => Promise<void> {
  return useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await sendSettingsMessage<UserSettings>({
          type: 'SETTINGS_UPDATE',
          updates,
        });

        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update settings');
        }

        await fetchSettings();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        log.error('Failed to update settings', err instanceof Error ? err : undefined);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSettings, setIsLoading, setError]
  );
}

/**
 * Custom hook to manage user settings
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useFetchSettings(setSettings, setIsLoading, setError);
  const updateSettings = useUpdateSettings(setIsLoading, setError, fetchSettings);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refresh: fetchSettings,
  };
}
