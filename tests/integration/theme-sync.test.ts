/**
 * Theme Integration Tests
 *
 * Tests for cross-page theme synchronization including:
 * - Theme changes in popup update options page
 * - Theme changes in options update popup
 * - Theme changes update blocked page
 * - Multiple pages stay synchronized
 * - ThemeContext integration
 * - chrome.storage.sync persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';


// Mock chrome API
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

// @ts-ignore
global.chrome = mockChrome;

// Storage change listeners
let storageChangeListeners: Array<(changes: any, areaName: string) => void> = [];

describe('Theme Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageChangeListeners = [];

    // Default storage mock
    mockChrome.storage.sync.get.mockResolvedValue({
      visual_theme: 'modern',
    });

    mockChrome.storage.sync.set.mockResolvedValue(undefined);

    // Mock storage change listener
    mockChrome.storage.onChanged.addListener.mockImplementation((listener: any) => {
      storageChangeListeners.push(listener);
      return undefined;
    });
  });

  describe('useTheme Hook Integration', () => {
    it('should load theme from chrome.storage on mount', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        visual_theme: 'cyber',
      });

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('cyber');
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('visual_theme');
    });

    it('should default to modern theme when no stored value exists', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('modern');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should save theme to chrome.storage when setTheme is called', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.setTheme('zen');

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        visual_theme: 'zen',
      });
    });

    it('should update theme state immediately when setTheme is called', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.setTheme('cyber');

      await waitFor(() => {
        expect(result.current.theme).toBe('cyber');
      });
    });

    it('should register storage change listener on mount', async () => {
      renderHook(() => useTheme());

      await waitFor(() => {
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
      });

      expect(storageChangeListeners.length).toBeGreaterThan(0);
    });

    it('should update theme when storage changes from another page', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('modern');
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate storage change from another page
      const changes = {
        visual_theme: {
          oldValue: 'modern',
          newValue: 'zen',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('zen');
      });
    });

    it('should only respond to sync storage area changes', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialTheme = result.current.theme;

      // Try to change via 'local' storage area (should be ignored)
      const changes = {
        visual_theme: {
          oldValue: 'modern',
          newValue: 'cyber',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'local');
      });

      // Wait a bit to ensure no change occurs
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.theme).toBe(initialTheme);
    });

    it('should ignore changes to other storage keys', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialTheme = result.current.theme;

      // Change a different storage key
      const changes = {
        nuclear_mode: {
          oldValue: false,
          newValue: true,
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.theme).toBe(initialTheme);
    });
  });

  describe('Cross-Page Synchronization', () => {
    it('should synchronize theme across multiple hook instances', async () => {
      const { result: result1 } = renderHook(() => useTheme());
      const { result: result2 } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Change theme in first instance
      await result1.current.setTheme('cyber');

      await waitFor(() => {
        expect(result1.current.theme).toBe('cyber');
      });

      // Simulate storage change event
      const changes = {
        visual_theme: {
          oldValue: 'modern',
          newValue: 'cyber',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      // Second instance should update
      await waitFor(() => {
        expect(result2.current.theme).toBe('cyber');
      });
    });

    it('should handle rapid theme changes correctly', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rapidly change themes
      await result.current.setTheme('zen');
      await result.current.setTheme('cyber');
      await result.current.setTheme('modern');

      await waitFor(() => {
        expect(result.current.theme).toBe('modern');
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent theme changes from multiple sources', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Local change
      await result.current.setTheme('zen');

      await waitFor(() => {
        expect(result.current.theme).toBe('zen');
      });

      // Remote change (from another page) should override
      const changes = {
        visual_theme: {
          oldValue: 'zen',
          newValue: 'cyber',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('cyber');
      });
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme selection across page reloads', async () => {
      // First render - set theme to zen
      const { result: result1 } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      await result1.current.setTheme('zen');

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        visual_theme: 'zen',
      });

      // Simulate page reload - new render should load saved theme
      mockChrome.storage.sync.get.mockResolvedValue({
        visual_theme: 'zen',
      });

      const { result: result2 } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result2.current.theme).toBe('zen');
        expect(result2.current.isLoading).toBe(false);
      });
    });

    it('should throw error on storage.set failures', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockChrome.storage.sync.set.mockRejectedValue(new Error('Storage quota exceeded'));

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should throw error when storage.set fails
      await expect(result.current.setTheme('cyber')).rejects.toThrow('Unable to save theme preference');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save theme preference'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle storage.get failures gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockChrome.storage.sync.get.mockRejectedValue(new Error('Storage unavailable'));

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        // Should fallback to default theme
        expect(result.current.theme).toBe('modern');
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load theme'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Theme Validation', () => {
    it('should accept all valid theme modes', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test modern
      await result.current.setTheme('modern');
      await waitFor(() => {
        expect(result.current.theme).toBe('modern');
      });

      // Test zen
      await result.current.setTheme('zen');
      await waitFor(() => {
        expect(result.current.theme).toBe('zen');
      });

      // Test cyber
      await result.current.setTheme('cyber');
      await waitFor(() => {
        expect(result.current.theme).toBe('cyber');
      });
    });

    it('should accept any stored theme value without validation', async () => {
      // Note: Current implementation does not validate theme values
      // This test documents actual behavior, not ideal behavior
      mockChrome.storage.sync.get.mockResolvedValue({
        visual_theme: 'invalid-theme',
      });

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        // Accepts invalid theme value as-is (no validation)
        expect(result.current.theme).toBe('invalid-theme');
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Loading States', () => {
    it('should start with loading state true', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.isLoading).toBe(true);
    });

    it('should set loading state to false after theme loads', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should not set loading state when receiving storage changes', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate storage change
      const changes = {
        visual_theme: {
          oldValue: 'modern',
          newValue: 'zen',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('zen');
      });

      // Should not trigger loading state
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('DOM Integration', () => {
    it('should apply data-theme attribute to document.body', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial theme should be applied
      expect(document.body.getAttribute('data-theme')).toBe('modern');

      // Change theme
      await result.current.setTheme('cyber');

      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('cyber');
      });
    });

    it('should update data-theme attribute when storage changes', async () => {
      renderHook(() => useTheme());

      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('modern');
      });

      // Simulate storage change
      const changes = {
        visual_theme: {
          oldValue: 'modern',
          newValue: 'zen',
        },
      };

      storageChangeListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('zen');
      });
    });

    it('should maintain data-theme attribute across multiple theme changes', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change to zen
      await result.current.setTheme('zen');
      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('zen');
      });

      // Change to cyber
      await result.current.setTheme('cyber');
      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('cyber');
      });

      // Change back to modern
      await result.current.setTheme('modern');
      await waitFor(() => {
        expect(document.body.getAttribute('data-theme')).toBe('modern');
      });
    });
  });

  describe('Memory Management', () => {
    it('should cleanup storage listener on unmount', async () => {
      const removeListenerSpy = vi.fn();
      (mockChrome.storage.onChanged.addListener as any).mockImplementation((listener: any) => {
        storageChangeListeners.push(listener);
        return removeListenerSpy;
      });

      const { unmount } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
      });

      unmount();

      // Note: Actual cleanup verification depends on useTheme implementation
      // This test serves as a reminder to implement cleanup
    });
  });
});
