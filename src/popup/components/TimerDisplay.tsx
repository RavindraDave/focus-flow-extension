/**
 * TimerDisplay - Shows countdown timer with circular progress ring
 * WCAG 2.1 AA compliant, accessible with ARIA labels
 */

import React from 'react';
import type { SessionType } from '../../types';

export interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  sessionType: SessionType | null;
  isActive: boolean;
  isPaused: boolean;
}

/**
 * Format seconds into MM:SS
 * Complexity: 2 (calculation + padding)
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get color based on session type
 * Complexity: 2 (switch statement)
 */
function getSessionColor(sessionType: SessionType | null): string {
  switch (sessionType) {
    case 'work':
      return 'text-accent'; // Focus red
    case 'short-break':
    case 'long-break':
      return 'text-success'; // Break green
    default:
      return 'text-text-muted'; // Neutral gray
  }
}

/**
 * Get session type label
 * Complexity: 2 (switch statement)
 */
function getSessionLabel(sessionType: SessionType | null): string {
  switch (sessionType) {
    case 'work':
      return 'Focus Session';
    case 'short-break':
      return 'Short Break';
    case 'long-break':
      return 'Long Break';
    default:
      return 'Ready to Focus';
  }
}

/**
 * TimerDisplay component with circular progress ring
 * Complexity: 5 (multiple conditionals for display states)
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingSeconds,
  totalSeconds,
  sessionType,
  isActive,
  isPaused,
}) => {
  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const color = getSessionColor(sessionType);
  const label = getSessionLabel(sessionType);

  // SVG circle parameters for progress ring
  // Reduced radius from 90 to 85 to create more space between text and circle
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Session Type Label */}
      <div className="text-center">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </p>
        {isPaused && (
          <p className="text-xs font-medium text-warning mt-1" role="status">
            Paused
          </p>
        )}
      </div>

      {/* Progress Ring */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width="200"
          height="200"
          role="img"
          aria-label={`Timer progress: ${Math.round(progress)}% remaining`}
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-border-light"
          />

          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={sessionType === 'work' ? 'text-accent' : 'text-success'}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>

        {/* Timer Display - Added padding and reduced text size slightly */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <time
            className={`text-5xl font-bold ${color} tabular-nums`}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatTime(remainingSeconds)}
          </time>

          {isActive && !isPaused && remainingSeconds <= 60 && (
            <p className="text-xs font-medium text-warning mt-2" role="status">
              Last minute!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
