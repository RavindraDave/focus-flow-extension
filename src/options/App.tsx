/**
 * Options App - Comprehensive Settings and Analytics page
 * Redesigned with 6-tab sidebar navigation per FEATURE_REQUIREMENTS.md
 * Supports all three visual themes: Modern Pro, Zen Mode, Cyber Focus
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  SettingsForm,
  AnalyticsDashboard,
  BlockRuleList,
  ScheduleList,
  SuggestedSites,
  VirtualGarden,
  FocusMainframe,
  ProductivityHeatmap,
} from './components';
import { Spinner } from '../components/atoms/Spinner';

type Tab = 'dashboard' | 'timer' | 'blocking' | 'integrations' | 'gamification' | 'data';

/**
 * Main Options App component with 6-tab navigation
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, isLoading: settingsLoading, error, updateSettings } = useSettings();

  /**
   * Handle tab navigation and close sidebar on mobile
   */
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  /**
   * Sidebar navigation item
   */
  const NavItem: React.FC<{
    tab: Tab;
    icon: React.ReactNode;
    label: string;
    description: string;
  }> = ({ tab, icon, label, description }) => (
    <button
      type="button"
      onClick={() => handleTabChange(tab)}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${activeTab === tab
          ? 'bg-accent text-text-inverse shadow-md'
          : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
        }
      `}
      aria-selected={activeTab === tab}
      role="tab"
    >
      <div className="flex items-center space-x-3">
        <span className="text-slate-500 group-hover:text-indigo-600 transition-colors">{icon}</span>
        <div className="flex-1">
          <div className="font-semibold text-sm">{label}</div>
          <div
            className={`text-xs mt-0.5 ${activeTab === tab ? 'opacity-90' : 'opacity-60'
              }`}
          >
            {description}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-primary flex relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-80 bg-surface border-r border-border flex flex-col
          fixed md:sticky top-0 h-screen z-50 md:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              Focus Flow
            </h1>
          </div>
          <p className="text-sm text-text-tertiary mt-1">
            Productivity & Focus Management
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 p-4 space-y-2 overflow-y-auto"
          role="tablist"
          aria-label="Settings navigation"
        >
          <NavItem
            tab="dashboard"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            label="Dashboard"
            description="Overview & quick actions"
          />
          <NavItem
            tab="timer"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Timer Settings"
            description="Pomodoro durations & sounds"
          />
          <NavItem
            tab="blocking"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            label="Blocking Rules"
            description="Manage blocked sites & schedules"
          />
          <NavItem
            tab="integrations"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
            label="Integrations"
            description="Connect external apps & services"
          />
          <NavItem
            tab="gamification"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Gamification"
            description="Track progress & achievements"
          />
          <NavItem
            tab="data"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
            label="Data & Config"
            description="Export, import, and manage data"
          />
        </nav>

        {/* Footer - Pro Plan Upsell */}
        <div className="p-4 border-t border-border">
          <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
            <h4 className="text-sm font-bold text-accent mb-2">✨ Pro Plan</h4>
            <p className="text-xs text-text-tertiary mb-3">
              Unlock unlimited schedules, advanced analytics, and cloud sync.
            </p>
            <button className="w-full bg-accent hover:bg-accent-hover text-text-inverse text-xs font-medium py-2 rounded-lg transition">
              Upgrade Now
            </button>
          </div>
          <button
            onClick={() => window.open('mailto:your-email@example.com?subject=Focus%20Flow%20Feedback', '_blank')}
            className="text-xs text-text-tertiary hover:text-accent mt-3 w-full text-center transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded py-1"
            aria-label="Send feedback or report an issue"
          >
            📝 Send Feedback
          </button>
          <p className="text-xs text-text-muted text-center mt-2">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-primary md:ml-0">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden sticky top-0 z-30 bg-bg-surface border-b border-border p-4 flex items-center justify-between shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-bg-secondary hover:bg-accent/10 text-text-primary transition focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Open navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-white text-xs font-bold">F</div>
            Focus Flow
          </h1>
          <div className="w-10" aria-hidden="true" /> {/* Spacer for centering */}
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardTab settings={settings} setActiveTab={setActiveTab} />
          )}

          {/* Timer Settings Tab */}
          {activeTab === 'timer' && (
            <TimerTab
              settings={settings}
              isLoading={settingsLoading}
              error={error}
              onSave={updateSettings}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {/* Blocking Rules Tab */}
          {activeTab === 'blocking' && <BlockingTab />}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && <IntegrationsTab />}

          {/* Gamification Tab */}
          {activeTab === 'gamification' && <GamificationTab theme={theme} />}

          {/* Data & Config Tab */}
          {activeTab === 'data' && <DataConfigTab />}
        </div>
      </main>
    </div>
  );
};

/**
 * Dashboard Tab Component
 */
const DashboardTab: React.FC<{ settings: any; setActiveTab: (tab: Tab) => void }> = ({ setActiveTab }) => {
  const [nuclearMode, setNuclearMode] = useState(false);
  const [strictBlocking, setStrictBlocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get real analytics data
  const { todayStats, streak, isLoading: analyticsLoading } = useAnalytics();

  // Load toggle states from chrome.storage on mount
  React.useEffect(() => {
    async function loadToggles() {
      try {
        const result = await chrome.storage.sync.get(['nuclear_mode', 'strict_blocking']);
        setNuclearMode(result.nuclear_mode ?? false);
        setStrictBlocking(result.strict_blocking ?? false);
      } catch (error) {
        console.error('Failed to load toggle states:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadToggles();
  }, []);

  // Save Nuclear Mode to storage with optimistic UI
  const handleNuclearModeToggle = async () => {
    const newValue = !nuclearMode;
    const previousValue = nuclearMode;

    // Optimistic update
    setNuclearMode(newValue);

    try {
      await chrome.storage.sync.set({ nuclear_mode: newValue });
    } catch (error) {
      console.error('Failed to save nuclear mode:', error);
      // Revert on error
      setNuclearMode(previousValue);
    }
  };

  // Save Strict Blocking to storage with optimistic UI
  const handleStrictBlockingToggle = async () => {
    const newValue = !strictBlocking;
    const previousValue = strictBlocking;

    // Optimistic update
    setStrictBlocking(newValue);

    try {
      await chrome.storage.sync.set({ strict_blocking: newValue });
    } catch (error) {
      console.error('Failed to save strict blocking:', error);
      // Revert on error
      setStrictBlocking(previousValue);
    }
  };

  // Format focus time (minutes to hours and minutes)
  const formatFocusTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {return `${mins}m`;}
    return `${hours}h ${mins}m`;
  };

  // Calculate focus score (simple formula based on pomodoros completed)
  const calculateFocusScore = (): number => {
    if (!todayStats) {return 0;}
    const total = todayStats.pomodorosCompleted + todayStats.pomodorosAbandoned;
    if (total === 0) {return 0;}
    return Math.round((todayStats.pomodorosCompleted / total) * 100);
  };

  const focusScore = calculateFocusScore();
  const focusTime = todayStats?.focusTime || 0;
  const currentStreak = streak?.current || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            Dashboard
          </h2>
          <p className="text-text-secondary text-sm">
            {analyticsLoading
              ? 'Loading your stats...'
              : focusTime > 0
                ? `Welcome back! You've been focused for ${formatFocusTime(focusTime)} today.`
                : 'Welcome back! Start a focus session to see your stats.'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-bg-secondary border-2 border-surface shadow-sm overflow-hidden flex items-center justify-center text-xl">
            👤
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Focus Score */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-text-tertiary">Focus Score</p>
              <h3 className="text-4xl font-bold text-text-primary mt-2">
                {analyticsLoading ? '...' : `${focusScore}%`}
              </h3>
            </div>
            {focusScore >= 80 && (
              <span className="bg-success/20 text-success text-xs font-medium px-2.5 py-0.5 rounded-full">
                Excellent
              </span>
            )}
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${focusScore}%` }}></div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            {todayStats ? `${todayStats.pomodorosCompleted} completed, ${todayStats.pomodorosAbandoned} abandoned` : 'No sessions yet'}
          </p>
        </div>

        {/* Today's Focus */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <p className="text-sm font-medium text-text-tertiary">Today's Focus</p>
          <h3 className="text-4xl font-bold text-text-primary mt-2">
            {analyticsLoading ? '...' : formatFocusTime(focusTime)}
          </h3>
          <p className="text-xs text-text-muted mt-2">
            {todayStats?.pomodorosCompleted || 0} pomodoros completed
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-tertiary">Current Streak</p>
              <h3 className="text-4xl font-bold text-text-primary mt-2">
                {analyticsLoading ? '...' : `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`}
              </h3>
            </div>
            {currentStreak > 0 && <span className="text-2xl">🔥</span>}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {streak ? `Longest: ${streak.longest} days` : 'Start your streak!'}
          </p>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="bg-surface p-6 rounded-xl shadow-md border border-border mb-8">
        <h3 className="text-lg font-bold text-text-primary mb-4">Quick Toggles</h3>
        <div className="space-y-4">
          {/* Nuclear Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-sm">Nuclear Mode</h4>
              </div>
            </div>
            <button
              onClick={handleNuclearModeToggle}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${nuclearMode ? 'bg-accent' : 'bg-bg-secondary'
                }`}
              aria-pressed={nuclearMode}
              aria-label="Toggle Nuclear Mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${nuclearMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* Strict Blocking Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center text-info">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary text-sm">Strict Blocking</h4>
              </div>
            </div>
            <button
              onClick={handleStrictBlockingToggle}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${strictBlocking ? 'bg-accent' : 'bg-bg-secondary'
                }`}
              aria-pressed={strictBlocking}
              aria-label="Toggle Strict Blocking"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${strictBlocking ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setActiveTab('blocking')}
            className="w-full py-2 px-4 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary transition"
          >
            Manage Block List
          </button>
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
        <h3 className="text-lg font-bold text-text-primary mb-4">Activity (Last 7 Days)</h3>
        <AnalyticsDashboard />
      </div>
    </div>
  );
};

/**
 * Timer Settings Tab Component
 */
const TimerTab: React.FC<{
  settings: any;
  isLoading: boolean;
  error: string | null;
  onSave: (settings: any) => Promise<void>;
  theme: string;
  onThemeChange: (theme: any) => Promise<void>;
}> = ({ settings, isLoading, error, onSave, theme, onThemeChange }) => {
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [soundVolume, setSoundVolume] = React.useState(50);

  // Load sound settings on mount
  React.useEffect(() => {
    async function loadSoundSettings() {
      const result = await chrome.storage.sync.get(['sound_enabled', 'sound_volume']);
      setSoundEnabled(result.sound_enabled ?? true);
      setSoundVolume(result.sound_volume !== undefined ? result.sound_volume * 100 : 50);
    }
    loadSoundSettings();
  }, []);

  // Save sound enabled toggle
  const handleSoundEnabledChange = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await chrome.storage.sync.set({ sound_enabled: enabled });
  };

  // Save sound volume
  const handleVolumeChange = async (volume: number) => {
    setSoundVolume(volume);
    await chrome.storage.sync.set({ sound_volume: volume / 100 });
  };

  // Test current theme sound
  const handleTestSound = async () => {
    const { testThemeSound } = await import('../utils/sounds');
    await testThemeSound(theme as any, soundVolume / 100);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Timer Settings
        </h2>
        <p className="text-text-secondary">
          Configure Pomodoro behavior and appearance
        </p>
      </div>

      {/* Theme Selector */}
      <div className="bg-surface p-6 rounded-xl shadow-md border border-border mb-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Visual Theme</h3>
        <p className="text-sm text-text-tertiary mb-4">
          Choose your preferred visual style
        </p>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => onThemeChange('modern')}
            className={`p-4 rounded-xl border-2 transition-all ${theme === 'modern'
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-border-secondary'
              }`}
          >
            <div className="w-full h-20 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg mb-3"></div>
            <h4 className="font-semibold text-text-primary">Modern Pro</h4>
            <p className="text-xs text-text-tertiary mt-1">Clean & minimal</p>
          </button>
          <button
            onClick={() => onThemeChange('zen')}
            className={`p-4 rounded-xl border-2 transition-all ${theme === 'zen'
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-border-secondary'
              }`}
          >
            <div className="w-full h-20 bg-gradient-to-br from-[#F4EBD0] to-[#5F8D4E] rounded-lg mb-3"></div>
            <h4 className="font-semibold text-text-primary">Zen Mode</h4>
            <p className="text-xs text-text-tertiary mt-1">Organic & calming</p>
          </button>
          <button
            onClick={() => onThemeChange('cyber')}
            className={`p-4 rounded-xl border-2 transition-all ${theme === 'cyber'
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-border-secondary'
              }`}
          >
            <div className="w-full h-20 bg-gradient-to-br from-black via-[#00F0FF] to-[#FF0099] rounded-lg mb-3"></div>
            <h4 className="font-semibold text-text-primary">Cyber Focus</h4>
            <p className="text-xs text-text-tertiary mt-1">Neon & terminal</p>
          </button>
        </div>
      </div>

      {/* Sound Settings */}
      <div className="bg-surface p-6 rounded-xl shadow-md border border-border mb-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Notification Sounds</h3>
        <p className="text-sm text-text-tertiary mb-6">
          Theme-appropriate sounds for timer notifications
        </p>

        {/* Enable/Disable Sound */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-semibold text-text-primary">Enable Sounds</h4>
            <p className="text-sm text-text-tertiary">
              Play notification when timer completes
            </p>
          </div>
          <button
            onClick={() => handleSoundEnabledChange(!soundEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${soundEnabled ? 'bg-accent' : 'bg-bg-secondary'
              }`}
            aria-pressed={soundEnabled}
            aria-label="Toggle notification sounds"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="volume-slider" className="font-semibold text-text-primary">
              Volume
            </label>
            <span className="text-sm text-text-tertiary">{soundVolume}%</span>
          </div>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            disabled={!soundEnabled}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-accent
              [&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:rounded-lg [&::-webkit-slider-track]:border [&::-webkit-slider-track]:border-border [&::-webkit-slider-track]:bg-bg-tertiary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
              [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:border [&::-moz-range-track]:border-border [&::-moz-range-track]:bg-bg-tertiary
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
            aria-label="Adjust notification volume"
            style={{
              // @ts-ignore - CSS custom property for Zen theme
              '--volume-percent': `${soundVolume}%`,
              background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${soundVolume}%, var(--bg-tertiary) ${soundVolume}%, var(--bg-tertiary) 100%)`
            }}
          />
        </div>

        {/* Current Theme Sound */}
        <div className="bg-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-text-primary mb-1">
                Current Sound
              </h4>
              <p className="text-sm text-text-tertiary">
                {theme === 'modern' && '🔔 Clean professional ping'}
                {theme === 'zen' && '🎵 Calming singing bowl'}
                {theme === 'cyber' && '⚡ Futuristic synthetic beep'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Sound changes automatically with theme
              </p>
            </div>
            <button
              onClick={handleTestSound}
              disabled={!soundEnabled}
              className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Sound
            </button>
          </div>
        </div>


      </div>

      {/* Timer Configuration */}
      {isLoading && (
        <div className="bg-surface border border-border rounded-xl p-12 flex items-center justify-center">
          <Spinner size="lg" />
          <span className="ml-3 text-text-secondary">Loading settings...</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-error-50 border border-error text-error px-6 py-4 rounded-xl mb-6"
        >
          <strong className="font-semibold">Error: </strong>
          {error}
        </div>
      )}

      {settings && !isLoading && (
        <div className="bg-surface border border-border rounded-xl p-8 shadow-md">
          <SettingsForm settings={settings} onSave={onSave} />
        </div>
      )}
    </div>
  );
};

/**
 * Blocking Rules Tab Component
 */
const BlockingTab: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Blocking Rules
        </h2>
        <p className="text-text-secondary">
          Manage what gets blocked and when
        </p>
      </div>
      <SuggestedSites />
      <BlockRuleList />
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-text-primary mb-4">Schedules</h3>
        <ScheduleList />
      </div>
    </div>
  );
};

/**
 * Integrations Tab Component
 */
const IntegrationsTab: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Integrations
        </h2>
        <p className="text-text-secondary">
          Connect your focus state to external apps
        </p>
      </div>

      <div className="space-y-6">
        {/* Slack/Teams Integration */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                💬 Slack / Microsoft Teams
              </h3>
              <p className="text-sm text-text-tertiary mb-4">
                Auto-update your status when focus sessions start
              </p>
            </div>
            <span className="text-xs text-text-muted bg-bg-secondary px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
          <button
            disabled
            className="bg-bg-secondary text-text-tertiary px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Connect Account
          </button>
        </div>

        {/* Spotify Integration */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            🎵 Spotify / Music
          </h3>
          <p className="text-sm text-text-tertiary mb-4">
            Auto-play a focus playlist when timer starts
          </p>
          <input
            type="url"
            placeholder="Spotify Playlist URL"
            className="w-full px-4 py-2 rounded-lg border border-border bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Calendar Sync */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                📅 Calendar Sync
              </h3>
              <p className="text-sm text-text-tertiary mb-4">
                Auto-start timer when "Focus" calendar events begin
              </p>
            </div>
            <span className="text-xs text-text-muted bg-bg-secondary px-2 py-1 rounded">
              Coming Soon
            </span>
          </div>
          <button
            disabled
            className="bg-bg-secondary text-text-tertiary px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Connect Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Gamification Tab Component
 */
const GamificationTab: React.FC<{ theme: string }> = ({ theme }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Gamification
        </h2>
        <p className="text-text-secondary">
          Visualize your progress and achievements
        </p>
      </div>

      <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
        {theme === 'modern' && <ProductivityHeatmap />}
        {theme === 'zen' && <VirtualGarden />}
        {theme === 'cyber' && <FocusMainframe />}
      </div>
    </div>
  );
};

/**
 * Data & Config Tab Component
 */
const DataConfigTab: React.FC = () => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Export all configuration to JSON file
   */
  const handleExportConfig = async () => {
    setIsExporting(true);
    try {
      // Get all data from chrome.storage
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(null);

      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        sync: syncData,
        local: {
          // Only export non-sensitive local data
          analytics: localData.analytics || {},
          history: localData.history || [],
        },
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focus-flow-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Configuration exported successfully');
    } catch (error) {
      console.error('Failed to export configuration:', error);
      alert('Failed to export configuration. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Import configuration from JSON file
   */
  const handleImportConfig = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.version || !importData.sync) {
        throw new Error('Invalid configuration file format');
      }

      // Confirm before overwriting
      if (!confirm('This will replace your current settings. Continue?')) {
        setIsImporting(false);
        return;
      }

      // Import sync data
      await chrome.storage.sync.set(importData.sync);

      // Import local data (if available)
      if (importData.local) {
        await chrome.storage.local.set(importData.local);
      }

      alert('Configuration imported successfully! Reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('Failed to import configuration:', error);
      alert('Failed to import configuration. Please check the file and try again.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Export focus session history to CSV
   */
  const handleExportHistory = async () => {
    try {
      const { history } = await chrome.storage.local.get('history');
      const sessions = history || [];

      if (sessions.length === 0) {
        alert('No history data to export.');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Duration (minutes)', 'Task Name', 'Session Type'];
      const rows = sessions.map((session: any) => [
        new Date(session.timestamp || session.date).toLocaleString(),
        Math.round((session.duration || 0) / 60),
        session.taskName || session.label || 'Untitled',
        session.type || 'Focus',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string | number) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create downloadable CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focus-flow-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('History exported successfully');
    } catch (error) {
      console.error('Failed to export history:', error);
      alert('Failed to export history. Please try again.');
    }
  };

  /**
   * Reset all stored data with confirmation
   */
  const handleResetData = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL your data, including:\n\n• Settings and preferences\n• Blocklist and schedules\n• Focus history and analytics\n• Achievements and streaks\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?')) {
      return;
    }

    // Double confirmation
    if (!confirm('Last chance! Type YES in the next prompt to confirm deletion.')) {
      return;
    }

    const userInput = prompt('Type "YES" (in capital letters) to confirm:');
    if (userInput !== 'YES') {
      alert('Deletion cancelled.');
      return;
    }

    try {
      // Clear all storage
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();

      alert('All data has been deleted. Reloading extension...');
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data. Please try again or reinstall the extension.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Data & Configuration
        </h2>
        <p className="text-text-secondary">
          Manage your data and settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Export Configuration */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            📦 Export Configuration
          </h3>
          <p className="text-sm text-text-tertiary mb-4">
            Download your settings, blocklist, and theme preferences
          </p>
          <button
            onClick={handleExportConfig}
            disabled={isExporting}
            className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export Config (JSON)'}
          </button>
        </div>

        {/* Import Configuration */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            📥 Import Configuration
          </h3>
          <p className="text-sm text-text-tertiary mb-4">
            Restore settings from a previously exported file
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={handleImportConfig}
            disabled={isImporting}
            className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing...' : 'Choose File...'}
          </button>
        </div>

        {/* Export History */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            📊 Export History
          </h3>
          <p className="text-sm text-text-tertiary mb-4">
            Download your focus session history as CSV
          </p>
          <button
            onClick={handleExportHistory}
            className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Export History (CSV)
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-error-50 border-2 border-error p-6 rounded-xl">
          <h3 className="text-lg font-bold text-error mb-2">⚠️ Danger Zone</h3>
          <p className="text-sm text-text-primary mb-4">
            Permanently delete all data. This action cannot be undone.
          </p>
          <button
            onClick={handleResetData}
            className="bg-error hover:bg-error/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
