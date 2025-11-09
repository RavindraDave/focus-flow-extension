/**
 * Popup App - Main entry point for popup UI
 * Displays timer, controls, and quick stats
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { PopupLayout } from '../components/templates/PopupLayout';
import { TimerDisplay, TimerControls, QuickStats } from './components';
import { useTimer, useAnalytics } from '../hooks';

/**
 * Main Popup App component
 * Complexity: 5 (multiple hooks + conditional rendering)
 */
const App: React.FC = () => {
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

  return (
    <PopupLayout>
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Focus Flow</h1>
        {taskName && (
          <p className="text-sm text-neutral-600 mt-1 truncate px-4" title={taskName}>
            {taskName}
          </p>
        )}
      </header>

      {/* Main Content */}
      <main className="space-y-8">
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
      <footer className="mt-8 text-center">
        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
        >
          Settings & Analytics
        </button>
      </footer>
    </PopupLayout>
  );
};

export default App;
