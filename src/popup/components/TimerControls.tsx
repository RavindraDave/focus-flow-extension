/**
 * TimerControls - Buttons to start/pause/resume/stop timer
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import type { SessionType, UserSettings } from '../../types';

export interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: (sessionType: SessionType, taskName?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
  settings?: UserSettings | null;
}

/**
 * TimerControls component
 * Complexity: 8 (multiple conditional rendering paths)
 */
// eslint-disable-next-line max-lines-per-function
export const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
  settings,
}) => {
  const [taskName, setTaskName] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  // Get durations from settings or use defaults
  const workDuration = settings?.workDuration ?? 25;
  const shortBreakDuration = settings?.shortBreakDuration ?? 5;
  const longBreakDuration = settings?.longBreakDuration ?? 15;

  /**
   * Handle start button click
   * Complexity: 2 (validation + callback)
   */
  const handleStart = (sessionType: SessionType): void => {
    const trimmedTask = taskName.trim();
    onStart(sessionType, trimmedTask || undefined);
    setTaskName('');
    setShowTaskInput(false);
  };

  // Active timer - show pause and stop
  if (isActive && !isPaused) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex space-x-3">
          <Button variant="secondary" size="md" onClick={onPause} disabled={disabled} className="flex-1">
            Pause
          </Button>
          <Button variant="destructive" size="md" onClick={onStop} disabled={disabled} className="flex-1">
            Stop
          </Button>
        </div>
      </div>
    );
  }

  // Paused timer - show resume and stop
  if (isPaused) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex space-x-3">
          <Button variant="primary" size="md" onClick={onResume} disabled={disabled} className="flex-1">
            Resume
          </Button>
          <Button variant="destructive" size="md" onClick={onStop} disabled={disabled} className="flex-1">
            Stop
          </Button>
        </div>
      </div>
    );
  }

  // Idle - show start options
  return (
    <div className="flex flex-col space-y-3">
      {/* Task name input (optional) */}
      {showTaskInput && (
        <div className="flex flex-col space-y-2">
          <label htmlFor="task-name" className="text-sm font-medium text-text-primary">
            What are you working on? (optional)
          </label>
          <input
            id="task-name"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g., Write documentation"
            maxLength={100}
            className="px-3 py-2 border border-border rounded-md text-sm bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={disabled}
          />
        </div>
      )}

      {/* Start buttons */}
      <div className="flex flex-col space-y-2">
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleStart('work')}
          disabled={disabled}
          className="w-full"
          aria-label={`Start ${workDuration}-minute focus session`}
        >
          Start Focus ({workDuration}min)
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStart('short-break')}
            disabled={disabled}
            className="flex-1"
            aria-label={`Start ${shortBreakDuration}-minute short break`}
          >
            Short Break ({shortBreakDuration}min)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStart('long-break')}
            disabled={disabled}
            className="flex-1"
            aria-label={`Start ${longBreakDuration}-minute long break`}
          >
            Long Break ({longBreakDuration}min)
          </Button>
        </div>

        {/* Toggle task input */}
        <button
          type="button"
          onClick={() => setShowTaskInput(!showTaskInput)}
          className="text-xs text-text-tertiary hover:text-text-primary underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
          disabled={disabled}
        >
          {showTaskInput ? 'Hide task name' : 'Add task name'}
        </button>
      </div>
    </div>
  );
};
