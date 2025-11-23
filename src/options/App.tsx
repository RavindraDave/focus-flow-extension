/**
 * Options App - Settings and Analytics page
 * Desktop-optimized with sidebar navigation
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { SettingsForm, AnalyticsDashboard, BlockRuleList, ScheduleList, SuggestedSites } from './components';
import { YouTubeSettings } from './components/YouTubeSettings';
import { useSettings } from '../hooks';
import { Spinner } from '../components/atoms/Spinner';

type Tab = 'settings' | 'analytics' | 'blocking' | 'schedules' | 'youtube';

/**
 * Main Options App component
 * Redesigned for desktop with sidebar navigation
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const { settings, isLoading, error, updateSettings } = useSettings();

  /**
   * Sidebar navigation item
   */
  const NavItem: React.FC<{ tab: Tab; label: string; icon: string; description: string }> = ({
    tab,
    label,
    icon,
    description,
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`
        w-full text-left px-4 py-3 rounded-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${
          activeTab === tab
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-neutral-700 hover:bg-neutral-100 hover:shadow-sm'
        }
      `}
      aria-selected={activeTab === tab}
      role="tab"
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="font-semibold">{label}</div>
          <div className={`text-xs mt-0.5 ${activeTab === tab ? 'text-primary-100' : 'text-neutral-500'}`}>
            {description}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center">
            <span className="text-3xl mr-3">🎯</span>
            Focus Flow
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
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
            tab="settings"
            label="Timer Settings"
            icon="⚙️"
            description="Pomodoro durations & preferences"
          />
          <NavItem
            tab="analytics"
            label="Analytics"
            icon="📊"
            description="Track your productivity & progress"
          />
          <NavItem
            tab="blocking"
            label="Website Blocking"
            icon="🚫"
            description="Manage blocked sites & rules"
          />
          <NavItem
            tab="schedules"
            label="Schedules"
            icon="📅"
            description="Automated time-based blocking"
          />
          <NavItem
            tab="youtube"
            label="YouTube Controls"
            icon="▶️"
            description="Shorts & recommendations settings"
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => window.close()}
            className="w-full px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            ← Close Settings
          </button>
          <p className="text-xs text-neutral-400 text-center mt-3">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">Pomodoro Timer Settings</h2>
                <p className="text-neutral-600 mt-2">
                  Customize your work sessions, breaks, and productivity preferences
                </p>
              </div>

              {isLoading && (
                <div className="bg-white border border-neutral-200 rounded-lg p-12 flex items-center justify-center">
                  <Spinner size="lg" color="primary" />
                  <span className="ml-3 text-neutral-600">
                    Loading settings...
                  </span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="bg-error-50 border border-error-200 text-error-700 px-6 py-4 rounded-lg mb-6"
                >
                  <strong className="font-semibold">Error: </strong>
                  {error}
                </div>
              )}

              {settings && !isLoading && (
                <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
                  <SettingsForm settings={settings} onSave={updateSettings} />
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">Productivity Analytics</h2>
                <p className="text-neutral-600 mt-2">
                  Track your focus time, streaks, and productivity patterns
                </p>
              </div>
              <AnalyticsDashboard />
            </div>
          )}

          {/* Block List Tab */}
          {activeTab === 'blocking' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">Website Blocking</h2>
                <p className="text-neutral-600 mt-2">
                  Add sites to block during work sessions • Quick add from 100+ suggestions
                </p>
              </div>
              <SuggestedSites />
              <BlockRuleList />
            </div>
          )}

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">Scheduled Blocking</h2>
                <p className="text-neutral-600 mt-2">
                  Create time-based rules to automatically block sites at specific times
                </p>
              </div>
              <ScheduleList />
            </div>
          )}

          {/* YouTube Tab */}
          {activeTab === 'youtube' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-neutral-900">YouTube Controls</h2>
                <p className="text-neutral-600 mt-2">
                  Customize which YouTube features to hide or block
                </p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
                <YouTubeSettings isPremium={settings?.premiumLicenseKey !== undefined} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
