/**
 * ScheduleForm Component
 * Modal form for creating/editing schedules
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import { useSchedules, useBlockRules } from '../../hooks';
import type { Schedule, DayOfWeek } from '../../types';

export interface ScheduleFormProps {
  schedule?: Schedule;
  onClose: () => void;
  isOpen: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/**
 * ScheduleForm Component
 * Complexity: 10 (at limit - form validation + state management + async operations)
 */
// eslint-disable-next-line max-lines-per-function, complexity
export const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule, onClose, isOpen }) => {
  const { addSchedule, updateSchedule } = useSchedules();
  const { rules: blockRules } = useBlockRules();

  // Form state
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [blockRuleIds, setBlockRuleIds] = useState<string[]>([]);
  const [autoStartTimer, setAutoStartTimer] = useState(false);
  const [exceptions, setExceptions] = useState<Date[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Load schedule data for editing
   * Complexity: 2 (conditional + state updates)
   */
  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setDaysOfWeek(schedule.daysOfWeek);
      setBlockRuleIds(schedule.blockRuleIds);
      setAutoStartTimer(schedule.autoStartTimer ?? false);
      setExceptions(schedule.exceptions);
    }
  }, [schedule]);

  /**
   * Validate form data
   * Complexity: 6 (multiple validations)
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      errors.name = 'Schedule name is required';
    } else if (name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    // Days validation
    if (daysOfWeek.length === 0) {
      errors.daysOfWeek = 'Select at least one day';
    }

    // Block rules validation
    if (blockRuleIds.length === 0) {
      errors.blockRuleIds = 'Select at least one block rule';
    }

    // Time validation
    if (startTime === endTime) {
      errors.time = 'Start and end times cannot be the same';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Complexity: 5 (validation + async + error handling)
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);

      const scheduleData = {
        name: name.trim(),
        enabled: schedule?.enabled ?? true,
        daysOfWeek,
        startTime,
        endTime,
        blockRuleIds,
        autoStartTimer,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        exceptions,
      };

      if (schedule) {
        await updateSchedule(schedule.id, scheduleData);
      } else {
        await addSchedule(scheduleData);
      }

      onClose();
    } catch (err) {
      setValidationErrors({
        submit: err instanceof Error ? err.message : 'Failed to save schedule',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle day checkbox change
   * Complexity: 3 (toggle logic)
   */
  const handleDayToggle = (day: DayOfWeek): void => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  /**
   * Handle quick day selection
   * Complexity: 2 (preset logic)
   */
  const setQuickDays = (preset: 'weekdays' | 'weekends' | 'all'): void => {
    if (preset === 'weekdays') {
      setDaysOfWeek(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    } else if (preset === 'weekends') {
      setDaysOfWeek(['saturday', 'sunday']);
    } else {
      setDaysOfWeek(DAYS_OF_WEEK);
    }
  };

  /**
   * Handle block rule checkbox change
   * Complexity: 3 (toggle logic)
   */
  const handleBlockRuleToggle = (ruleId: string): void => {
    if (blockRuleIds.includes(ruleId)) {
      setBlockRuleIds(blockRuleIds.filter(id => id !== ruleId));
    } else {
      setBlockRuleIds([...blockRuleIds, ruleId]);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            {schedule ? 'Edit Schedule' : 'Add New Schedule'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={(e): void => { void handleSubmit(e); }} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <Input
              id="schedule-name"
              label="Schedule Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Work Hours, Study Time"
              maxLength={100}
              required
              error={validationErrors.name}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Give your schedule a descriptive name
            </p>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start-time"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Start Time
              </label>
              <input
                type="time"
                id="start-time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="end-time"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                End Time
              </label>
              <input
                type="time"
                id="end-time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>
          {validationErrors.time && (
            <p className="text-sm text-error-600">{validationErrors.time}</p>
          )}

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Active Days
            </label>

            {/* Quick Select Buttons */}
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={() => setQuickDays('weekdays')}
                className="px-3 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-50"
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setQuickDays('weekends')}
                className="px-3 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-50"
              >
                Weekends
              </button>
              <button
                type="button"
                onClick={() => setQuickDays('all')}
                className="px-3 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-50"
              >
                Every Day
              </button>
            </div>

            {/* Day Checkboxes */}
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <label
                  key={day}
                  className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={daysOfWeek.includes(day)}
                    onChange={() => handleDayToggle(day)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{DAY_LABELS[day]}</span>
                </label>
              ))}
            </div>
            {validationErrors.daysOfWeek && (
              <p className="text-sm text-error-600 mt-1">{validationErrors.daysOfWeek}</p>
            )}
          </div>

          {/* Block Rules */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Block Rules to Activate
            </label>
            {blockRules.length === 0 ? (
              <p className="text-sm text-neutral-600 p-4 bg-neutral-50 rounded">
                No block rules available. Create block rules in the Block List tab first.
              </p>
            ) : (
              <div className="border border-neutral-300 rounded-md max-h-48 overflow-y-auto">
                {blockRules.map(rule => (
                  <label
                    key={rule.id}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer border-b border-neutral-200 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={blockRuleIds.includes(rule.id)}
                      onChange={() => handleBlockRuleToggle(rule.id)}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-neutral-900">{rule.name}</div>
                      <div className="text-xs text-neutral-500">{rule.pattern}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {validationErrors.blockRuleIds && (
              <p className="text-sm text-error-600 mt-1">{validationErrors.blockRuleIds}</p>
            )}
          </div>

          {/* Auto-Start Timer */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer p-3 bg-neutral-50 rounded-md hover:bg-neutral-100 transition-colors">
              <input
                type="checkbox"
                checked={autoStartTimer}
                onChange={e => setAutoStartTimer(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-neutral-900">
                  Auto-start timer when schedule activates
                </span>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Automatically start a work session when this schedule begins
                </p>
              </div>
            </label>
          </div>

          {/* Submit Error */}
          {validationErrors.submit && (
            <div
              role="alert"
              className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md"
            >
              {validationErrors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || blockRules.length === 0}
            >
              {isSaving ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
