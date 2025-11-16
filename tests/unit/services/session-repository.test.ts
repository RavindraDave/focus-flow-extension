/**
 * Unit Tests for SessionRepository
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionRepository } from '../../../src/services/session-repository';
import { PomodoroSession } from '../../../src/types/index';

// Mock StorageService
vi.mock('../../../src/services/storage-service');

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let mockStorageService: any;

  const createMockSession = (overrides?: Partial<PomodoroSession>): PomodoroSession => {
    return {
      id: crypto.randomUUID(),
      type: 'work',
      duration: 25,
      startTime: new Date(),
      endTime: undefined,
      taskName: 'Test Task',
      category: 'development',
      status: 'active',
      actualDuration: undefined,
      ...overrides,
    };
  };

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };

    repository = new SessionRepository(mockStorageService);
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const mockSession = createMockSession();
      mockStorageService.get.mockResolvedValue(mockSession);

      const result = await repository.getCurrentSession();

      expect(result).toEqual(mockSession);
      expect(mockStorageService.get).toHaveBeenCalledWith(
        'currentSession',
        expect.anything()
      );
    });

    it('should return null if no current session', async () => {
      mockStorageService.get.mockResolvedValue(null);

      const result = await repository.getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe('saveCurrentSession', () => {
    it('should save current session without debounce', async () => {
      const session = createMockSession();
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.saveCurrentSession(session);

      expect(mockStorageService.set).toHaveBeenCalledWith(
        'currentSession',
        expect.objectContaining({
          id: session.id,
          type: session.type,
          duration: session.duration,
          // Date should be serialized to ISO string
          startTime: expect.any(String),
          status: session.status,
        }),
        expect.anything(),
        { debounce: false }
      );
      // Verify the startTime was serialized to ISO string
      const savedSession = mockStorageService.set.mock.calls[0][1];
      expect(typeof savedSession.startTime).toBe('string');
      expect(savedSession.startTime).toBe(session.startTime.toISOString());
    });
  });

  describe('clearCurrentSession', () => {
    it('should remove current session', async () => {
      mockStorageService.remove.mockResolvedValue(undefined);

      await repository.clearCurrentSession();

      expect(mockStorageService.remove).toHaveBeenCalledWith('currentSession');
    });
  });

  describe('getSessionHistory', () => {
    it('should return all sessions sorted by date (newest first)', async () => {
      const session1 = createMockSession({
        id: '1',
        startTime: new Date('2025-01-01T10:00:00Z'),
      });
      const session2 = createMockSession({
        id: '2',
        startTime: new Date('2025-01-02T10:00:00Z'),
      });
      const session3 = createMockSession({
        id: '3',
        startTime: new Date('2025-01-03T10:00:00Z'),
      });

      mockStorageService.get.mockResolvedValue([session1, session2, session3]);

      const result = await repository.getSessionHistory();

      expect(result[0]!.id).toBe('3'); // Newest first
      expect(result[1]!.id).toBe('2');
      expect(result[2]!.id).toBe('1');
    });

    it('should return limited sessions when limit specified', async () => {
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createMockSession({
          id: `${i}`,
          startTime: new Date(`2025-01-${i + 1}T10:00:00Z`),
        })
      );

      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.getSessionHistory(5);

      expect(result.length).toBe(5);
    });

    it('should return empty array if no sessions', async () => {
      mockStorageService.get.mockResolvedValue(null);

      const result = await repository.getSessionHistory();

      expect(result).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('should add session to history', async () => {
      const existingSessions = [createMockSession({ id: '1' })];
      const newSession = createMockSession({ id: '2' });

      mockStorageService.get.mockResolvedValue(existingSessions);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addToHistory(newSession);

      // Verify the sessions are saved with serialized dates
      const savedSessions = mockStorageService.set.mock.calls[0][1];
      expect(savedSessions.length).toBe(2);
      expect(savedSessions[0].id).toBe('2'); // New session first
      expect(savedSessions[1].id).toBe('1');
      // Verify startTime was serialized to ISO string
      expect(typeof savedSessions[0].startTime).toBe('string');
      expect(typeof savedSessions[1].startTime).toBe('string');
    });

    it('should trigger cleanup when exceeding limit', async () => {
      // Create 1001 sessions (1 over limit)
      const existingSessions = Array.from({ length: 1000 }, (_, i) =>
        createMockSession({ id: `${i}` })
      );
      const newSession = createMockSession({ id: 'new' });

      mockStorageService.get.mockResolvedValue(existingSessions);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.addToHistory(newSession);

      // Should save with limit enforced
      const savedSessions = mockStorageService.set.mock.calls[0][1];
      expect(savedSessions.length).toBe(1000); // MAX_SESSIONS_HISTORY
    });
  });

  describe('updateSession', () => {
    it('should update existing session', async () => {
      const session = createMockSession({ id: '1', status: 'active' });
      mockStorageService.get.mockResolvedValue([session]);
      mockStorageService.set.mockResolvedValue(undefined);

      await repository.updateSession('1', { status: 'completed' });

      const savedSessions = mockStorageService.set.mock.calls[0][1];
      expect(savedSessions[0].status).toBe('completed');
    });

    it('should throw error if session not found', async () => {
      mockStorageService.get.mockResolvedValue([]);

      await expect(
        repository.updateSession('nonexistent', { status: 'completed' })
      ).rejects.toThrow('Session not found');
    });
  });

  describe('findById', () => {
    it('should find session by ID', async () => {
      const session1 = createMockSession({ id: '1' });
      const session2 = createMockSession({ id: '2' });

      mockStorageService.get.mockResolvedValue([session1, session2]);

      const result = await repository.findById('2');

      expect(result).toEqual(session2);
    });

    it('should return null if not found', async () => {
      mockStorageService.get.mockResolvedValue([createMockSession({ id: '1' })]);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('getSessionsByStatus', () => {
    it('should filter sessions by status', async () => {
      const sessions = [
        createMockSession({ id: '1', status: 'completed' }),
        createMockSession({ id: '2', status: 'abandoned' }),
        createMockSession({ id: '3', status: 'completed' }),
      ];

      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.getSessionsByStatus('completed');

      expect(result.length).toBe(2);
      expect(result.every((s) => s.status === 'completed')).toBe(true);
    });
  });

  describe('getSessionsByDateRange', () => {
    it('should return sessions within date range', async () => {
      const sessions = [
        createMockSession({
          id: '1',
          startTime: new Date('2025-01-01T10:00:00Z'),
        }),
        createMockSession({
          id: '2',
          startTime: new Date('2025-01-05T10:00:00Z'),
        }),
        createMockSession({
          id: '3',
          startTime: new Date('2025-01-10T10:00:00Z'),
        }),
      ];

      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.getSessionsByDateRange(
        new Date('2025-01-04'),
        new Date('2025-01-11')
      );

      expect(result.length).toBe(2);
      expect(result.map((s) => s.id).sort()).toEqual(['2', '3']); // Order-agnostic
    });
  });

  describe('getTodaySessions', () => {
    it('should return only today\'s sessions', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({ id: '1', startTime: today }),
        createMockSession({ id: '2', startTime: yesterday }),
      ];

      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.getTodaySessions();

      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe('1');
    });
  });

  describe('getCompletedCount', () => {
    it('should count completed sessions', async () => {
      const sessions = [
        createMockSession({ status: 'completed' }),
        createMockSession({ status: 'completed' }),
        createMockSession({ status: 'abandoned' }),
      ];

      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.getCompletedCount();

      expect(result).toBe(2);
    });
  });

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      const sessions = [
        createMockSession({ id: '1' }),
        createMockSession({ id: '2' }),
      ];

      mockStorageService.get.mockResolvedValue(sessions);
      mockStorageService.set.mockResolvedValue(undefined);

      const result = await repository.deleteSession('1');

      expect(result).toBe(true);
      const savedSessions = mockStorageService.set.mock.calls[0][1];
      expect(savedSessions.length).toBe(1);
      expect(savedSessions[0].id).toBe('2');
    });

    it('should return false if session not found', async () => {
      mockStorageService.get.mockResolvedValue([]);

      const result = await repository.deleteSession('999');

      expect(result).toBe(false);
    });
  });

  describe('deleteAllSessions', () => {
    it('should delete all sessions and clear current session', async () => {
      mockStorageService.set.mockResolvedValue(undefined);
      mockStorageService.remove.mockResolvedValue(undefined);

      await repository.deleteAllSessions();

      expect(mockStorageService.set).toHaveBeenCalledWith(
        'sessions',
        [],
        expect.anything(),
        { debounce: false }
      );
      expect(mockStorageService.remove).toHaveBeenCalledWith('currentSession');
    });
  });

  describe('exportSessions', () => {
    it('should export sessions as JSON', async () => {
      const sessions = [createMockSession({ id: '1' })];
      mockStorageService.get.mockResolvedValue(sessions);

      const result = await repository.exportSessions();

      expect(result).toContain('"id": "1"');
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return session statistics', async () => {
      const sessions = [
        createMockSession({ status: 'completed' }),
        createMockSession({ status: 'completed' }),
        createMockSession({ status: 'abandoned' }),
        createMockSession({ status: 'active' }),
        createMockSession({ status: 'paused' }),
      ];

      mockStorageService.get.mockResolvedValueOnce(sessions); // For getSessionHistory
      mockStorageService.get.mockResolvedValueOnce(createMockSession()); // For getCurrentSession

      const result = await repository.getStats();

      expect(result.totalSessions).toBe(5);
      expect(result.completedSessions).toBe(2);
      expect(result.abandonedSessions).toBe(1);
      expect(result.activeSessions).toBe(1);
      expect(result.pausedSessions).toBe(1);
      expect(result.hasCurrentSession).toBe(true);
    });
  });
});
