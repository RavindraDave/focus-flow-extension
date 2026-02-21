/**
 * useSchedules Hook
 * Focus Flow Extension
 *
 * Custom React hook for managing schedules with CRUD operations.
 * Handles state management and chrome.runtime messaging.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '../types';
import type { BackgroundResponse } from '../types/messages';
import { createLogger } from '../utils/logger';

const log = createLogger('useSchedules');

/**
 * Raw schedule from storage (dates as strings)
 */
interface RawSchedule extends Omit<Schedule, 'exceptions' | 'createdAt' | 'updatedAt'> {
  exceptions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Next schedule info from the background
 */
interface NextScheduleInfo {
  schedule: Schedule | null;
  minutesUntilStart: number;
}

export interface UseSchedulesReturn {
  /** All schedules */
  schedules: Schedule[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Add a new schedule */
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  /** Update an existing schedule */
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<void>;
  /** Delete a schedule */
  deleteSchedule: (id: string) => Promise<void>;
  /** Toggle schedule enabled state */
  toggleSchedule: (id: string) => Promise<void>;
  /** Refresh schedules from storage */
  refresh: () => Promise<void>;
  /** Next upcoming schedule info */
  nextSchedule: NextScheduleInfo | null;
}

/**
 * Send a typed message to background for schedule operations
 */
async function sendScheduleMessage<T>(
  message: Record<string, unknown>
): Promise<BackgroundResponse<T>> {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundResponse<T>>;
}

/**
 * Convert raw schedule data (with string dates) to Schedule objects
 */
function convertRawSchedules(raw: RawSchedule[]): Schedule[] {
  return raw.map((schedule) => ({
    ...schedule,
    exceptions: schedule.exceptions.map((d) => new Date(d)),
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
  }));
}

/**
 * Hook to fetch schedules from background
 */
function useFetchSchedules(
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendScheduleMessage<RawSchedule[]>({ type: 'SCHEDULE_GET_ALL' });

      if (response.success) {
        setSchedules(convertRawSchedules(response.data));
      } else {
        throw new Error(response.error ?? 'Failed to fetch schedules');
      }
    } catch (err) {
      log.error('Failed to fetch schedules', err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [setSchedules, setIsLoading, setError]);
}

/**
 * Hook to fetch next upcoming schedule
 */
function useFetchNextSchedule(
  setNextSchedule: React.Dispatch<React.SetStateAction<NextScheduleInfo | null>>
): () => Promise<void> {
  return useCallback(async (): Promise<void> => {
    try {
      const response = await sendScheduleMessage<NextScheduleInfo>({ type: 'SCHEDULE_GET_NEXT' });

      if (response.success) {
        setNextSchedule(response.data);
      }
    } catch (err) {
      log.error('Failed to fetch next schedule', err instanceof Error ? err : undefined);
    }
  }, [setNextSchedule]);
}

/**
 * Custom hook for managing schedules
 *
 * @returns Schedule management functions and state
 */
export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextSchedule, setNextSchedule] = useState<NextScheduleInfo | null>(null);

  const fetchSchedules = useFetchSchedules(setSchedules, setIsLoading, setError);
  const fetchNextSchedule = useFetchNextSchedule(setNextSchedule);

  /** Add a new schedule */
  const addSchedule = useCallback(
    async (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      try {
        setError(null);
        const response = await sendScheduleMessage<Schedule>({ type: 'SCHEDULE_ADD', schedule });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to add schedule');
        }
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

  /** Update an existing schedule */
  const updateSchedule = useCallback(
    async (id: string, updates: Partial<Schedule>): Promise<void> => {
      try {
        setError(null);
        const response = await sendScheduleMessage<Schedule>({ type: 'SCHEDULE_UPDATE', id, updates });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to update schedule');
        }
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

  /** Delete a schedule */
  const deleteSchedule = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const response = await sendScheduleMessage<boolean>({ type: 'SCHEDULE_DELETE', id });
        if (!response.success) {
          throw new Error(response.error ?? 'Failed to delete schedule');
        }
        if (response.data === false) {
          throw new Error('Schedule not found or could not be deleted');
        }
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

  /** Toggle schedule enabled state */
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
    void fetchSchedules();
    void fetchNextSchedule();
  }, [fetchSchedules, fetchNextSchedule]);

  // Refresh next schedule every minute
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchNextSchedule();
    }, 60000);
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
