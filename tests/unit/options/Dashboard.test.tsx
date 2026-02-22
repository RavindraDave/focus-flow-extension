/**
 * Dashboard Component Tests
 *
 * Tests for the Dashboard tab including:
 * - Stats display (focus score, today's focus, distractions blocked)
 * - Quick toggles (nuclear mode, strict blocking)
 * - Toggle state persistence
 * - Optimistic UI updates
 * - Error handling
 */


import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

// @ts-ignore
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
  });

  describe('Stats Display', () => {
    it('should render focus score stat', () => {
      render(<App />);

      expect(screen.getByText('Focus Score')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Top 10%')).toBeInTheDocument();
    });

    it('should render today\'s focus time', () => {
      render(<App />);

      expect(screen.getByText('Today\'s Focus')).toBeInTheDocument();
      expect(screen.getByText('4h 12m')).toBeInTheDocument();
    });

    it('should render distractions blocked count', () => {
      render(<App />);

      expect(screen.getByText('Distractions Blocked')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
    });

    it('should display stats in card format with proper styling', () => {
      render(<App />);

      const focusScoreCard = screen.getByText('Focus Score').closest('div');
      expect(focusScoreCard).toHaveClass('bg-surface', 'rounded-xl', 'shadow-md');
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
        expect(screen.getByText(/instantly blocks all sites except whitelist/i)).toBeInTheDocument();
      });
    });

    it('should render strict blocking toggle', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Strict Blocking')).toBeInTheDocument();
        expect(screen.getByText(/prevents.*emergency access/i)).toBeInTheDocument();
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

      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['nuclear_mode', 'strict_blocking']);
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

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        fireEvent.click(nuclearToggle);
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        nuclear_mode: true,
      });
    });

    it('should save strict blocking to storage when toggled', async () => {
      render(<App />);

      await waitFor(() => {
        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        fireEvent.click(strictToggle);
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        strict_blocking: true,
      });
    });

    it('should save false value when toggling off', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: true,
      });

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        fireEvent.click(nuclearToggle);
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        nuclear_mode: false,
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
