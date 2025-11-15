/**
 * Session Repository
 * Focus Flow Extension
 *
 * Manages PomodoroSession data persistence using the repository pattern.
 * All storage access goes through StorageService for validation and security.
 */

import { StorageService } from './storage-service';
import { PomodoroSession } from '../types/index';
import { PomodoroSessionSchema } from '../types/schemas';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../utils/constants';
import { z } from 'zod';

/**
 * Repository for managing Pomodoro sessions
 *
 * Responsibilities:
 * - CRUD operations for PomodoroSession
 * - Session history management
 * - Cleanup old sessions (max 1000)
 *
 * @example
 * ```typescript
 * const repo = new SessionRepository();
 * await repo.saveSession(session);
 * const current = await repo.getCurrentSession();
 * ```
 */
export class SessionRepository {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * Get the currently active session
   *
   * @returns Active session or null if none
   */
  async getCurrentSession(): Promise<PomodoroSession | null> {
    const session = await this.storageService.get(
      STORAGE_KEYS.CURRENT_SESSION,
      PomodoroSessionSchema.optional() as unknown as z.ZodType<PomodoroSession | undefined>
    );
    return session ?? null;
  }

  /**
   * Save the current active session
   *
   * @param session - Session to save as current
   * @throws StorageError if validation fails
   */
  async saveCurrentSession(session: PomodoroSession): Promise<void> {
    await this.storageService.set(
      STORAGE_KEYS.CURRENT_SESSION,
      session,
      PomodoroSessionSchema as unknown as z.ZodType<PomodoroSession>,
      { debounce: false } // Immediate write for active session
    );
  }

  /**
   * Clear the current active session
   */
  async clearCurrentSession(): Promise<void> {
    await this.storageService.remove(STORAGE_KEYS.CURRENT_SESSION);
  }

  /**
   * Get all session history
   *
   * @param limit - Maximum number of sessions to return (default: all)
   * @returns Array of sessions, newest first
   */
  async getSessionHistory(limit?: number): Promise<PomodoroSession[]> {
    const sessions =
      (await this.storageService.get(
        STORAGE_KEYS.SESSIONS,
        z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>
      )) || [];

    // Return newest first
    const sorted = sessions.sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    if (limit && limit > 0) {
      return sorted.slice(0, limit);
    }

    return sorted;
  }

  /**
   * Add a session to history
   *
   * Automatically cleans up old sessions if exceeding limit.
   *
   * @param session - Session to add to history
   */
  async addToHistory(session: PomodoroSession): Promise<void> {
    const sessions = await this.getSessionHistory();

    // Add new session
    sessions.unshift(session); // Add to beginning (newest first)

    // Cleanup if exceeding limit
    if (sessions.length > STORAGE_LIMITS.MAX_SESSIONS_HISTORY) {
      await this.cleanupOldSessions(sessions);
    } else {
      await this.storageService.set(
        STORAGE_KEYS.SESSIONS,
        sessions,
        z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>
      );
    }
  }

  /**
   * Update a specific session in history
   *
   * @param id - Session ID to update
   * @param updates - Partial session data to update
   * @throws Error if session not found
   */
  async updateSession(
    id: string,
    updates: Partial<PomodoroSession>
  ): Promise<void> {
    const sessions = await this.getSessionHistory();
    const index = sessions.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error(`Session not found: ${id}`);
    }

    // Merge updates
    sessions[index] = {
      ...sessions[index],
      ...updates,
    } as PomodoroSession;

    await this.storageService.set(
      STORAGE_KEYS.SESSIONS,
      sessions,
      z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>
    );
  }

  /**
   * Find a session by ID
   *
   * @param id - Session ID to find
   * @returns Session if found, null otherwise
   */
  async findById(id: string): Promise<PomodoroSession | null> {
    const sessions = await this.getSessionHistory();
    return sessions.find((s) => s.id === id) || null;
  }

  /**
   * Get sessions by status
   *
   * @param status - Session status to filter by
   * @returns Filtered sessions
   */
  async getSessionsByStatus(
    status: PomodoroSession['status']
  ): Promise<PomodoroSession[]> {
    const sessions = await this.getSessionHistory();
    return sessions.filter((s) => s.status === status);
  }

  /**
   * Get sessions by date range
   *
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Sessions within date range
   */
  async getSessionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<PomodoroSession[]> {
    const sessions = await this.getSessionHistory();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return sessions.filter((s) => {
      const sessionTime = new Date(s.startTime).getTime();
      return sessionTime >= startTime && sessionTime <= endTime;
    });
  }

  /**
   * Get sessions for today
   *
   * @returns Today's sessions
   */
  async getTodaySessions(): Promise<PomodoroSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.getSessionsByDateRange(today, tomorrow);
  }

  /**
   * Get completed sessions count
   *
   * @returns Number of completed sessions
   */
  async getCompletedCount(): Promise<number> {
    const completed = await this.getSessionsByStatus('completed');
    return completed.length;
  }

  /**
   * Delete a session by ID
   *
   * @param id - Session ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteSession(id: string): Promise<boolean> {
    const sessions = await this.getSessionHistory();
    const initialLength = sessions.length;
    const filtered = sessions.filter((s) => s.id !== id);

    if (filtered.length === initialLength) {
      return false; // Session not found
    }

    await this.storageService.set(
      STORAGE_KEYS.SESSIONS,
      filtered,
      z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>
    );

    return true;
  }

  /**
   * Delete all sessions
   *
   * Use with caution - typically for data export/deletion features.
   */
  async deleteAllSessions(): Promise<void> {
    await this.storageService.set(
      STORAGE_KEYS.SESSIONS,
      [],
      z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>,
      { debounce: false }
    );
    await this.clearCurrentSession();
  }

  /**
   * Clean up old sessions to stay within storage limits
   *
   * Keeps the MAX_SESSIONS_HISTORY most recent sessions.
   *
   * @param sessions - Optional sessions array (if already loaded)
   */
  async cleanupOldSessions(
    sessions?: PomodoroSession[]
  ): Promise<void> {
    const allSessions = sessions || (await this.getSessionHistory());

    // Sort by date (newest first) and keep only the limit
    const sorted = allSessions.sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    const toKeep = sorted.slice(0, STORAGE_LIMITS.MAX_SESSIONS_HISTORY);

    await this.storageService.set(
      STORAGE_KEYS.SESSIONS,
      toKeep,
      z.array(PomodoroSessionSchema) as unknown as z.ZodType<PomodoroSession[]>,
      { debounce: false }
    );
  }

  /**
   * Export all sessions as JSON
   *
   * @returns JSON string of all sessions
   */
  async exportSessions(): Promise<string> {
    const sessions = await this.getSessionHistory();
    return JSON.stringify(sessions, null, 2);
  }

  /**
   * Get storage statistics
   *
   * @returns Object with session counts and storage info
   */
  async getStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    activeSessions: number;
    pausedSessions: number;
    hasCurrentSession: boolean;
  }> {
    const sessions = await this.getSessionHistory();
    const currentSession = await this.getCurrentSession();

    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter((s) => s.status === 'completed')
        .length,
      abandonedSessions: sessions.filter((s) => s.status === 'abandoned')
        .length,
      activeSessions: sessions.filter((s) => s.status === 'active').length,
      pausedSessions: sessions.filter((s) => s.status === 'paused').length,
      hasCurrentSession: currentSession !== null,
    };
  }
}
