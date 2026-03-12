/**
 * Unit Tests for BlockerEngine
 * Target: ≥80% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockerEngine, BlockerError } from '../../../src/background/blocker-engine';
import { BlockRule } from '../../../src/types/index';

// Mock repositories
vi.mock('../../../src/services/block-rule-repository');
vi.mock('../../../src/background/analytics-tracker');

// Mock Chrome APIs
const mockChrome = {
  declarativeNetRequest: {
    getDynamicRules: vi.fn(),
    updateDynamicRules: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test${path}`),
  },
};

global.chrome = mockChrome as any;

describe('BlockerEngine', () => {
  let engine: BlockerEngine;
  let mockBlockRuleRepository: any;
  let mockSettingsRepository: any;
  let mockAnalyticsTracker: any;

  const createMockRule = (overrides?: Partial<BlockRule>): BlockRule => {
    return {
      id: crypto.randomUUID(),
      name: 'Test Rule',
      pattern: 'example.com',
      type: 'domain',
      enabled: true,
      allowance: null,
      timeUsedToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  beforeEach(() => {
    mockBlockRuleRepository = {
      getActiveRules: vi.fn(),
      getAllRules: vi.fn(),
    };

    mockAnalyticsTracker = {
      trackBlockedAttempt: vi.fn(),
    };

    mockSettingsRepository = {
      getSettings: vi.fn().mockResolvedValue({ blockingMode: 'blacklist' }),
    };

    engine = new BlockerEngine(
      mockBlockRuleRepository,
      mockSettingsRepository,
      mockAnalyticsTracker
    );

    // Reset Chrome API mocks
    mockChrome.declarativeNetRequest.getDynamicRules.mockResolvedValue([]);
    mockChrome.declarativeNetRequest.updateDynamicRules.mockResolvedValue(undefined);
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);

    vi.clearAllMocks();
  });

  describe('syncRules', () => {
    it('should sync block rules to Chrome declarativeNetRequest', async () => {
      const rules = [
        createMockRule({ pattern: 'youtube.com', name: 'YouTube' }),
        createMockRule({ pattern: 'facebook.com', name: 'Facebook' }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.syncRules();

      expect(mockChrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [],
        addRules: expect.arrayContaining([
          expect.objectContaining({
            id: 1000,
            condition: {
              urlFilter: '||youtube.com^',
              resourceTypes: ['main_frame'],
            },
            action: {
              type: 'redirect',
              redirect: {
                url: expect.stringContaining('blocked.html'),
              },
            },
          }),
          expect.objectContaining({
            id: 1001,
            condition: {
              urlFilter: '||facebook.com^',
              resourceTypes: ['main_frame'],
            },
            action: {
              type: 'redirect',
              redirect: {
                url: expect.stringContaining('blocked.html'),
              },
            },
          }),
        ]),
      });
    });

    it('should remove existing rules before adding new ones', async () => {
      const existingRules = [{ id: 1000 }, { id: 1001 }];
      mockChrome.declarativeNetRequest.getDynamicRules.mockResolvedValue(existingRules);

      const rules = [createMockRule({ pattern: 'example.com' })];
      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.syncRules();

      expect(mockChrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [1000, 1001],
        addRules: expect.any(Array),
      });
    });

    it('should handle URL type rules', async () => {
      const rules = [
        createMockRule({
          type: 'url',
          pattern: '*://example.com/distracting/*',
        }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.syncRules();

      const call = mockChrome.declarativeNetRequest.updateDynamicRules.mock.calls[0][0];
      expect(call.addRules[0].condition.urlFilter).toBe('*://example.com/distracting/*');
    });

    it('should throw error if too many rules', async () => {
      // Create 9000 rules (exceeds max of 9000)
      const rules = Array(9001)
        .fill(null)
        .map((_, i) => createMockRule({ pattern: `example${i}.com` }));

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await expect(engine.syncRules()).rejects.toThrow(BlockerError);
      await expect(engine.syncRules()).rejects.toThrow('Exceeded maximum number');
    });
  });

  describe('enableBlocking / disableBlocking', () => {
    it('should enable blocking and sync rules', async () => {
      const rules = [createMockRule({ pattern: 'youtube.com' })];
      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.enableBlocking();

      expect(engine.isActive()).toBe(true);
      expect(mockChrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalled();
    });

    it('should disable blocking and remove all dynamic rules', async () => {
      // Setup: Enable blocking first
      const rules = [createMockRule({ pattern: 'youtube.com' })];
      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);
      await engine.enableBlocking();

      // Mock existing rules
      mockChrome.declarativeNetRequest.getDynamicRules.mockResolvedValue([
        { id: 1000 },
        { id: 1001 },
      ]);

      // Disable blocking
      await engine.disableBlocking();

      expect(engine.isActive()).toBe(false);
      expect(mockChrome.declarativeNetRequest.updateDynamicRules).toHaveBeenLastCalledWith({
        removeRuleIds: [1000, 1001],
        addRules: [],
      });
    });

    it('should handle disable when no rules exist', async () => {
      mockChrome.declarativeNetRequest.getDynamicRules.mockResolvedValue([]);

      await engine.disableBlocking();

      expect(engine.isActive()).toBe(false);
      // Should not call update if no rules to remove
      expect(mockChrome.declarativeNetRequest.updateDynamicRules).not.toHaveBeenCalled();
    });

    it('should start with blocking disabled', () => {
      expect(engine.isActive()).toBe(false);
    });
  });

  describe('checkAllowance', () => {
    it('should return allowance status for domain with allowance', async () => {
      const rules = [
        createMockRule({
          pattern: 'youtube.com',
          allowance: 30, // 30 minutes
        }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);
      mockChrome.storage.local.get.mockResolvedValue({});

      const result = await engine.checkAllowance('youtube.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30);
    });

    it('should return no allowance for domain without allowance rule', async () => {
      mockBlockRuleRepository.getActiveRules.mockResolvedValue([]);

      const result = await engine.checkAllowance('example.com');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should calculate remaining time correctly', async () => {
      const rules = [
        createMockRule({
          pattern: 'youtube.com',
          allowance: 30,
        }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      // Existing allowance with 10 minutes used
      mockChrome.storage.local.get.mockResolvedValue({
        domain_allowances: [
          {
            domain: 'youtube.com',
            totalMinutes: 30,
            usedMinutes: 10,
            lastReset: new Date(),
          },
        ],
      });

      const result = await engine.checkAllowance('youtube.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(20); // 30 - 10
    });

    it('should return not allowed when allowance exhausted', async () => {
      const rules = [
        createMockRule({
          pattern: 'youtube.com',
          allowance: 30,
        }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      // Allowance fully used
      mockChrome.storage.local.get.mockResolvedValue({
        domain_allowances: [
          {
            domain: 'youtube.com',
            totalMinutes: 30,
            usedMinutes: 30,
            lastReset: new Date(),
          },
        ],
      });

      const result = await engine.checkAllowance('youtube.com');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('trackTimeUsed', () => {
    it('should track time used for domain', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        domain_allowances: [
          {
            domain: 'youtube.com',
            totalMinutes: 30,
            usedMinutes: 10,
            lastReset: new Date(),
          },
        ],
      });

      await engine.trackTimeUsed('youtube.com', 300); // 5 minutes = 300 seconds

      const savedData = mockChrome.storage.local.set.mock.calls[0][0];
      expect(savedData.domain_allowances[0].usedMinutes).toBe(15); // 10 + 5
    });

    it('should do nothing for domain without allowance', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        domain_allowances: [],
      });

      await engine.trackTimeUsed('example.com', 300);

      // Should not save anything
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('resetDailyAllowances', () => {
    it('should reset all allowances to configured limits', async () => {
      const rules = [
        createMockRule({ pattern: 'youtube.com', allowance: 30 }),
        createMockRule({ pattern: 'reddit.com', allowance: 15 }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.resetDailyAllowances();

      const savedData = mockChrome.storage.local.set.mock.calls[0][0];
      expect(savedData.domain_allowances).toHaveLength(2);
      expect(savedData.domain_allowances[0]).toMatchObject({
        domain: 'youtube.com',
        totalMinutes: 30,
        usedMinutes: 0,
      });
      expect(savedData.domain_allowances[1]).toMatchObject({
        domain: 'reddit.com',
        totalMinutes: 15,
        usedMinutes: 0,
      });
    });

    it('should only reset domains with allowances', async () => {
      const rules = [
        createMockRule({ pattern: 'facebook.com', allowance: null }),
        createMockRule({ pattern: 'youtube.com', allowance: 30 }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.resetDailyAllowances();

      const savedData = mockChrome.storage.local.set.mock.calls[0][0];
      expect(savedData.domain_allowances).toHaveLength(1);
      expect(savedData.domain_allowances[0].domain).toBe('youtube.com');
    });
  });

  describe('handleBlockedAttempt', () => {
    it('should track blocked attempt when blocking is active', async () => {
      // Setup rules for enableBlocking
      const rules = [createMockRule({ pattern: 'youtube.com' })];
      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.enableBlocking();
      engine.handleBlockedAttempt('youtube.com');

      expect(mockAnalyticsTracker.trackBlockedAttempt).toHaveBeenCalled();
    });

    it('should not track when blocking is disabled', async () => {
      await engine.disableBlocking();
      engine.handleBlockedAttempt('youtube.com');

      expect(mockAnalyticsTracker.trackBlockedAttempt).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return blocking statistics', async () => {
      const allRules = [
        createMockRule({ enabled: true }),
        createMockRule({ enabled: false }),
        createMockRule({ enabled: true }),
      ];

      const activeRules = allRules.filter(r => r.enabled);

      mockBlockRuleRepository.getAllRules.mockResolvedValue(allRules);
      mockBlockRuleRepository.getActiveRules.mockResolvedValue(activeRules);

      mockChrome.storage.local.get.mockResolvedValue({
        domain_allowances: [
          {
            domain: 'youtube.com',
            totalMinutes: 30,
            usedMinutes: 10,
            lastReset: new Date(),
          },
        ],
      });

      await engine.enableBlocking();

      const stats = await engine.getStats();

      expect(stats.totalRules).toBe(3);
      expect(stats.activeRules).toBe(2);
      expect(stats.isBlocking).toBe(true);
      expect(stats.allowances).toHaveLength(1);
      expect(stats.allowances[0]).toEqual({
        domain: 'youtube.com',
        remaining: 20, // 30 - 10
      });
    });
  });

  describe('Rule Conversion', () => {
    it('should include domain in redirect URL', async () => {
      const rules = [
        createMockRule({
          pattern: 'youtube.com',
          name: 'YouTube Block',
        }),
      ];

      mockBlockRuleRepository.getActiveRules.mockResolvedValue(rules);

      await engine.syncRules();

      const call = mockChrome.declarativeNetRequest.updateDynamicRules.mock.calls[0][0];
      const redirectUrl = call.addRules[0].action.redirect.url;

      expect(redirectUrl).toContain('blocked.html');
      expect(redirectUrl).toContain('domain=youtube.com');
      expect(redirectUrl).toContain('name=YouTube%20Block');
    });

  });
});
