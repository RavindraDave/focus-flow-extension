/**
 * ScheduleList Component
 * Displays and manages all user schedules
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { ScheduleForm } from './ScheduleForm';
import { useSchedules, useBlockRules } from '../../hooks';
import { Spinner } from '../../components/atoms/Spinner';
import type { Schedule } from '../../types';

/**
 * Format days of week for display
 * Complexity: 3 (array operations + conditional)
 */
function formatDays(days: string[]): string {
  const dayNames: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  if (days.length === 7) {
    return 'Every day';
  }

  if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
    return 'Weekdays';
  }

  if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
    return 'Weekends';
  }

  return days.map(d => dayNames[d] || d).join(', ');
}

/**
 * Format time in 12-hour format
 * Complexity: 3 (parsing + formatting)
 */
function formatTime(time24: string): string {
  const parts = time24.split(':').map(Number);
  const hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * ScheduleList Component
 * Complexity: 8 (state management + conditional rendering + event handlers)
 */
export const ScheduleList: React.FC = () => {
  const { schedules, isLoading, error, deleteSchedule, toggleSchedule } = useSchedules();
  const { rules: blockRules } = useBlockRules();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  /**
   * Handle edit button click
   * Complexity: 2 (state updates)
   */
  const handleEdit = (schedule: Schedule): void => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  /**
   * Handle delete button click
   * Complexity: 4 (confirmation + async operation + error handling)
   */
  const handleDelete = async (schedule: Schedule): Promise<void> => {
    if (!confirm(`Delete schedule "${schedule.name}"?`)) {
      return;
    }

    try {
      await deleteSchedule(schedule.id);
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  /**
   * Handle toggle enabled state
   * Complexity: 3 (async operation + error handling)
   */
  const handleToggle = async (schedule: Schedule): Promise<void> => {
    try {
      await toggleSchedule(schedule.id);
    } catch (err) {
      alert('Failed to toggle schedule');
    }
  };

  /**
   * Handle form close
   * Complexity: 2 (state resets)
   */
  const handleFormClose = (): void => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  /**
   * Get block rule names for a schedule
   * Complexity: 3 (filter + map)
   */
  const getBlockRuleNames = (ruleIds: string[]): string => {
    const names = ruleIds
      .map(id => blockRules.find(r => r.id === id)?.name)
      .filter((name): name is string => name !== undefined);

    if (names.length === 0) {
      return 'None';
    }

    if (names.length > 2) {
      return `${names.slice(0, 2).join(', ')}, +${names.length - 2} more`;
    }

    return names.join(', ');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
        <span className="ml-3 text-neutral-600">Loading schedules...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        role="alert"
        className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Your Schedules ({schedules.length})
          </h3>
          <p className="text-sm text-neutral-600 mt-1">
            Automatically activate blocking rules at specific times
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsFormOpen(true)}
          aria-label="Add new schedule"
        >
          + Add Schedule
        </Button>
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No schedules yet
          </h3>
          <p className="text-neutral-600 mb-4">
            Create a schedule to automatically activate blocking rules at specific times
          </p>
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Create Your First Schedule
          </Button>
        </div>
      )}

      {/* Schedule List */}
      {schedules.length > 0 && (
        <div className="space-y-4">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Schedule Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggle(schedule)}
                      className={`
                        px-2 py-1 text-xs font-medium rounded
                        transition-colors cursor-pointer
                        ${
                          schedule.enabled
                            ? 'bg-success-100 text-success-700 hover:bg-success-200'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }
                      `}
                      aria-label={`Toggle schedule ${schedule.enabled ? 'off' : 'on'}`}
                    >
                      {schedule.enabled ? '✓ Active' : '○ Inactive'}
                    </button>

                    {/* Name */}
                    <h4 className="text-base font-medium text-neutral-900">
                      {schedule.name}
                    </h4>
                  </div>

                  {/* Time and Days */}
                  <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                    <span className="flex items-center space-x-1">
                      <span className="text-lg">🕐</span>
                      <span>
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-lg">📆</span>
                      <span>{formatDays(schedule.daysOfWeek)}</span>
                    </span>
                  </div>

                  {/* Block Rules */}
                  <div className="text-sm text-neutral-600">
                    <span className="font-medium">Blocks:</span>{' '}
                    {getBlockRuleNames(schedule.blockRuleIds)}
                  </div>

                  {/* Exceptions */}
                  {schedule.exceptions.length > 0 && (
                    <div className="mt-2 text-xs text-neutral-500">
                      {schedule.exceptions.length} exception date(s)
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                    aria-label={`Edit schedule ${schedule.name}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(schedule)}
                    className="text-error-600 hover:bg-error-50"
                    aria-label={`Delete schedule ${schedule.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <ScheduleForm
          {...(editingSchedule ? { schedule: editingSchedule } : {})}
          onClose={handleFormClose}
          isOpen={isFormOpen}
        />
      )}

      {/* Info Box */}
      <div className="border border-info-200 bg-info-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-xl">💡</span>
          <div className="text-sm text-info-900">
            <p className="font-medium mb-1">How schedules work</p>
            <p className="text-info-800">
              Schedules automatically enable/disable your block rules at the specified times.
              Multiple schedules can be active simultaneously. Click the status badge to
              quickly enable or disable a schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
