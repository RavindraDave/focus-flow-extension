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
  return chrome.runtime.sendMessage<Record<string, unknown>, BackgroundResponse<T>>(message);
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

type BlockRuleInput = Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Hook for single and batch rule addition
 */
function useAddRules(
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchRules: () => Promise<void>
): { addRule: (rule: BlockRuleInput) => Promise<void>; addRules: (rules: BlockRuleInput[]) => Promise<void> } {
  const addRule = useCallback(
    async (rule: BlockRuleInput): Promise<void> => {
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
    [fetchRules, setError]
  );

  const addRules = useCallback(
    async (rulesToAdd: BlockRuleInput[]): Promise<void> => {
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
    [fetchRules, setError]
  );

  return { addRule, addRules };
}

/**
 * Hook for update and delete rule operations
 */
// eslint-disable-next-line max-lines-per-function
function useMutateRules(
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  fetchRules: () => Promise<void>
): {
  updateRule: (id: string, updates: Partial<BlockRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  deleteRules: (ids: string[]) => Promise<void>;
} {
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
    [fetchRules, setError]
  );

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
    [fetchRules, setError]
  );

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
    [fetchRules, setError]
  );

  return { updateRule, deleteRule, deleteRules };
}

/**
 * Hook for import/export and toggle operations
 */
function useImportExportRules(
  rules: BlockRule[],
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  addRule: (rule: BlockRuleInput) => Promise<void>,
  updateRule: (id: string, updates: Partial<BlockRule>) => Promise<void>
): {
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  importRules: (rules: BlockRule[]) => Promise<void>;
  exportRules: () => Promise<void>;
} {
  const toggleRule = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      await updateRule(id, { enabled });
    },
    [updateRule]
  );

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
    [addRule, setError]
  );

  const exportRules = useCallback((): Promise<void> => {
    try {
      downloadRulesAsJson(rules);
      return Promise.resolve();
    } catch (err) {
      handleBlockRulesError(err, 'Failed to export rules', setError);
      throw err;
    }
  }, [rules, setError]);

  return { toggleRule, importRules, exportRules };
}

/**
 * Custom hook to manage block rules
 */
export function useBlockRules(): UseBlockRulesReturn {
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useFetchRules(setRules, setIsLoading, setError);
  const { addRule, addRules } = useAddRules(setError, fetchRules);
  const { updateRule, deleteRule, deleteRules } = useMutateRules(setError, fetchRules);
  const { toggleRule, importRules, exportRules } = useImportExportRules(rules, setError, addRule, updateRule);

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
