/**
 * TimerControls - Buttons to start/pause/resume/stop timer
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import type { SessionType } from '../../types';

export interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: (sessionType: SessionType, taskName?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * TimerControls component
 * Complexity: 8 (multiple conditional rendering paths)
 */
export const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}) => {
  const [taskName, setTaskName] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

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
          <label htmlFor="task-name" className="text-sm font-medium text-neutral-700">
            What are you working on? (optional)
          </label>
          <input
            id="task-name"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="e.g., Write documentation"
            maxLength={100}
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          aria-label="Start 25-minute focus session"
        >
          Start Focus (25min)
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStart('short-break')}
            disabled={disabled}
            className="flex-1"
            aria-label="Start 5-minute short break"
          >
            Short Break (5min)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleStart('long-break')}
            disabled={disabled}
            className="flex-1"
            aria-label="Start 15-minute long break"
          >
            Long Break (15min)
          </Button>
        </div>

        {/* Toggle task input */}
        <button
          type="button"
          onClick={() => setShowTaskInput(!showTaskInput)}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
          disabled={disabled}
        >
          {showTaskInput ? 'Hide task name' : 'Add task name'}
        </button>
      </div>
    </div>
  );
};
