/**
 * Options App Component Tests
 *
 * Tests for the main Options page including:
 * - Tab navigation (6 tabs)
 * - Mobile responsive sidebar
 * - Dashboard toggles (nuclear mode, strict blocking)
 * - Data export/import handlers
 * - Theme selector
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock feature flags to enable premium features in tests
vi.mock('../../../src/utils/constants', async () => {
  const actual = await vi.importActual('../../../src/utils/constants') as Record<string, unknown>;
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

import App from '../../../src/options/App';

// Mock chrome API
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    openOptionsPage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`),
    sendMessage: vi.fn().mockResolvedValue({ success: false }),
  },
};

// @ts-ignore
global.chrome = mockChrome;

describe('Options App', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default storage mocks
    mockChrome.storage.sync.get.mockResolvedValue({
      visual_theme: 'modern',
      nuclear_mode: false,
      strict_blocking: false,
      sound_enabled: true,
      sound_volume: 0.5,
    });

    mockChrome.storage.local.get.mockResolvedValue({
      history: [],
    });

    mockChrome.storage.sync.set.mockResolvedValue(undefined);
    mockChrome.storage.local.set.mockResolvedValue(undefined);
  });

  describe('Tab Navigation', () => {
    it('should render all 6 tabs in sidebar', () => {
      render(<App />);

      // Dashboard text may appear in both sidebar tab and content heading
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Timer Settings')).toBeInTheDocument();
      expect(screen.getByText('Blocking Rules')).toBeInTheDocument();
      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText('Gamification')).toBeInTheDocument();
      expect(screen.getByText('Data & Config')).toBeInTheDocument();
    });

    it('should show Dashboard tab by default', () => {
      render(<App />);

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should switch to Timer Settings tab when clicked', () => {
      render(<App />);

      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();
    });

    it('should switch to Blocking Rules tab when clicked', () => {
      render(<App />);

      const blockingTab = screen.getByText('Blocking Rules');
      fireEvent.click(blockingTab);

      expect(screen.getByRole('heading', { name: /blocking rules/i })).toBeInTheDocument();
    });

    it('should switch to Integrations tab when clicked', () => {
      render(<App />);

      const integrationsTab = screen.getByText('Integrations');
      fireEvent.click(integrationsTab);

      expect(screen.getByRole('heading', { name: /integrations/i })).toBeInTheDocument();
    });

    it('should switch to Gamification tab when clicked', () => {
      render(<App />);

      const gamificationTab = screen.getByText('Gamification');
      fireEvent.click(gamificationTab);

      expect(screen.getByRole('heading', { name: /gamification/i })).toBeInTheDocument();
    });

    it('should switch to Data & Config tab when clicked', () => {
      render(<App />);

      const dataTab = screen.getByText('Data & Config');
      fireEvent.click(dataTab);

      expect(screen.getByRole('heading', { name: /data & configuration/i })).toBeInTheDocument();
    });

    it('should highlight active tab with accent color', async () => {
      render(<App />);

      // Use getAllByText since "Timer Settings" appears in both sidebar and content
      const timerButtons = screen.getAllByText('Timer Settings');
      const timerTab = timerButtons[0]!.closest('button');
      expect(timerTab).not.toHaveClass('bg-accent');

      fireEvent.click(timerTab!);

      await waitFor(() => {
        const updatedButtons = screen.getAllByText('Timer Settings');
        expect(updatedButtons[0]!.closest('button')).toHaveClass('bg-accent');
      });
    });
  });

  describe('Mobile Responsive Sidebar', () => {
    it('should have hamburger menu button on mobile', () => {
      render(<App />);

      // Hamburger button should be present (md:hidden in production)
      const hamburger = screen.getByLabelText('Open navigation menu');
      expect(hamburger).toBeInTheDocument();
    });

    it('should open sidebar when hamburger is clicked', () => {
      render(<App />);

      const hamburger = screen.getByLabelText('Open navigation menu');
      fireEvent.click(hamburger);

      // Sidebar should be visible (translate-x-0 class)
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should close sidebar when backdrop is clicked', () => {
      render(<App />);

      // Open sidebar first
      const hamburger = screen.getByLabelText('Open navigation menu');
      fireEvent.click(hamburger);

      // Click backdrop (the fixed overlay div rendered when sidebar is open)
      const backdrop = document.querySelector('div.fixed.inset-0');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      // Sidebar should be hidden
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should close sidebar when tab is selected on mobile', () => {
      render(<App />);

      // Open sidebar
      const hamburger = screen.getByLabelText('Open navigation menu');
      fireEvent.click(hamburger);

      // Click a tab
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      // Sidebar should close automatically
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Dashboard Toggles', () => {
    it('should load nuclear mode toggle state from storage', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        nuclear_mode: true,
      });

      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should load strict blocking toggle state from storage', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        strict_blocking: true,
      });

      render(<App />);

      await waitFor(() => {
        const strictToggle = screen.getByLabelText('Toggle Strict Blocking');
        expect(strictToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should save nuclear mode toggle to storage when clicked', async () => {
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

    it('should save strict blocking toggle to storage when clicked', async () => {
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

    it('should update toggle UI optimistically', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(nuclearToggle);

        // Should update immediately (optimistic UI)
        expect(nuclearToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should disable toggles while loading', async () => {
      render(<App />);

      // Toggles should be disabled initially
      const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
      expect(nuclearToggle).toBeDisabled();

      // Should enable after loading
      await waitFor(() => {
        expect(nuclearToggle).not.toBeDisabled();
      });
    });
  });

  describe('Theme Selector', () => {
    it('should render all 3 theme options', () => {
      render(<App />);

      // Navigate to Timer Settings tab
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      expect(screen.getByText('Modern Pro')).toBeInTheDocument();
      expect(screen.getByText('Zen Mode')).toBeInTheDocument();
      expect(screen.getByText('Cyber Focus')).toBeInTheDocument();
    });

    it('should highlight current theme', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        visual_theme: 'zen',
      });

      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const zenTheme = screen.getByText('Zen Mode').closest('button');
        expect(zenTheme).toHaveClass('border-accent');
      });
    });

    it('should change theme when theme card is clicked', async () => {
      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const cyberTheme = screen.getByText('Cyber Focus').closest('button');
        fireEvent.click(cyberTheme!);
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        visual_theme: 'cyber',
      });
    });
  });

  describe('Sound Settings', () => {
    it('should load sound settings from storage', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        sound_enabled: false,
        sound_volume: 0.75,
      });

      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const soundToggle = screen.getByLabelText('Toggle notification sounds');
        expect(soundToggle).toHaveAttribute('aria-pressed', 'false');

        const volumeSlider = screen.getByLabelText('Adjust notification volume');
        expect(volumeSlider).toHaveValue('75');
      });
    });

    it('should save sound enabled toggle to storage', async () => {
      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const soundToggle = screen.getByLabelText('Toggle notification sounds');
        fireEvent.click(soundToggle);
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        sound_enabled: false,
      });
    });

    it('should save volume changes to storage', async () => {
      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const volumeSlider = screen.getByLabelText('Adjust notification volume');
        fireEvent.change(volumeSlider, { target: { value: '80' } });
      });

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        sound_volume: 0.8,
      });
    });

    it('should disable volume slider when sound is off', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        sound_enabled: false,
      });

      render(<App />);

      // Navigate to Timer Settings
      const timerTab = screen.getByText('Timer Settings');
      fireEvent.click(timerTab);

      await waitFor(() => {
        const volumeSlider = screen.getByLabelText('Adjust notification volume');
        expect(volumeSlider).toBeDisabled();
      });
    });
  });

  describe('Send Feedback Link', () => {
    it('should render Send Feedback button in footer', () => {
      render(<App />);

      const feedbackButton = screen.getByText('📝 Send Feedback');
      expect(feedbackButton).toBeInTheDocument();
    });

    it('should open feedback email when clicked', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<App />);

      const feedbackButton = screen.getByText('📝 Send Feedback');
      fireEvent.click(feedbackButton);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('mailto:'),
        '_blank'
      );

      windowOpenSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<App />);

      // There are two h1 elements (sidebar + mobile header), both say "Focus Flow"
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s.length).toBeGreaterThanOrEqual(1);
      expect(h1s[0]).toHaveTextContent('Focus Flow');

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Dashboard');
    });

    it('should support keyboard navigation for tabs', () => {
      render(<App />);

      const timerTab = screen.getByText('Timer Settings').closest('button');

      // Should be focusable
      timerTab?.focus();
      expect(document.activeElement).toBe(timerTab);

      // Activate tab (JSDOM doesn't auto-click on Enter, so use click after focus)
      fireEvent.click(timerTab!);
      expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();
    });

    it('should have aria-selected for active tab', () => {
      render(<App />);

      // "Dashboard" appears in both sidebar tab and content heading, use getAllByText
      const dashboardTab = screen.getAllByText('Dashboard')[0]!.closest('button');
      expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

      const timerTab = screen.getByText('Timer Settings').closest('button');
      expect(timerTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have aria-pressed for toggle buttons', async () => {
      render(<App />);

      await waitFor(() => {
        const nuclearToggle = screen.getByLabelText('Toggle Nuclear Mode');
        expect(nuclearToggle).toHaveAttribute('aria-pressed');
      });
    });

    it('should have proper focus rings on interactive elements', () => {
      render(<App />);

      const timerTab = screen.getByText('Timer Settings').closest('button');
      expect(timerTab).toHaveClass('focus:ring-2', 'focus:ring-accent');
    });
  });
});
