/**
 * BlockRuleForm - Add/Edit block rule modal form
 * WCAG 2.1 AA compliant with validation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms/Button';
import { Input } from '../../components/atoms/Input';
import type { BlockRule } from '../../types';

export interface BlockRuleFormProps {
  rule?: BlockRule; // If provided, editing existing rule
  onSave: (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

/**
 * BlockRuleForm component
 * Complexity: 8 (form state + validation + submission)
 */
export const BlockRuleForm: React.FC<BlockRuleFormProps> = ({
  rule,
  onSave,
  onCancel,
  isOpen,
}) => {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [type, setType] = useState<'domain' | 'keyword' | 'url'>('domain');
  const [enabled, setEnabled] = useState(true);
  const [allowance, setAllowance] = useState<number | null>(null);
  const [useAllowance, setUseAllowance] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form when rule changes
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setPattern(rule.pattern);
      setType(rule.type);
      setEnabled(rule.enabled);
      setAllowance(rule.allowance);
      setUseAllowance(rule.allowance !== null);
    } else {
      // Reset form
      setName('');
      setPattern('');
      setType('domain');
      setEnabled(true);
      setAllowance(null);
      setUseAllowance(false);
    }
    setValidationErrors({});
  }, [rule, isOpen]);

  /**
   * Validate form values
   * Complexity: 5 (multiple validation rules)
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (!pattern.trim()) {
      errors.pattern = 'Pattern is required';
    } else if (pattern.length > 500) {
      errors.pattern = 'Pattern must be 500 characters or less';
    }

    if (useAllowance) {
      if (allowance === null || allowance < 1) {
        errors.allowance = 'Allowance must be at least 1 minute';
      } else if (allowance > 1440) {
        errors.allowance = 'Allowance cannot exceed 1440 minutes (24 hours)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Complexity: 4 (validation + async save)
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);

      await onSave({
        name: name.trim(),
        pattern: pattern.trim(),
        type,
        enabled,
        allowance: useAllowance ? allowance : null,
        timeUsedToday: 0,
      });

      onCancel(); // Close modal on success
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-neutral-900 mb-6">
          {rule ? 'Edit Block Rule' : 'Add Block Rule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <Input
            id="rule-name"
            label="Rule Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={validationErrors.name}
            disabled={isSaving}
            placeholder="e.g., Block Social Media"
            maxLength={100}
            required
          />

          {/* Pattern */}
          <Input
            id="rule-pattern"
            label="Pattern to Block"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            error={validationErrors.pattern}
            disabled={isSaving}
            placeholder="e.g., youtube.com, twitter.com"
            helperText="Domain, URL, or keyword to block"
            maxLength={500}
            required
          />

          {/* Type */}
          <div>
            <label htmlFor="rule-type" className="block text-sm font-medium text-neutral-700 mb-2">
              Pattern Type
            </label>
            <select
              id="rule-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              disabled={isSaving}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="domain">Domain (e.g., youtube.com)</option>
              <option value="url">URL (e.g., https://twitter.com/*)</option>
              <option value="keyword">Keyword (e.g., reddit)</option>
            </select>
          </div>

          {/* Daily Allowance */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={useAllowance}
                onChange={(e) => setUseAllowance(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">
                Set daily time allowance
              </span>
            </label>

            {useAllowance && (
              <Input
                id="rule-allowance"
                label="Minutes per day"
                type="number"
                min={1}
                max={1440}
                value={allowance || ''}
                onChange={(e) => setAllowance(Number(e.target.value))}
                error={validationErrors.allowance}
                disabled={isSaving}
                helperText="Allow limited access (1-1440 minutes)"
              />
            )}
          </div>

          {/* Enabled */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">
              Enable this rule immediately
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Add Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
