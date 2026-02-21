/**
 * QuickStats - Display today's focus time, Pomodoros, and streak
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { Badge } from '../../components/atoms/Badge';

export interface QuickStatsProps {
  focusTime: number; // minutes
  pomodorosCompleted: number;
  streakDays: number;
  longestStreak: number;
  isLoading?: boolean;
}

/**
 * Format minutes into hours and minutes
 * Complexity: 3 (calculation + conditional formatting)
 */
function formatFocusTime(minutes: number): string {
  if (minutes === 0) {return '0min';}
  if (minutes < 60) {return `${minutes}min`;}

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {return `${hours}h`;}
  return `${hours}h ${mins}min`;
}

/**
 * QuickStats component
 * Complexity: 3 (conditional rendering + multiple display elements)
 */
// eslint-disable-next-line max-lines-per-function, complexity
export const QuickStats: React.FC<QuickStatsProps> = ({
  focusTime,
  pomodorosCompleted,
  streakDays,
  longestStreak,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-neutral-200 rounded-lg"></div>
        <div className="h-16 bg-neutral-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Today's Stats */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Today
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Focus Time */}
          <div>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">
              {formatFocusTime(focusTime)}
            </p>
            <p className="text-xs text-neutral-600 mt-1">Focus Time</p>
          </div>

          {/* Pomodoros */}
          <div>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">
              {pomodorosCompleted}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              Pomodoro{pomodorosCompleted !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="bg-gradient-to-r from-primary-50 to-success-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-700 uppercase tracking-wide mb-1">
              Current Streak
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-primary-600 tabular-nums">
                {streakDays}
              </p>
              <p className="text-sm text-neutral-600">
                day{streakDays !== 1 ? 's' : ''}
              </p>
            </div>
            {longestStreak > streakDays && (
              <p className="text-xs text-neutral-500 mt-1">
                Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Streak badges */}
          <div className="flex flex-col space-y-1">
            {streakDays >= 7 && (
              <Badge variant="success" size="sm">
                🔥 On fire!
              </Badge>
            )}
            {streakDays === longestStreak && streakDays > 0 && (
              <Badge variant="info" size="sm">
                🏆 Personal best
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Motivational message */}
      {pomodorosCompleted === 0 && streakDays > 0 && (
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Complete 1 Pomodoro today to maintain your {streakDays}-day streak!
          </p>
        </div>
      )}
    </div>
  );
};
