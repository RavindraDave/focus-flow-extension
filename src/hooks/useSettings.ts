/**
 * useSettings - React hook for user settings management
 * Communicates with background service worker for settings CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserSettings } from '../types';

export interface UseSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to manage user settings
 * Complexity: 4 (multiple async operations + error handling)
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch settings from background service worker
   * Complexity: 3 (try-catch + message sending)
   */
  const fetchSettings = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'SETTINGS_GET',
      });

      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error(response.error || 'Failed to get settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update settings
   * Complexity: 3 (validation + try-catch)
   */
  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'SETTINGS_UPDATE',
          updates,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update settings');
        }

        // Refresh settings after update
        await fetchSettings();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        console.error('Failed to update settings:', err);
        throw err; // Re-throw for component error handling
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSettings]
  );

  /**
   * Fetch on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refresh: fetchSettings,
  };
}
