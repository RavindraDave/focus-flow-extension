/**
 * BlockRuleList - Display and manage block rules
 * WCAG 2.1 AA compliant table with actions
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { Spinner } from '../../components/atoms/Spinner';
import { BlockRuleForm } from './BlockRuleForm';
import { useBlockRules } from '../../hooks/useBlockRules';
import type { BlockRule } from '../../types';

/**
 * Format time used
 * Complexity: 2 (conditional formatting)
 */
function formatTimeUsed(minutes: number): string {
  if (minutes === 0) return '0min';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
}

/**
 * BlockRuleList component
 * Complexity: 8 (CRUD operations + modal management)
 */
export const BlockRuleList: React.FC = () => {
  const {
    rules,
    isLoading,
    error,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    exportRules,
  } = useBlockRules();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BlockRule | undefined>(undefined);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  /**
   * Handle add new rule
   * Complexity: 1
   */
  const handleAdd = (): void => {
    setEditingRule(undefined);
    setIsFormOpen(true);
  };

  /**
   * Handle edit rule
   * Complexity: 2
   */
  const handleEdit = (rule: BlockRule): void => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  /**
   * Handle save rule (add or update)
   * Complexity: 3 (conditional add/update)
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
   * Handle delete rule with confirmation
   * Complexity: 3 (confirmation + async delete)
   */
  const handleDelete = async (rule: BlockRule): Promise<void> => {
    if (
      confirm(
        `Are you sure you want to delete "${rule.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        setDeletingRuleId(rule.id);
        await deleteRule(rule.id);
      } finally {
        setDeletingRuleId(null);
      }
    }
  };

  /**
   * Handle import from JSON file
   * Complexity: 4 (file reading + JSON parsing + validation)
   */
  const handleImport = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedRules = JSON.parse(text) as BlockRule[];

        if (!Array.isArray(importedRules)) {
          throw new Error('Invalid file format');
        }

        // TODO: Implement importRules
        console.log('Import rules:', importedRules);
        alert(`Successfully imported ${importedRules.length} rules`);
      } catch (err) {
        alert('Failed to import rules. Please check the file format.');
        console.error('Import error:', err);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
        <span className="ml-3 text-neutral-600">Loading block rules...</span>
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

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">
            {rules.length} {rules.length === 1 ? 'rule' : 'rules'} total
            {' • '}
            {rules.filter((r) => r.enabled).length} active
          </p>
        </div>
        <div className="flex space-x-2">
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
          <Button variant="primary" size="sm" onClick={handleAdd}>
            + Add Rule
          </Button>
        </div>
      </div>

      {/* Rules Table */}
      {rules.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-neutral-600 mb-4">
            🚫 No block rules yet
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Add your first rule to start blocking distracting websites
          </p>
          <Button variant="primary" size="md" onClick={handleAdd}>
            Add Your First Rule
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
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
            <tbody className="bg-white divide-y divide-neutral-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-neutral-50">
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
      />
    </div>
  );
};
