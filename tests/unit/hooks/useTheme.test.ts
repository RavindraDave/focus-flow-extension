import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme, ThemeMode } from '../../../src/hooks/useTheme';

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {};
const mockStorageListeners: Array<
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
> = [];

global.chrome = {
  storage: {
    sync: {
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
        mockStorageListeners.forEach((listener) => listener(changes, 'sync'));
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



describe('useTheme', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    mockStorageListeners.length = 0;
    vi.clearAllMocks();

    // Spy on document.body.setAttribute
    vi.spyOn(document.body, 'setAttribute');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default theme (modern) when no saved theme', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe('modern');
      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'modern');
    });

    it('should load saved theme from storage', async () => {
      mockStorage['visual_theme'] = 'zen';

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe('zen');
      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'zen');
    });
  });

  describe('Theme switching', () => {
    it('should update theme when setTheme is called', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setTheme('cyber');
      });

      expect(result.current.theme).toBe('cyber');
      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'cyber');
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ visual_theme: 'cyber' });
    });

    it('should support all three themes: modern, zen, cyber', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test modern
      await act(async () => {
        await result.current.setTheme('modern');
      });
      expect(result.current.theme).toBe('modern');

      // Test zen
      await act(async () => {
        await result.current.setTheme('zen');
      });
      expect(result.current.theme).toBe('zen');

      // Test cyber
      await act(async () => {
        await result.current.setTheme('cyber');
      });
      expect(result.current.theme).toBe('cyber');
    });
  });

  describe('Storage synchronization', () => {
    it('should sync theme changes across extension pages', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate storage change from another page
      act(() => {
        const changes = {
          visual_theme: {
            newValue: 'zen' as ThemeMode,
            oldValue: 'modern' as ThemeMode,
          },
        };
        mockStorageListeners.forEach((listener) => listener(changes, 'sync'));
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('zen');
      });

      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'zen');
    });
  });

  describe('Error handling', () => {
    it('should fallback to default theme if storage fails', async () => {
      vi.mocked(chrome.storage.sync.get).mockRejectedValueOnce(new Error('Storage error'));

      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.theme).toBe('modern');
      expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'modern');
    });

    it('should throw error if setTheme fails', async () => {
      const { result } = renderHook(() => useTheme());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(chrome.storage.sync.set).mockRejectedValueOnce(new Error('Save failed'));

      await expect(
        act(async () => {
          await result.current.setTheme('zen');
        })
      ).rejects.toThrow('Unable to save theme preference');
    });
  });
});
