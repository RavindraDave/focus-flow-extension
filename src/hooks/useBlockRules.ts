/**
 * useBlockRules - React hook for block rules management
 * Communicates with background service worker for CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { BlockRule } from '../types';
import type { BackgroundResponse } from '../types/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('useBlockRules');

export interface UseBlockRulesReturn {
  rules: BlockRule[];
  isLoading: boolean;
  error: string | null;
  addRule: (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addRules: (rules: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateRule: (id: string, updates: Partial<BlockRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  deleteRules: (ids: string[]) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  importRules: (rules: BlockRule[]) => Promise<void>;
  exportRules: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Send a typed message to background and return the response
 */
async function sendBlocklistMessage<T>(
  message: Record<string, unknown>
): Promise<BackgroundResponse<T>> {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundResponse<T>>;
}

/**
 * Handle error from a block rules operation
 */
function handleBlockRulesError(
  err: unknown,
  fallbackMessage: string,
  setError: (msg: string) => void
): void {
  const message = err instanceof Error ? err.message : fallbackMessage;
  setError(message);
}

/**
 * Download rules as a JSON file
 */
function downloadRulesAsJson(rules: BlockRule[]): void {
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
}

/**
 * Fetch all block rules from the background
 */
function useFetchRules(
  setRules: React.Dispatch<React.SetStateAction<BlockRule[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendBlocklistMessage<BlockRule[]>({
        type: 'BLOCKLIST_GET_ALL',
      });

      if (response.success) {
        setRules(response.data);
      } else {
        throw new Error(response.error ?? 'Failed to get block rules');
      }
    } catch (err) {
      handleBlockRulesError(err, 'Failed to fetch block rules', setError);
      log.error('Failed to fetch block rules', err instanceof Error ? err : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [setRules, setIsLoading, setError]);
}

/**
 * Custom hook to manage block rules
 */
export function useBlockRules(): UseBlockRulesReturn {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useFetchRules(setRules, setIsLoading, setError);

  /**
   * Add new block rule
   */
  const addRule = useCallback(
    async (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      try {
        setError(null);
        const response = await sendBlocklistMessage<BlockRule>({ type: 'BLOCKLIST_ADD', rule });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to add rule');
        }
        await fetchRules();
      } catch (err) {
        handleBlockRulesError(err, 'Failed to add rule', setError);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Add multiple rules in batch
   */
  const addRules = useCallback(
    async (rulesToAdd: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> => {
      try {
        setError(null);
        for (const rule of rulesToAdd) {
          const response = await sendBlocklistMessage<BlockRule>({ type: 'BLOCKLIST_ADD', rule });
          if (!response.success) {
            log.error('Failed to add rule', undefined, { pattern: rule.pattern, error: response.error });
          }
        }
        await fetchRules();
      } catch (err) {
        handleBlockRulesError(err, 'Failed to add rules', setError);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Update existing block rule
   */
  const updateRule = useCallback(
    async (id: string, updates: Partial<BlockRule>): Promise<void> => {
      try {
        setError(null);
        const response = await sendBlocklistMessage<BlockRule>({ type: 'BLOCKLIST_UPDATE', id, updates });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update rule');
        }
        await fetchRules();
      } catch (err) {
        handleBlockRulesError(err, 'Failed to update rule', setError);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Delete block rule
   */
  const deleteRule = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const response = await sendBlocklistMessage<boolean>({ type: 'BLOCKLIST_DELETE', id });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to delete rule');
        }
        await fetchRules();
      } catch (err) {
        handleBlockRulesError(err, 'Failed to delete rule', setError);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Delete multiple rules in batch
   */
  const deleteRules = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        setError(null);
        for (const id of ids) {
          const response = await sendBlocklistMessage<boolean>({ type: 'BLOCKLIST_DELETE', id });
          if (!response.success) {
            log.error('Failed to delete rule', undefined, { id, error: response.error });
          }
        }
        await fetchRules();
      } catch (err) {
        handleBlockRulesError(err, 'Failed to delete rules', setError);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Toggle rule enabled state
   */
  const toggleRule = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      await updateRule(id, { enabled });
    },
    [updateRule]
  );

  /**
   * Import rules from JSON
   */
  const importRules = useCallback(
    async (importedRules: BlockRule[]): Promise<void> => {
      try {
        setError(null);
        for (const rule of importedRules) {
          await addRule({
            name: rule.name,
            pattern: rule.pattern,
            type: rule.type,
            enabled: rule.enabled,
            allowance: rule.allowance,
            timeUsedToday: 0,
          });
        }
      } catch (err) {
        handleBlockRulesError(err, 'Failed to import rules', setError);
        throw err;
      }
    },
    [addRule]
  );

  /**
   * Export rules as JSON file
   */
  const exportRules = useCallback(async (): Promise<void> => {
    try {
      downloadRulesAsJson(rules);
    } catch (err) {
      handleBlockRulesError(err, 'Failed to export rules', setError);
      throw err;
    }
  }, [rules]);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  return {
    rules,
    isLoading,
    error,
    addRule,
    addRules,
    updateRule,
    deleteRule,
    deleteRules,
    toggleRule,
    importRules,
    exportRules,
    refresh: fetchRules,
  };
}
