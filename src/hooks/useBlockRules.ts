/**
 * useBlockRules - React hook for block rules management
 * Communicates with background service worker for CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { BlockRule } from '../types';

export interface UseBlockRulesReturn {
  rules: BlockRule[];
  isLoading: boolean;
  error: string | null;
  addRule: (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<BlockRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  importRules: (rules: BlockRule[]) => Promise<void>;
  exportRules: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to manage block rules
 * Complexity: 5 (multiple CRUD operations + error handling)
 */
export function useBlockRules(): UseBlockRulesReturn {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all block rules
   * Complexity: 3 (try-catch + message sending)
   */
  const fetchRules = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'BLOCKLIST_GET_ALL',
      });

      if (response.success && response.data) {
        setRules(response.data);
      } else {
        throw new Error(response.error || 'Failed to get block rules');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch block rules';
      setError(message);
      console.error('Failed to fetch block rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add new block rule
   * Complexity: 3 (validation + try-catch)
   */
  const addRule = useCallback(
    async (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'BLOCKLIST_ADD',
          rule,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to add rule');
        }

        await fetchRules();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add rule';
        setError(message);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Update existing block rule
   * Complexity: 3 (validation + try-catch)
   */
  const updateRule = useCallback(
    async (id: string, updates: Partial<BlockRule>): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'BLOCKLIST_UPDATE',
          id,
          updates,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update rule');
        }

        await fetchRules();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update rule';
        setError(message);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Delete block rule
   * Complexity: 2 (try-catch)
   */
  const deleteRule = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'BLOCKLIST_DELETE',
          id,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete rule');
        }

        await fetchRules();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete rule';
        setError(message);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Toggle rule enabled state
   * Complexity: 2 (wrapper for updateRule)
   */
  const toggleRule = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      await updateRule(id, { enabled });
    },
    [updateRule]
  );

  /**
   * Import rules from JSON
   * Complexity: 4 (validation + batch operations)
   */
  const importRules = useCallback(
    async (importedRules: BlockRule[]): Promise<void> => {
      try {
        setError(null);

        // Add each rule
        for (const rule of importedRules) {
          await addRule({
            name: rule.name,
            pattern: rule.pattern,
            type: rule.type,
            enabled: rule.enabled,
            allowance: rule.allowance,
            timeUsedToday: 0, // Reset time used
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import rules';
        setError(message);
        throw err;
      }
    },
    [addRule]
  );

  /**
   * Export rules as JSON file
   * Complexity: 3 (JSON creation + download)
   */
  const exportRules = useCallback(async (): Promise<void> => {
    try {
      const dataStr = JSON.stringify(rules, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `focus-flow-blocklist-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export rules';
      setError(message);
      throw err;
    }
  }, [rules]);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    isLoading,
    error,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    importRules,
    exportRules,
    refresh: fetchRules,
  };
}
