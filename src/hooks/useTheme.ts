import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useTheme');

/**
 * Visual theme type
 * - modern: Clean, minimal, SaaS-like (default)
 * - zen: Organic, soft, calming
 * - cyber: High-contrast, neon, terminal
 */
export type ThemeMode = 'modern' | 'zen' | 'cyber';

/**
 * Storage key for theme preference
 */
const THEME_STORAGE_KEY = 'visual_theme';

/**
 * Default theme (Modern Pro)
 */
const DEFAULT_THEME: ThemeMode = 'modern';

/**
 * Apply theme to document by setting data-theme attribute
 */
function applyTheme(theme: ThemeMode): void {
  const root = document.body;
  root.setAttribute('data-theme', theme);
}

/**
 * useTheme Hook
 *
 * Manages visual theme state (Modern Pro, Zen Mode, Cyber Focus) with persistence.
 * Syncs theme preference across extension pages using chrome.storage.sync.
 *
 * Features:
 * - Persists theme preference in chrome.storage.sync (syncs across devices)
 * - Automatically applies theme to document via data-theme attribute
 * - Real-time theme changes across all extension pages
 * - Supports three visual themes: modern, zen, cyber
 *
 * @example
 * ```tsx
 * function App() {
 *   const { theme, setTheme, isLoading } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme('modern')}>Modern Pro</button>
 *       <button onClick={() => setTheme('zen')}>Zen Mode</button>
 *       <button onClick={() => setTheme('cyber')}>Cyber Focus</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): {
  /**
   * Current active theme
   */
  theme: ThemeMode;

  /**
   * Whether the theme is being loaded from storage
   */
  isLoading: boolean;

  /**
   * Update theme preference
   */
  setTheme: (mode: ThemeMode) => Promise<void>;
} {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    async function loadTheme(): Promise<void> {
      try {
        const result = await chrome.storage.sync.get(THEME_STORAGE_KEY);
        const savedTheme = (result[THEME_STORAGE_KEY] as ThemeMode) ?? DEFAULT_THEME;
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } catch (error) {
        log.error('Failed to load theme preference', error instanceof Error ? error : undefined);
        // Fallback to default theme
        applyTheme(DEFAULT_THEME);
      } finally {
        setIsLoading(false);
      }
    }

    void loadTheme();
  }, []);

  // Listen to storage changes (sync across extension pages)
  useEffect(() => {
    function handleStorageChange(
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ): void {
      if (areaName !== 'sync' || !(THEME_STORAGE_KEY in changes)) {
        return;
      }

      const newTheme = changes[THEME_STORAGE_KEY].newValue as ThemeMode;
      if (newTheme && newTheme !== theme) {
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [theme]);

  // Update theme preference
  const setTheme = useCallback(async (mode: ThemeMode): Promise<void> => {
    try {
      // Save to storage (will sync across devices)
      await chrome.storage.sync.set({ [THEME_STORAGE_KEY]: mode });

      // Update local state
      setThemeState(mode);

      // Apply theme immediately
      applyTheme(mode);
    } catch (error) {
      log.error('Failed to save theme preference', error instanceof Error ? error : undefined);
      throw new Error('Unable to save theme preference');
    }
  }, []);

  return {
    theme,
    isLoading,
    setTheme,
  };
}
