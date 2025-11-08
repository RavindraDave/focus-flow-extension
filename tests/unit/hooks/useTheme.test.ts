import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from '../../../src/hooks/useTheme';

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {};
const mockStorageListeners: Array<
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
> = [];

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        return Promise.resolve(mockStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        // Trigger storage change listeners
        const changes: Record<string, chrome.storage.StorageChange> = {};
        Object.entries(items).forEach(([key, value]) => {
          changes[key] = {
            newValue: value,
            oldValue: mockStorage[key],
          };
        });
        mockStorageListeners.forEach((listener) => listener(changes, 'local'));
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn((callback) => {
        mockStorageListeners.push(callback);
      }),
      removeListener: vi.fn((callback) => {
        const index = mockStorageListeners.indexOf(callback);
        if (index > -1) {
          mockStorageListeners.splice(index, 1);
        }
      }),
    },
  },
} as any;

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(callback);
      }
    }),
    removeEventListener: vi.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }),
    dispatchEvent: vi.fn((event: MediaQueryListEvent) => {
      listeners.forEach((listener) => listener(event));
      return true;
    }),
  };
};

describe('useTheme', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    mockStorageListeners.length = 0;

    // Mock matchMedia
    matchMediaMock = createMatchMediaMock(false);
    window.matchMedia = vi.fn(() => matchMediaMock as any);

    // Mock document.documentElement
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should default to system theme', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });
    });

    it('should load saved theme from storage', async () => {
      mockStorage['theme_preference'] = 'dark';

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
        expect(result.current.effectiveTheme).toBe('dark');
      });
    });

    it('should apply dark theme to document when loaded', async () => {
      mockStorage['theme_preference'] = 'dark';

      renderHook(() => useTheme());

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should apply light theme to document when loaded', async () => {
      mockStorage['theme_preference'] = 'light';

      renderHook(() => useTheme());

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('System Preference', () => {
    it('should use system dark preference when theme is system', async () => {
      matchMediaMock = createMatchMediaMock(true);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.effectiveTheme).toBe('dark');
      });
    });

    it('should use system light preference when theme is system', async () => {
      matchMediaMock = createMatchMediaMock(false);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.effectiveTheme).toBe('light');
      });
    });

    it('should listen to system preference changes', async () => {
      mockStorage['theme_preference'] = 'system';

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });

      // Simulate system preference change to dark
      act(() => {
        matchMediaMock.dispatchEvent({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.effectiveTheme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should not listen to system changes when theme is not system', async () => {
      mockStorage['theme_preference'] = 'light';

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });

      // Simulate system preference change (should be ignored)
      act(() => {
        matchMediaMock.dispatchEvent({
          matches: true,
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.effectiveTheme).toBe('light');
      });
    });
  });

  describe('Setting Theme', () => {
    it('should set theme to light', async () => {
      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.effectiveTheme).toBe('light');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        theme_preference: 'light',
      });
    });

    it('should set theme to dark', async () => {
      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.effectiveTheme).toBe('dark');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        theme_preference: 'dark',
      });
    });

    it('should set theme to system', async () => {
      matchMediaMock = createMatchMediaMock(true);
      window.matchMedia = vi.fn(() => matchMediaMock as any);

      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('dark');
    });

    it('should apply dark class to document', async () => {
      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document for light theme', async () => {
      document.documentElement.classList.add('dark');

      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(chrome.storage.local.set).mockRejectedValueOnce(
        new Error('Storage quota exceeded')
      );

      const { result } = renderHook(() => useTheme());

      await expect(
        act(async () => {
          await result.current.setTheme('dark');
        })
      ).rejects.toThrow('Unable to save theme preference');
    });
  });

  describe('Storage Sync', () => {
    it('should sync theme changes from other extension pages', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });

      // Simulate storage change from another page
      act(() => {
        const changes = {
          theme_preference: {
            newValue: 'dark',
            oldValue: 'system',
          },
        };
        mockStorageListeners.forEach((listener) => listener(changes, 'local'));
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
        expect(result.current.effectiveTheme).toBe('dark');
      });
    });

    it('should ignore storage changes from other areas', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });

      // Simulate storage change from sync storage (should be ignored)
      act(() => {
        const changes = {
          theme_preference: {
            newValue: 'dark',
            oldValue: 'system',
          },
        };
        mockStorageListeners.forEach((listener) => listener(changes, 'sync'));
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });
    });

    it('should ignore storage changes for other keys', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });

      // Simulate storage change for different key
      act(() => {
        const changes = {
          other_key: {
            newValue: 'value',
            oldValue: 'old_value',
          },
        };
        mockStorageListeners.forEach((listener) => listener(changes, 'local'));
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useTheme());

      unmount();

      expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
    });

    it('should remove media query listeners on unmount', () => {
      mockStorage['theme_preference'] = 'system';

      const { unmount } = renderHook(() => useTheme());

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted storage data', async () => {
      mockStorage['theme_preference'] = { invalid: 'data' };

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        // Should fall back to system preference
        expect(result.current.effectiveTheme).toBeDefined();
      });
    });

    it('should handle multiple rapid theme changes', async () => {
      const { result } = renderHook(() => useTheme());

      await act(async () => {
        await result.current.setTheme('dark');
        await result.current.setTheme('light');
        await result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });
  });
});
