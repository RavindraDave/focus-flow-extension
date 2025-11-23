/**
 * Options App - Comprehensive Settings and Analytics page
 * Redesigned with 6-tab sidebar navigation per FEATURE_REQUIREMENTS.md
 * Supports all three visual themes: Modern Pro, Zen Mode, Cyber Focus
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import {
  SettingsForm,
  AnalyticsDashboard,
  BlockRuleList,
  ScheduleList,
  SuggestedSites,
} from './components';
import { Spinner } from '../components/atoms/Spinner';

type Tab = 'dashboard' | 'timer' | 'blocking' | 'integrations' | 'gamification' | 'data';

/**
 * Main Options App component with 6-tab navigation
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { theme, setTheme } = useTheme();
  const { settings, isLoading: settingsLoading, error, updateSettings } = useSettings();

  /**
   * Sidebar navigation item
   */
  const NavItem: React.FC<{
    tab: Tab;
    icon: string;
    label: string;
    description: string;
  }> = ({ tab, icon, label, description }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${
          activeTab === tab
            ? 'bg-accent text-text-inverse shadow-md'
            : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
        }
      `}
      aria-selected={activeTab === tab}
      role="tab"
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="font-semibold text-sm">{label}</div>
          <div
            className={`text-xs mt-0.5 ${
              activeTab === tab ? 'opacity-90' : 'opacity-60'
            }`}
          >
            {description}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-80 bg-surface border-r border-border flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-text-primary flex items-center font-serif">
            <span className="text-3xl mr-3">🎯</span>
            Focus Flow
          </h1>
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
            icon="📊"
            label="Dashboard"
            description="Overview & quick actions"
          />
          <NavItem
            tab="timer"
            icon="⏱️"
            label="Timer Settings"
            description="Pomodoro durations & sounds"
          />
          <NavItem
            tab="blocking"
            icon="🚫"
            label="Blocking Rules"
            description="Manage blocked sites & schedules"
          />
          <NavItem
            tab="integrations"
            icon="🔗"
            label="Integrations"
            description="Connect external apps & services"
          />
          <NavItem
            tab="gamification"
            icon="🎮"
            label="Gamification"
            description="Track progress & achievements"
          />
          <NavItem
            tab="data"
            icon="💾"
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
          <p className="text-xs text-text-muted text-center mt-3">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="max-w-6xl mx-auto p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardTab settings={settings} />
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
const DashboardTab: React.FC<{ settings: any }> = () => {
  const [nuclearMode, setNuclearMode] = useState(false);
  const [strictBlocking, setStrictBlocking] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary font-serif mb-2">
          Dashboard
        </h2>
        <p className="text-text-secondary">
          At-a-glance overview of your productivity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Focus Score */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-text-tertiary">Focus Score</p>
              <h3 className="text-4xl font-bold text-text-primary mt-2">85%</h3>
            </div>
            <span className="bg-success/20 text-success text-xs font-medium px-2.5 py-0.5 rounded-full">
              Top 10%
            </span>
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-accent w-[85%] rounded-full"></div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <p className="text-sm font-medium text-text-tertiary">Today's Focus</p>
          <h3 className="text-4xl font-bold text-text-primary mt-2">4h 12m</h3>
          <p className="text-xs text-success mt-2">+18% vs. yesterday</p>
        </div>

        {/* Distractions Blocked */}
        <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
          <p className="text-sm font-medium text-text-tertiary">Distractions Blocked</p>
          <h3 className="text-4xl font-bold text-text-primary mt-2">142</h3>
          <p className="text-xs text-text-muted mt-2">This week</p>
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="bg-surface p-6 rounded-xl shadow-md border border-border mb-8">
        <h3 className="text-lg font-bold text-text-primary mb-4">Quick Toggles</h3>
        <div className="space-y-4">
          {/* Nuclear Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-text-primary">Nuclear Mode</h4>
              <p className="text-sm text-text-tertiary">
                Instantly blocks ALL sites except whitelist
              </p>
            </div>
            <button
              onClick={() => setNuclearMode(!nuclearMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                nuclearMode ? 'bg-accent' : 'bg-bg-secondary'
              }`}
              aria-pressed={nuclearMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  nuclearMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Strict Blocking Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-text-primary">Strict Blocking</h4>
              <p className="text-sm text-text-tertiary">
                Prevents "Emergency Access" on blocked pages
              </p>
            </div>
            <button
              onClick={() => setStrictBlocking(!strictBlocking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                strictBlocking ? 'bg-accent' : 'bg-bg-secondary'
              }`}
              aria-pressed={strictBlocking}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  strictBlocking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === 'modern'
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
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === 'zen'
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
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === 'cyber'
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
        {theme === 'modern' && (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              📈 Streak Heatmap
            </h3>
            <p className="text-sm text-text-tertiary mb-4">
              GitHub-style contribution graph showing your consistency
            </p>
            <div className="text-center py-12 text-text-muted">
              Heatmap visualization coming soon...
            </div>
          </div>
        )}

        {theme === 'zen' && (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              🌱 The Garden
            </h3>
            <p className="text-sm text-text-tertiary mb-4">
              Every 25m session plants a tree. Breaking early withers it.
            </p>
            <div className="text-center py-12 text-text-muted">
              Garden visualization coming soon...
            </div>
          </div>
        )}

        {theme === 'cyber' && (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              💻 The Mainframe
            </h3>
            <p className="text-sm text-text-tertiary mb-4">
              XP decrypts data nodes. Rank: Script Kiddie → 10x Engineer
            </p>
            <div className="text-center py-12 text-text-muted">
              Mainframe visualization coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Data & Config Tab Component
 */
const DataConfigTab: React.FC = () => {
  const handleExportConfig = () => {
    // TODO: Implement config export
    alert('Exporting configuration...');
  };

  const handleImportConfig = () => {
    // TODO: Implement config import
    alert('Import configuration...');
  };

  const handleExportHistory = () => {
    // TODO: Implement history export
    alert('Exporting history...');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      // TODO: Implement data reset
      alert('Resetting data...');
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
            className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Export Config (JSON)
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
          <button
            onClick={handleImportConfig}
            className="bg-accent hover:bg-accent-hover text-text-inverse px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Choose File...
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
