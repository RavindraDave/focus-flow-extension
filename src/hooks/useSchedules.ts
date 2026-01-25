/**
 * useSchedules Hook
 * Focus Flow Extension
 *
 * Custom React hook for managing schedules with CRUD operations.
 * Handles state management and chrome.runtime messaging.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '../types';

/**
 * Raw schedule from storage (dates as strings)
 */
interface RawSchedule extends Omit<Schedule, 'exceptions' | 'createdAt' | 'updatedAt'> {
  exceptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UseSchedulesReturn {
  /**
   * All schedules
   */
  schedules: Schedule[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message if operation failed
   */
  error: string | null;

  /**
   * Add a new schedule
   */
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  /**
   * Update an existing schedule
   */
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;

  /**
   * Delete a schedule
   */
  deleteSchedule: (id: string) => Promise<void>;

  /**
   * Toggle schedule enabled state
   */
  toggleSchedule: (id: string) => Promise<void>;

  /**
   * Refresh schedules from storage
   */
  refresh: () => Promise<void>;

  /**
   * Next upcoming schedule info
   */
  nextSchedule: {
    schedule: Schedule | null;
    minutesUntilStart: number;
  } | null;
}

/**
 * Custom hook for managing schedules
 * Complexity: 9 (multiple async operations + state management)
 *
 * @returns Schedule management functions and state
 */
export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextSchedule, setNextSchedule] = useState<{
    schedule: Schedule | null;
    minutesUntilStart: number;
  } | null>(null);

  /**
   * Fetch all schedules from background
   * Complexity: 4 (async + error handling + state updates)
   */
  const fetchSchedules = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({ type: 'SCHEDULE_GET_ALL' });

      if (response.success && response.data) {
        // Convert date strings back to Date objects
        const schedulesWithDates = (response.data as RawSchedule[]).map((schedule) => ({
          ...schedule,
          exceptions: schedule.exceptions.map((d) => new Date(d)),
          createdAt: new Date(schedule.createdAt),
          updatedAt: new Date(schedule.updatedAt),
        }));
        setSchedules(schedulesWithDates);
      } else {
        throw new Error(response.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch next upcoming schedule
   * Complexity: 3 (async + error handling)
   */
  const fetchNextSchedule = useCallback(async (): Promise<void> => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SCHEDULE_GET_NEXT' });

      if (response.success && response.data) {
        setNextSchedule(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch next schedule:', err);
    }
  }, []);

  /**
   * Add a new schedule
   * Complexity: 5 (async + validation + error handling + refresh)
   */
  const addSchedule = useCallback(
    async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'SCHEDULE_ADD',
          schedule,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to add schedule');
        }

        // Refresh schedules list
        await fetchSchedules();
        await fetchNextSchedule();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add schedule';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchSchedules, fetchNextSchedule]
  );

  /**
   * Update an existing schedule
   * Complexity: 5 (async + validation + error handling + refresh)
   */
  const updateSchedule = useCallback(
    async (id: string, updates: Partial<Schedule>): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'SCHEDULE_UPDATE',
          id,
          updates,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update schedule');
        }

        // Refresh schedules list
        await fetchSchedules();
        await fetchNextSchedule();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchSchedules, fetchNextSchedule]
  );

  /**
   * Delete a schedule
   * Complexity: 5 (async + confirmation + error handling + refresh)
   */
  const deleteSchedule = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'SCHEDULE_DELETE',
          id,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete schedule');
        }

        // Check if the delete actually happened (response.data should be true)
        if (response.data === false) {
          throw new Error('Schedule not found or could not be deleted');
        }

        // Refresh schedules list
        await fetchSchedules();
        await fetchNextSchedule();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchSchedules, fetchNextSchedule]
  );

  /**
   * Toggle schedule enabled state
   * Complexity: 4 (find + toggle + update)
   */
  const toggleSchedule = useCallback(
    async (id: string): Promise<void> => {
      const schedule = schedules.find(s => s.id === id);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      await updateSchedule(id, { enabled: !schedule.enabled });
    },
    [schedules, updateSchedule]
  );

  // Fetch schedules on mount
  useEffect(() => {
    fetchSchedules();
    fetchNextSchedule();
  }, [fetchSchedules, fetchNextSchedule]);

  // Refresh next schedule every minute
  useEffect(() => {
    const interval = setInterval(fetchNextSchedule, 60000);
    return () => clearInterval(interval);
  }, [fetchNextSchedule]);

  return {
    schedules,
    isLoading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    refresh: fetchSchedules,
    nextSchedule,
  };
}
