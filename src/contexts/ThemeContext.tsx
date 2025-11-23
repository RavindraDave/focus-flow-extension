/**
 * Theme Context Provider
 *
 * Provides theme state and controls to all components via React Context.
 * This is an architectural enhancement that wraps the useTheme hook.
 *
 * While functionally equivalent to directly calling useTheme in components,
 * this pattern provides better separation of concerns and easier testing.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, ThemeMode } from '../hooks/useTheme';

/**
 * Theme Context shape
 */
interface ThemeContextValue {
  theme: ThemeMode;
  isLoading: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

/**
 * Create the theme context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Component
 *
 * Wraps the application and provides theme context to all children.
 * Initializes theme on mount and handles theme synchronization.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 *
 * Must be used within a ThemeProvider.
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useThemeContext();
 * ```
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }

  return context;
};

/**
 * Export for testing and advanced use cases
 */
export { ThemeContext };
export type { ThemeContextValue };
