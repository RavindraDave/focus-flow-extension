/**
 * Popup App - Main entry point for popup UI
 * Displays timer, controls, and quick stats
 * Supports all three visual themes: Modern Pro, Zen Mode, Cyber Focus
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect } from 'react';
import { PopupLayout } from '../components/templates/PopupLayout';
import { TimerDisplay, TimerControls, QuickStats, NuclearModeModal, NuclearModeStatus } from './components';
import { useTimer, useAnalytics, useNuclearMode } from '../hooks';
import { useThemeContext } from '../contexts/ThemeContext';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import type { UserSettings } from '../types';

/**
 * Main Popup App component
 * Complexity: 7 (multiple hooks + conditional rendering + nuclear mode)
 */
const App: React.FC = () => {
  // Get theme context (theme is initialized by ThemeProvider)
  const { setTheme } = useThemeContext();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [suggestedTheme, setSuggestedTheme] = useState<'modern' | 'zen' | 'cyber'>('modern');

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Modal state
  const [isNuclearModalOpen, setIsNuclearModalOpen] = useState(false);

  // Check for first run and detect OS theme preference
  useEffect(() => {
    async function checkFirstRun(): Promise<void> {
      const result = await chrome.storage.sync.get(['has_onboarded']);

      if (!result.has_onboarded) {
        // Detect OS theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const suggested = prefersDark ? 'cyber' : 'modern';

        setSuggestedTheme(suggested);
        setShowOnboarding(true);
      }
    }

    void checkFirstRun();
  }, []);

  // Load user settings
  useEffect(() => {
    async function loadSettings(): Promise<void> {
      try {
        const response = (await chrome.runtime.sendMessage({
          type: 'SETTINGS_GET',
        })) as unknown as { success: boolean; data: UserSettings };

        if (response.success) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    void loadSettings();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async (selectedTheme: 'modern' | 'zen' | 'cyber') => {
    // Save onboarding completion flag
    await chrome.storage.sync.set({ has_onboarded: true });

    // Apply selected theme
    await setTheme(selectedTheme);

    // Close onboarding modal
    setShowOnboarding(false);
  };

  // Timer state and controls
  const {
    isActive,
    isPaused,
    sessionType,
    remainingSeconds,
    totalSeconds,
    start,
    pause,
    resume,
    stop,
    isLoading: timerLoading,
    error: timerError,
  } = useTimer();

  // Analytics and stats
  const {
    todayStats,
    streak,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();

  // Nuclear Mode state and controls
  const {
    isActive: isNuclearActive,
    remainingSeconds: nuclearRemainingSeconds,
    activate: activateNuclear,
    error: nuclearError,
  } = useNuclearMode();

  return (
    <PopupLayout>
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center text-white text-xs font-bold">F</div>
          <span className="font-semibold tracking-tight text-text-primary">Focus Flow</span>
        </div>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-text-tertiary hover:text-text-primary transition"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="space-y-8">
        {/* Nuclear Mode Status */}
        <NuclearModeStatus isActive={isNuclearActive} remainingSeconds={nuclearRemainingSeconds} />

        {/* Nuclear Mode Error */}
        {nuclearError && (
          <div
            role="alert"
            className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm"
          >
            {nuclearError}
          </div>
        )}

        {/* Timer Display */}
        <section aria-labelledby="timer-heading">
          <h2 id="timer-heading" className="sr-only">
            Pomodoro Timer
          </h2>
          <TimerDisplay
            remainingSeconds={remainingSeconds}
            totalSeconds={totalSeconds}
            sessionType={sessionType}
            isActive={isActive}
            isPaused={isPaused}
          />
        </section>

        {/* Timer Controls */}
        <section aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="sr-only">
            Timer Controls
          </h2>
          {timerError && (
            <div
              role="alert"
              className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm mb-4"
            >
              {timerError}
            </div>
          )}
          <TimerControls
            isActive={isActive}
            isPaused={isPaused}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onStop={stop}
            disabled={timerLoading}
            settings={settings}
          />
        </section>

        {/* Quick Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Today's Statistics
          </h2>
          {analyticsError && (
            <div
              role="alert"
              className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-md text-sm mb-4"
            >
              {analyticsError}
            </div>
          )}
          <QuickStats
            focusTime={todayStats?.focusTime || 0}
            pomodorosCompleted={todayStats?.pomodorosCompleted || 0}
            streakDays={streak?.current || 0}
            longestStreak={streak?.longest || 0}
            isLoading={analyticsLoading}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-xs text-text-tertiary">System Ready</span>
          </div>

          <button
            onClick={() => setIsNuclearModalOpen(true)}
            className="text-xs text-error hover:text-error/80 flex items-center gap-1 transition font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Nuclear Mode
          </button>
        </div>
      </footer>

      {/* Nuclear Mode Modal */}
      <NuclearModeModal
        isOpen={isNuclearModalOpen}
        onClose={() => setIsNuclearModalOpen(false)}
        onActivate={activateNuclear}
        isPremium={!!settings?.premiumLicenseKey}
      />

      {/* Onboarding Modal (First Run) */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          suggestedTheme={suggestedTheme}
        />
      )}
    </PopupLayout>
  );
};

export default App;
