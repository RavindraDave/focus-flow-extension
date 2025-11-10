/**
 * Options App - Settings and Analytics page
 * Tabbed interface with settings, analytics, and block list
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { SettingsForm, AnalyticsDashboard, BlockRuleList, ScheduleList } from './components';
import { YouTubeSettings } from './components/YouTubeSettings';
import { useSettings } from '../hooks';
import { Spinner } from '../components/atoms/Spinner';

type Tab = 'settings' | 'analytics' | 'blocking' | 'schedules' | 'youtube';

/**
 * Main Options App component
 * Complexity: 5 (multiple tabs + state management)
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const { settings, isLoading, error, updateSettings } = useSettings();

  /**
   * Tab button component
   * Complexity: 2 (conditional styling)
   */
  const TabButton: React.FC<{ tab: Tab; label: string; icon: string }> = ({
    tab,
    label,
    icon,
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`
        flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${
          activeTab === tab
            ? 'bg-primary-500 text-white'
            : 'text-neutral-700 hover:bg-neutral-100'
        }
      `}
      aria-selected={activeTab === tab}
      role="tab"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Focus Flow</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Settings & Analytics
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.close()}
              className="text-sm text-neutral-500 hover:text-neutral-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <nav
          className="flex space-x-2 mb-8"
          role="tablist"
          aria-label="Settings navigation"
        >
          <TabButton tab="settings" label="Settings" icon="⚙️" />
          <TabButton tab="analytics" label="Analytics" icon="📊" />
          <TabButton tab="blocking" label="Block List" icon="🚫" />
          <TabButton tab="schedules" label="Schedules" icon="📅" />
          <TabButton tab="youtube" label="YouTube" icon="▶️" />
        </nav>

        {/* Tab Panels */}
        <div role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Pomodoro Timer Settings
              </h2>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" color="primary" />
                  <span className="ml-3 text-neutral-600">
                    Loading settings...
                  </span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mb-6"
                >
                  {error}
                </div>
              )}

              {settings && !isLoading && (
                <SettingsForm settings={settings} onSave={updateSettings} />
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Productivity Analytics
              </h2>
              <AnalyticsDashboard />
            </div>
          )}

          {/* Block List Tab */}
          {activeTab === 'blocking' && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Website Blocking
              </h2>
              <BlockRuleList />
            </div>
          )}

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Scheduled Blocking
              </h2>
              <ScheduleList />
            </div>
          )}

          {/* YouTube Tab */}
          {activeTab === 'youtube' && (
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <YouTubeSettings isPremium={settings?.premiumLicenseKey !== undefined} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs text-neutral-500 text-center">
            Focus Flow Extension v1.0.0 • Built with React & TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
