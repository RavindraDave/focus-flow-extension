/**
 * BlockRuleList - Display and manage block rules
 * WCAG 2.1 AA compliant table with actions
 * Now with bulk delete and custom themed confirmations
 */

import React, { useState } from 'react';
import { z } from 'zod';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { Spinner } from '../../components/atoms/Spinner';
import { BlockRuleForm } from './BlockRuleForm';
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog';
import { useBlockRules } from '../../hooks/useBlockRules';
import { useSettings } from '../../hooks/useSettings';
import type { BlockRule } from '../../types';
import { BlockRuleSchema } from '../../types/schemas';
import { FEATURE_FLAGS, IS_PREMIUM_COMING_SOON } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const log = createLogger('BlockRuleList');

/**
 * Format time used
 * Complexity: 2 (conditional formatting)
 */
function formatTimeUsed(minutes: number): string {
  if (minutes === 0) { return '0min'; }
  if (minutes < 60) { return `${minutes}min`; }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info';
  isLoading: boolean;
  onConfirm: () => Promise<void>;
}

/**
 * BlockRuleList component
 * Complexity: 10 (CRUD + bulk operations + modal management)
 */
export const BlockRuleList: React.FC = () => {
  const {
    rules,
    isLoading,
    error,
    addRule,
    updateRule,
    deleteRule,
    deleteRules,
    toggleRule,
    exportRules,
  } = useBlockRules();

  const { settings } = useSettings();
  const isWhitelistMode = settings?.blockingMode === 'whitelist';

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BlockRule | undefined>(undefined);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  /**
   * Handle add new rule
   */
  const handleAdd = (): void => {
    setEditingRule(undefined);
    setIsFormOpen(true);
  };

  /**
   * Handle edit rule
   */
  const handleEdit = (rule: BlockRule): void => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  /**
   * Handle save rule (add or update)
   */
  const handleSave = async (
    ruleData: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (editingRule) {
      await updateRule(editingRule.id, ruleData);
    } else {
      await addRule(ruleData);
    }
  };

  /**
   * Handle delete single rule with contextual confirmation
   */
  const handleDelete = (rule: BlockRule): void => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Rule?',
      message: `Are you sure you want to delete "${rule.name}"?\n\nPattern: ${rule.pattern}\n\nThis action cannot be undone.`,
      variant: 'warning',
      isLoading: false,
      onConfirm: async () => {
        setConfirmState(prev => prev ? { ...prev, isLoading: true } : null);
        try {
          setDeletingRuleId(rule.id);
          await deleteRule(rule.id);
          setConfirmState(null);
        } catch (error) {
          log.error('Failed to delete rule', error instanceof Error ? error : undefined);
          setConfirmState(prev => prev ? { ...prev, isLoading: false } : null);
        } finally {
          setDeletingRuleId(null);
        }
      },
    });
  };

  /**
   * Handle bulk delete with contextual confirmation
   */
  const handleBulkDelete = (): void => {
    const count = selectedRuleIds.size;
    const ruleWord = count === 1 ? 'rule' : 'rules';

    setConfirmState({
      isOpen: true,
      title: `Delete ${count} ${ruleWord}?`,
      message: `Are you sure you want to delete ${count} selected ${ruleWord}?\n\nThis action cannot be undone.`,
      variant: 'warning',
      isLoading: false,
      onConfirm: async () => {
        setConfirmState(prev => prev ? { ...prev, isLoading: true } : null);
        try {
          await deleteRules(Array.from(selectedRuleIds));
          setSelectedRuleIds(new Set());
          setConfirmState(null);
        } catch (error) {
          log.error('Failed to delete rules', error instanceof Error ? error : undefined);
          setConfirmState(prev => prev ? { ...prev, isLoading: false } : null);
        }
      },
    });
  };

  /**
   * Handle clear all rules with STRONG caution
   */
  const handleClearAll = (): void => {
    const count = rules.length;

    setConfirmState({
      isOpen: true,
      title: 'DELETE ALL RULES?',
      message: `🚨 CAUTION: This will permanently delete ALL ${count} blocking rules!\n\nYou will lose:\n• All custom block rules\n• All allowance settings\n• All usage tracking data\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`,
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmState(prev => prev ? { ...prev, isLoading: true } : null);
        try {
          await deleteRules(rules.map(r => r.id));
          setSelectedRuleIds(new Set());
          setConfirmState(null);
        } catch (error) {
          log.error('Failed to clear all rules', error instanceof Error ? error : undefined);
          setConfirmState(prev => prev ? { ...prev, isLoading: false } : null);
        }
      },
    });
  };

  /**
   * Toggle selection for a rule
   */
  const toggleSelection = (ruleId: string): void => {
    setSelectedRuleIds(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  /**
   * Toggle select all
   */
  const toggleSelectAll = (): void => {
    if (selectedRuleIds.size === rules.length) {
      setSelectedRuleIds(new Set());
    } else {
      setSelectedRuleIds(new Set(rules.map(r => r.id)));
    }
  };

  /**
   * Handle import from JSON file
   * SECURITY: Validates imported rules against schema
   */
  const handleImport = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { return; }

      try {
        const text = await file.text();

        // SECURITY: Parse JSON safely
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error('Invalid JSON format');
        }

        // SECURITY: Validate structure
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid file format: expected an array of rules');
        }

        // SECURITY: Validate each rule against schema
        const ImportedRulesSchema = z.array(BlockRuleSchema);
        const validationResult = ImportedRulesSchema.safeParse(parsed);

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          throw new Error(`Invalid rule data: ${firstError?.path.join('.')} - ${firstError?.message}`);
        }

        const importedRules = validationResult.data as BlockRule[];

        // Import each rule into the system
        try {
          for (const rule of importedRules) {
            // Generate new ID for imported rule
            const newRule: Omit<BlockRule, 'id'> = {
              name: rule.name,
              pattern: rule.pattern,
              type: rule.type,
              enabled: rule.enabled,
              allowance: rule.allowance,
              timeUsedToday: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await addRule(newRule);
          }
          alert(`Successfully imported ${importedRules.length} block rules.`);
        } catch (importErr) {
          throw new Error(`Failed to save rules: ${importErr instanceof Error ? importErr.message : 'Unknown error'}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        alert(`Failed to import rules: ${message}`);
        log.error('Import error', err instanceof Error ? err : undefined);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
        <span className="ml-3 text-neutral-600">
          Loading {isWhitelistMode ? 'allowed sites' : 'block rules'}...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
        <p className="text-error-700">Failed to load block rules: {error}</p>
      </div>
    );
  }

  const hasSelection = selectedRuleIds.size > 0;
  const allSelected = rules.length > 0 && selectedRuleIds.size === rules.length;
  const isLimitReached = rules.length >= FEATURE_FLAGS.FREE.maxBlockRules;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">
            {rules.length} {rules.length === 1 ? 'rule' : 'rules'} total
            {' • '}
            {rules.filter((r) => r.enabled).length} active
            {hasSelection && ` • ${selectedRuleIds.size} selected`}
          </p>
        </div>
        <div className="flex space-x-2">
          {hasSelection && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-error/10 text-error hover:bg-error/20"
            >
              Delete Selected ({selectedRuleIds.size})
            </Button>
          )}
          {rules.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearAll}
              className="text-error hover:bg-error/10"
            >
              Clear All
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleImport}>
            Import JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportRules}
            disabled={rules.length === 0}
          >
            Export JSON
          </Button>
          {isLimitReached ? (
            <div className="relative group">
              <Button variant="primary" size="sm" disabled>
                {isWhitelistMode ? '+ Add Allowed Site' : '+ Add Rule'}
              </Button>
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-neutral-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                <p className="font-bold mb-1">Free Limit Reached</p>
                <p>You can add up to {FEATURE_FLAGS.FREE.maxBlockRules} {isWhitelistMode ? 'allowed sites' : 'rules'} on the free plan.</p>
                <div className="mt-2 text-neutral-400 border-l-2 border-accent pl-2">
                  <p className="font-bold text-accent">Pro Tip:</p>
                  <p>
                    {isWhitelistMode
                      ? 'Wildcards allowed! E.g. "*.work.com" or "google.com/*".'
                      : '1 Rule can block many sites! Use keywords (e.g. "news") or patterns (e.g. "*.social") to group sites.'
                    }
                  </p>
                </div>
                {IS_PREMIUM_COMING_SOON && (
                  <p className="mt-2 text-accent border-t border-neutral-700 pt-2">
                    Premium Coming Soon: Unlimited {isWhitelistMode ? 'Allowed Sites' : 'Rules'}!
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={handleAdd}>
              {isWhitelistMode ? '+ Add Allowed Site' : '+ Add Rule'}
            </Button>
          )}
        </div>
      </div>

      {/* Rules Table */}
      {rules.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
          <p className="text-text-primary mb-4 font-medium text-lg">
            {isWhitelistMode ? '🔒 No allowed sites yet' : '🚫 No block rules yet'}
          </p>
          <p className="text-sm text-text-secondary mb-6">
            {isWhitelistMode
              ? 'Add sites you want to ACCESS while focusing. All other sites will be blocked.'
              : 'Add your first rule to start blocking distracting websites'
            }
          </p>
          <Button variant="primary" size="md" onClick={handleAdd}>
            {isWhitelistMode ? 'Add Your First Site' : 'Add Your First Rule'}
          </Button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-accent focus:ring-accent"
                    aria-label="Select all rules"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Pattern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Allowance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {rules.map((rule) => (
                <tr key={rule.id} className={`hover:bg-bg-secondary ${selectedRuleIds.has(rule.id) ? 'bg-accent/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRuleIds.has(rule.id)}
                      onChange={() => toggleSelection(rule.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-accent focus:ring-accent"
                      aria-label={`Select ${rule.name}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id, !rule.enabled)}
                      className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                      aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.enabled ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Disabled
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {rule.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-600 font-mono max-w-xs truncate">
                      {rule.pattern}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="info" size="sm">
                      {rule.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">
                      {rule.allowance ? (
                        <>
                          {formatTimeUsed(rule.timeUsedToday)} / {rule.allowance}min
                        </>
                      ) : (
                        <span className="text-neutral-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rule)}
                      disabled={deletingRuleId === rule.id}
                      className="text-error-600 hover:text-error-700 font-medium focus:outline-none focus:ring-2 focus:ring-error-500 rounded px-2 py-1 disabled:opacity-50"
                    >
                      {deletingRuleId === rule.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BlockRuleForm
        rule={editingRule}
        onSave={handleSave}
        onCancel={() => setIsFormOpen(false)}
        isOpen={isFormOpen}
        mode={isWhitelistMode ? 'whitelist' : 'blacklist'}
      />

      {/* Confirmation Dialog */}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          variant={confirmState.variant}
          isLoading={confirmState.isLoading}
          confirmText={confirmState.variant === 'danger' ? 'Yes, Delete All' : 'Delete'}
          cancelText="Cancel"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};
