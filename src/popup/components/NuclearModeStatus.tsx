/**
 * NuclearModeStatus - Display active Nuclear Mode status
 * Shows countdown and prevents deactivation
 * Implements PRD Section 1.3 (FR-NO-003)
 * WCAG 2.1 AA compliant
 */

import React from 'react';

export interface NuclearModeStatusProps {
  /**
   * Whether Nuclear Mode is active
   */
  isActive: boolean;

  /**
   * Remaining time in seconds
   */
  remainingSeconds: number;
}

/**
 * Format seconds into hours and minutes
 * Complexity: 3 (calculation + formatting)
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * NuclearModeStatus Component
 * Complexity: 3 (conditional rendering + formatting)
 */
export const NuclearModeStatus: React.FC<NuclearModeStatusProps> = ({
  isActive,
  remainingSeconds,
}) => {
  if (!isActive) {return null;}

  return (
    <div
      className="bg-gradient-to-r from-error-500 to-warning-500 text-white rounded-lg p-4 mb-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl" aria-hidden="true">
            🚀
          </div>
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">
              Nuclear Mode Active
            </h3>
            <p className="text-xs text-white opacity-90 mt-0.5">
              Unbreakable focus mode — Cannot be disabled
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white tabular-nums">
            {formatTime(remainingSeconds)}
          </div>
          <p className="text-xs text-white opacity-90">
            remaining
          </p>
        </div>
      </div>

      <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-1000"
          style={{
            width: `${Math.max(0, Math.min(100, (remainingSeconds / (8 * 3600)) * 100))}%`,
          }}
          role="progressbar"
          aria-valuenow={remainingSeconds}
          aria-valuemin={0}
          aria-valuemax={8 * 3600}
          aria-label={`Nuclear Mode progress: ${formatTime(remainingSeconds)} remaining`}
        />
      </div>
    </div>
  );
};
