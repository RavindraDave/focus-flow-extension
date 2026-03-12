/**
 * Dashboard Component Tests
 *
 * Tests for the Dashboard tab including:
 * - Stats display (focus score, today's focus, current streak)
 * - Quick toggles (nuclear mode, strict blocking)
 * - Toggle state persistence
 * - Optimistic UI updates
 * - Error handling
 */


import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock feature flags to enable premium features in tests
vi.mock('../../../src/utils/constants', async () => {
  const actual: Record<string, unknown> = await vi.importActual('../../../src/utils/constants');
  return {
    ...actual,
    FEATURE_FLAGS: {
      ...(actual.FEATURE_FLAGS as Record<string, unknown>),
      FREE: {
        ...((actual.FEATURE_FLAGS as Record<string, Record<string, unknown>>).FREE),
        nuclearMode: true,
        dataExport: true,
      },
    },
  };
});

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
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({ success: false }),
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
};

// @ts-expect-error - partial chrome mock for testing
global.chrome = mockChrome;

// We need to test the DashboardTab component, but it's not exported separately
// So we'll import the full App and navigate to Dashboard
import App from '../../../src/options/App';

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default storage state
    mockChrome.storage.sync.get.mockResolvedValue({
      nuclear_mode: false,
      strict_blocking: false,
      visual_theme: 'modern',
    });

    mockChrome.storage.sync.set.mockResolvedValue(undefined);
    mockChrome.runtime.sendMessage.mockResolvedValue({ success: false });
  });

  describe('Stats Display', () => {
    it('should render focus score stat', async () => {
      render(<App />);

      expect(screen.getByText('Focus Score')).toBeInTheDocument();
      // With no analytics data, focus score defaults to 0% (may appear in multiple places)
      await waitFor(() => {
        expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render today\'s focus time', async () => {
      render(<App />);

      // &apos; in JSX renders as plain apostrophe
      expect(screen.getByText("Today's Focus")).toBeInTheDocument();
      // With no analytics data, focus time defaults to 0m
      await waitFor(() => {
        expect(screen.getAllByText('0m').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render current streak stat', async () => {
      render(<App />);

      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      // With no analytics data, streak defaults to 0 Days
      await waitFor(() => {
        expect(screen.getByText('0 Days')).toBeInTheDocument();
      });
    });

    it('should display stats in card format with proper styling', () => {
      render(<App />);

      // Find the card containing Focus Score by walking up to the card div
      const focusScoreLabel = screen.getByText('Focus Score');
      // Walk up to find the card container with bg-surface class
      let card = focusScoreLabel.closest('div');
      while (card && !card.classList.contains('bg-surface')) {
        card = card.parentElement?.closest('div') ?? null;
      }
      expect(card).not.toBeNull();
      expect(card).toHaveClass('bg-surface', 'rounded-xl', 'shadow-md');
    });
  });

  describe('Quick Toggles Section', () => {
    it('should render quick toggles heading', () => {
      render(<App />);

      expect(screen.getByText('Quick Toggles')).toBeInTheDocument();
    });

    it('should render nuclear mode toggle', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Nuclear Mode')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle Nuclear Mode')).toBeInTheDocument();
      });
    });

    it('should render strict blocking toggle', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Strict Blocking')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle Strict Blocking')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle State Management', () => {
    it('should load nuclear mode state from storage on mount', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: true,
        strict_blocking: false,
      });

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });

      // DashboardTab calls get with these keys (App may also call with more keys)
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(
        expect.arrayContaining(['nuclear_mode', 'strict_blocking'])
      );
    });

    it('should load strict blocking state from storage on mount', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: false,
        strict_blocking: true,
      });

      render(<App />);

      await waitFor(() => {
        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        expect(strictToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should default to false when no stored value exists', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');

        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        expect(strictToggle).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Toggle Interactions', () => {
    it('should toggle nuclear mode on click', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(nuclearToggle);

        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should toggle strict blocking on click', async () => {
      render(<App />);

      await waitFor(() => {
        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        expect(strictToggle).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(strictToggle);

        expect(strictToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should toggle off when clicked again', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: true,
      });

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(nuclearToggle);

        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Persistence', () => {
    it('should save nuclear mode to storage when toggled', async () => {
      render(<App />);

      // Wait for loading to complete before clicking
      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).not.toBeDisabled();
      });

      const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
      fireEvent.click(nuclearToggle);

      await waitFor(() => {
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
          nuclear_mode: true,
        });
      });
    });

    it('should save strict blocking to storage when toggled', async () => {
      render(<App />);

      // Wait for loading to complete before clicking
      await waitFor(() => {
        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        expect(strictToggle).not.toBeDisabled();
      });

      const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
      fireEvent.click(strictToggle);

      await waitFor(() => {
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
          strict_blocking: true,
        });
      });
    });

    it('should save false value when toggling off', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: true,
      });

      render(<App />);

      // Wait for loading to complete before clicking
      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });

      const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
      fireEvent.click(nuclearToggle);

      await waitFor(() => {
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
          nuclear_mode: false,
        });
      });
    });
  });

  describe('Optimistic UI', () => {
    it('should update UI immediately before storage save completes', async () => {
      let resolveStorageSet: () => void;
      const storageSetPromise = new Promise<void>((resolve) => {
        resolveStorageSet = resolve;
      });
      mockChrome.storage.sync.set.mockReturnValue(storageSetPromise);

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(nuclearToggle);

        // UI should update immediately (optimistic)
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');

        // But storage.set hasn't resolved yet
        expect(mockChrome.storage.sync.set).toHaveBeenCalled();
      });

      // Clean up
      resolveStorageSet!();
    });

    it('should revert UI if storage save fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockChrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        fireEvent.click(nuclearToggle);

        // Should show enabled initially (optimistic)
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });

      // Should revert back to false after error
      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('should disable toggles while loading state', () => {
      render(<App />);

      // Toggles should be disabled initially
      const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
      expect(nuclearToggle).toBeDisabled();
    });

    it('should enable toggles after loading completes', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).not.toBeDisabled();
      });
    });

    it('should show disabled cursor style when loading', () => {
      render(<App />);

      const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
      expect(nuclearToggle).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-pressed attribute', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(nuclearToggle);

        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should have descriptive aria-label', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByLabelText('Toggle Nuclear Mode')).toBeInTheDocument();
        expect(screen.getByLabelText('Toggle Strict Blocking')).toBeInTheDocument();
      });
    });

    it('should have visible focus rings', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveClass('focus:ring-2', 'focus:ring-accent');
      });
    });

    it('should be keyboard accessible', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        nuclearToggle.focus();
        expect(document.activeElement).toBe(nuclearToggle);
      });
    });
  });

  describe('Activity Chart', () => {
    it('should render activity chart section', () => {
      render(<App />);

      expect(screen.getByText('Activity (Last 7 Days)')).toBeInTheDocument();
    });

    it('should display analytics dashboard component', () => {
      render(<App />);

      const activitySection = screen.getByText('Activity (Last 7 Days)').closest('div');
      expect(activitySection).toBeInTheDocument();
    });
  });
});
