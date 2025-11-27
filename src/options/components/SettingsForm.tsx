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
  const [blockingMode, setBlockingMode] = useState(settings.blockingMode || 'blacklist');

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
    setBlockingMode(settings.blockingMode || 'blacklist');
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
        blockingMode,
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
    setValidationErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pomodoro Durations */}
      <section>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Timer Durations</h3>
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
        <h3 className="text-lg font-semibold text-text-primary mb-4">Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoStartNextSession}
              onChange={(e) => setAutoStartNextSession(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
            <span className="text-sm text-text-secondary">
              Auto-start next session
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableSounds}
              onChange={(e) => setEnableSounds(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
            <span className="text-sm text-text-secondary">
              Enable notification sounds
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              disabled={disabled || isSaving}
              className="w-4 h-4 text-accent border-border rounded focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
            <span className="text-sm text-text-secondary">
              Enable desktop notifications
            </span>
          </label>
        </div>
      </section>

      {/* Blocking Mode */}
      <section>
        <h3 className="text-md font-semibold text-text-primary mb-2">
          Blocking Mode
        </h3>
        <p className="text-sm text-text-tertiary mb-4">
          Choose how site blocking works during focus sessions
        </p>

        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors border border-border-light">
            <input
              type="radio"
              name="blockingMode"
              value="blacklist"
              checked={blockingMode === 'blacklist'}
              onChange={() => setBlockingMode('blacklist')}
              disabled={disabled || isSaving}
              className="mt-1 w-4 h-4 text-accent border-border focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">
                Blacklist Mode (Default)
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">
                Block specific sites you add to your block list. All other sites remain accessible.
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors border border-border-light">
            <input
              type="radio"
              name="blockingMode"
              value="whitelist"
              checked={blockingMode === 'whitelist'}
              onChange={() => setBlockingMode('whitelist')}
              disabled={disabled || isSaving}
              className="mt-1 w-4 h-4 text-accent border-border focus:ring-2 focus:ring-accent focus:ring-offset-2"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">
                Whitelist Mode (Ultra Focus)
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">
                Block ALL sites except those you add to your allow list. Maximum focus mode.
              </div>
            </div>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border-light">
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
            <span className="text-sm text-success">
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
