import { useEffect, useState, useCallback } from 'react';

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Storage key for theme preference
 */
const THEME_STORAGE_KEY = 'theme_preference';

/**
 * Get the effective theme based on user preference and system preference
 */
function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * useTheme Hook
 *
 * Manages theme state with system preference detection and persistence.
 * Syncs theme preference across extension pages using chrome.storage.local.
 *
 * Features:
 * - Persists theme preference in chrome.storage.local
 * - Detects system color scheme preference
 * - Automatically applies theme to document
 * - Listens to system preference changes
 * - Syncs theme changes across all extension pages
 *
 * @example
 * ```tsx
 * function App() {
 *   const { theme, effectiveTheme, setTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <p>Current theme: {effectiveTheme}</p>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={() => setTheme('system')}>System</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): {
  /**
   * Current theme mode (including 'system' option)
   */
  theme: ThemeMode;

  /**
   * Effective theme applied to the page ('light' or 'dark')
   */
  effectiveTheme: 'light' | 'dark';

  /**
   * Update theme preference
   */
  setTheme: (mode: ThemeMode) => Promise<void>;
} {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() =>
    getEffectiveTheme('system')
  );

  // Load theme from storage on mount
  useEffect(() => {
    async function loadTheme(): Promise<void> {
      try {
        const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
        const savedTheme = (result[THEME_STORAGE_KEY] as ThemeMode) || 'system';
        setThemeState(savedTheme);

        const effective = getEffectiveTheme(savedTheme);
        setEffectiveTheme(effective);
        applyTheme(effective);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fallback to system preference
        const effective = getEffectiveTheme('system');
        setEffectiveTheme(effective);
        applyTheme(effective);
      }
    }

    loadTheme();
  }, []);

  // Listen to system preference changes
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(e: MediaQueryListEvent): void {
      const newTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newTheme);
      applyTheme(newTheme);
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else {
      // @ts-expect-error - Legacy API
      mediaQuery.addListener(handleChange);
      // @ts-expect-error - Legacy API
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Listen to storage changes (sync across extension pages)
  useEffect(() => {
    function handleStorageChange(
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ): void {
      if (areaName !== 'local' || !(THEME_STORAGE_KEY in changes)) {
        return;
      }

      const newTheme = changes[THEME_STORAGE_KEY].newValue as ThemeMode;
      if (newTheme !== theme) {
        setThemeState(newTheme);
        const effective = getEffectiveTheme(newTheme);
        setEffectiveTheme(effective);
        applyTheme(effective);
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [theme]);

  // Update theme preference
  const setTheme = useCallback(async (mode: ThemeMode): Promise<void> => {
    try {
      // Save to storage
      await chrome.storage.local.set({ [THEME_STORAGE_KEY]: mode });

      // Update local state
      setThemeState(mode);

      // Apply theme
      const effective = getEffectiveTheme(mode);
      setEffectiveTheme(effective);
      applyTheme(effective);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      throw new Error('Unable to save theme preference');
    }
  }, []);

  return {
    theme,
    effectiveTheme,
    setTheme,
  };
}
