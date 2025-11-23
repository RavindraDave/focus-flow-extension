/**
 * Popup App - Main entry point for popup UI
 * Displays timer, controls, and quick stats
 * Supports all three visual themes: Modern Pro, Zen Mode, Cyber Focus
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { PopupLayout } from '../components/templates/PopupLayout';
import { TimerDisplay, TimerControls, QuickStats, NuclearModeModal, NuclearModeStatus } from './components';
import { useTimer, useAnalytics, useNuclearMode, useTheme } from '../hooks';
import { Button } from '../components/atoms/Button';

/**
 * Main Popup App component
 * Complexity: 7 (multiple hooks + conditional rendering + nuclear mode)
 */
const App: React.FC = () => {
  // Initialize theme (will apply to document automatically)
  useTheme();

  // Modal state
  const [isNuclearModalOpen, setIsNuclearModalOpen] = useState(false);

  // Timer state and controls
  const {
    isActive,
    isPaused,
    sessionType,
    remainingSeconds,
    totalSeconds,
    taskName,
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
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary font-serif">Focus Flow</h1>
        {taskName && (
          <p className="text-sm text-text-secondary mt-1 truncate px-4" title={taskName}>
            {taskName}
          </p>
        )}
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
      <footer className="mt-8 space-y-3">
        {/* Nuclear Mode Activation Button */}
        {!isNuclearActive && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsNuclearModalOpen(true)}
            className="w-full"
          >
            🚀 Activate Nuclear Mode
          </Button>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-xs text-text-tertiary hover:text-text-primary underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1 transition"
          >
            ⚙️ Settings & Analytics
          </button>
        </div>
      </footer>

      {/* Nuclear Mode Modal */}
      <NuclearModeModal
        isOpen={isNuclearModalOpen}
        onClose={() => setIsNuclearModalOpen(false)}
        onActivate={activateNuclear}
      />
    </PopupLayout>
  );
};

export default App;
