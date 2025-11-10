/**
 * SettingsForm - Pomodoro timer and notification settings
 * WCAG 2.1 AA compliant form with validation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import type { UserSettings } from '../../types';

export interface SettingsFormProps {
  settings: UserSettings;
  onSave: (updates: Partial<UserSettings>) => Promise<void>;
  disabled?: boolean;
}

/**
 * SettingsForm component
 * Complexity: 7 (form state + validation + submission)
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({
  settings,
  onSave,
  disabled = false,
}) => {
  // Form state
  const [workDuration, setWorkDuration] = useState(settings.workDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(settings.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(
    settings.sessionsUntilLongBreak
  );
  const [autoStartNextSession, setAutoStartNextSession] = useState(settings.autoStartNextSession);
  const [enableSounds, setEnableSounds] = useState(settings.enableSounds);
  const [enableNotifications, setEnableNotifications] = useState(settings.enableNotifications);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Update form when settings prop changes
  useEffect(() => {
    setWorkDuration(settings.workDuration);
    setShortBreakDuration(settings.shortBreakDuration);
    setLongBreakDuration(settings.longBreakDuration);
    setSessionsUntilLongBreak(settings.sessionsUntilLongBreak);
    setAutoStartNextSession(settings.autoStartNextSession);
    setEnableSounds(settings.enableSounds);
    setEnableNotifications(settings.enableNotifications);
    setTheme(settings.theme);
  }, [settings]);

  /**
   * Validate form values
   * Complexity: 5 (multiple validation rules)
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (workDuration < 1 || workDuration > 60) {
      errors.workDuration = 'Work duration must be between 1 and 60 minutes';
    }
    if (shortBreakDuration < 1 || shortBreakDuration > 30) {
      errors.shortBreakDuration = 'Short break must be between 1 and 30 minutes';
    }
    if (longBreakDuration < 1 || longBreakDuration > 60) {
      errors.longBreakDuration = 'Long break must be between 1 and 60 minutes';
    }
    if (sessionsUntilLongBreak < 2 || sessionsUntilLongBreak > 10) {
      errors.sessionsUntilLongBreak = 'Sessions until long break must be between 2 and 10';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Complexity: 4 (validation + async save + error handling)
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(false);

      await onSave({
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsUntilLongBreak,
        autoStartNextSession,
        enableSounds,
        enableNotifications,
        theme,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset to defaults
   * Complexity: 2 (reset values)
   */
  const handleReset = (): void => {
    setWorkDuration(25);
    setShortBreakDuration(5);
    setLongBreakDuration(15);
    setSessionsUntilLongBreak(4);
    setAutoStartNextSession(false);
    setEnableSounds(true);
    setEnableNotifications(true);
    setTheme('system');
    setValidationErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pomodoro Durations */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Timer Durations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="work-duration"
            label="Work Session (minutes)"
            type="number"
            min={1}
            max={60}
            value={workDuration}
            onChange={(e) => setWorkDuration(Number(e.target.value))}
            error={validationErrors.workDuration}
            disabled={disabled || isSaving}
            required
          />
          <Input
            id="short-break-duration"
            label="Short Break (minutes)"
            type="number"
            min={1}
            max={30}
            value={shortBreakDuration}
            onChange={(e) => setShortBreakDuration(Number(e.target.value))}
            error={validationErrors.shortBreakDuration}
            disabled={disabled || isSaving}
            required
          />
          <Input
            id="long-break-duration"
            label="Long Break (minutes)"
            type="number"
            min={1}
            max={60}
            value={longBreakDuration}
            onChange={(e) => setLongBreakDuration(Number(e.target.value))}
            error={validationErrors.longBreakDuration}
            disabled={disabled || isSaving}
            required
          />
        </div>
        <div className="mt-4">
          <Input
            id="sessions-until-long-break"
            label="Work sessions before long break"
            type="number"
            min={2}
            max={10}
            value={sessionsUntilLongBreak}
            onChange={(e) => setSessionsUntilLongBreak(Number(e.target.value))}
            error={validationErrors.sessionsUntilLongBreak}
            disabled={disabled || isSaving}
            helperText="After this many work sessions, you'll get a longer break"
            required
          />
        </div>
      </section>

      {/* Preferences */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoStartNextSession}
              onChange={(e) => setAutoStartNextSession(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            />
            <span className="text-sm text-neutral-700">
              Auto-start next session
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableSounds}
              onChange={(e) => setEnableSounds(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            />
            <span className="text-sm text-neutral-700">
              Enable notification sounds
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            />
            <span className="text-sm text-neutral-700">
              Enable desktop notifications
            </span>
          </label>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Appearance</h3>
        <div className="flex space-x-4">
          {(['light', 'dark', 'system'] as const).map((themeOption) => (
            <label key={themeOption} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={themeOption}
                checked={theme === themeOption}
                onChange={(e) => setTheme(e.target.value as typeof theme)}
                disabled={disabled || isSaving}
                className="w-4 h-4 text-primary-500 border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              />
              <span className="text-sm text-neutral-700 capitalize">{themeOption}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleReset}
          disabled={disabled || isSaving}
        >
          Reset to Defaults
        </Button>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="text-sm text-success-600">
              ✓ Settings saved successfully
            </span>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={disabled || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </form>
  );
};
