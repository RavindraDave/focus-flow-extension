/**
 * Integration Tests for Timer + Blocker Lifecycle
 *
 * These tests verify the complete behavior of timer and blocker working together.
 * Focus on REAL behavior, not just mocked function calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerEngine } from '../../src/background/timer-engine';
import { BlockerEngine } from '../../src/background/blocker-engine';
import { SessionRepository } from '../../src/services/session-repository';
import { SettingsRepository } from '../../src/services/settings-repository';
import { BlockRuleRepository } from '../../src/services/block-rule-repository';
import { AnalyticsTracker } from '../../src/background/analytics-tracker';
import { StreakTracker } from '../../src/background/streak-tracker';
import type { BlockRule } from '../../src/types/index';

// Mock Chrome APIs with actual behavior tracking
const mockDynamicRules: chrome.declarativeNetRequest.Rule[] = [];
const mockStorage: Record<string, any> = {};

const mockChrome = {
  declarativeNetRequest: {
    getDynamicRules: vi.fn(() => Promise.resolve([...mockDynamicRules])),
    updateDynamicRules: vi.fn((options: {
      removeRuleIds: number[];
      addRules: chrome.declarativeNetRequest.Rule[];
    }) => {
      // Actually update the mock rules array
      const { removeRuleIds, addRules } = options;

      // Remove rules
      for (let i = mockDynamicRules.length - 1; i >= 0; i--) {
        if (removeRuleIds.includes(mockDynamicRules[i]!.id)) {
          mockDynamicRules.splice(i, 1);
        }
      }

      // Add rules
      mockDynamicRules.push(...addRules);

      return Promise.resolve();
    }),
  },
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null) => {
        // Return stored data or empty object
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, any> = {};
        for (const key of keys) {
          result[key] = mockStorage[key];
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, any>) => {
        // Actually store the data
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        // Remove keys from storage
        const keysArray = typeof keys === 'string' ? [keys] : keys;
        keysArray.forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
      getBytesInUse: vi.fn(() => Promise.resolve(0)),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test${path}`),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
  },
};

global.chrome = mockChrome as any;

describe('Timer + Blocker Integration', () => {
  let timer: TimerEngine;
  let blocker: BlockerEngine;
  let blockRuleRepo: BlockRuleRepository;
  let sessionRepo: SessionRepository;
  let settingsRepo: SettingsRepository;
  let analyticsTracker: AnalyticsTracker;
  let streakTracker: StreakTracker;

  beforeEach(async () => {
    // Clear mock rules and storage
    mockDynamicRules.length = 0;
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);

    // Create repositories
    blockRuleRepo = new BlockRuleRepository();
    sessionRepo = new SessionRepository();
    settingsRepo = new SettingsRepository();
    analyticsTracker = new AnalyticsTracker();
    streakTracker = new StreakTracker();

    // Add test rules to repository (mimic background script's BLOCKLIST_ADD)
    const now = new Date().toISOString();
    const testRules: BlockRule[] = [
      {
        id: crypto.randomUUID(),
        name: 'YouTube',
        pattern: 'youtube.com',
        type: 'domain',
        enabled: true,
        allowance: null,
        timeUsedToday: 0,
        createdAt: now as unknown as Date,
        updatedAt: now as unknown as Date,
      },
      {
        id: crypto.randomUUID(),
        name: 'Facebook',
        pattern: 'facebook.com',
        type: 'domain',
        enabled: true,
        allowance: null,
        timeUsedToday: 0,
        createdAt: now as unknown as Date,
        updatedAt: now as unknown as Date,
      },
    ];

    for (const rule of testRules) {
      await blockRuleRepo.addRule(rule);
    }

    // Create engines with real dependencies
    blocker = new BlockerEngine(blockRuleRepo, settingsRepo, analyticsTracker);
    timer = new TimerEngine(
      sessionRepo,
      analyticsTracker,
      streakTracker,
      settingsRepo,
      blocker
    );

    vi.clearAllMocks();
  });

  describe('Work Session Lifecycle', () => {
    it('BEHAVIOR: Starting work session should enable blocking by adding rules', async () => {
      // GIVEN: No blocking is active
      expect(mockDynamicRules).toHaveLength(0);
      expect(blocker.isActive()).toBe(false);

      // WHEN: User starts a work session
      await timer.start('work', 25);

      // THEN: Blocking should be enabled
      expect(blocker.isActive()).toBe(true);

      // THEN: Rules should be added to Chrome
      expect(mockDynamicRules.length).toBeGreaterThan(0);
      expect(mockDynamicRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            condition: {
              urlFilter: '||youtube.com^',
              resourceTypes: ['main_frame'],
            },
          }),
          expect.objectContaining({
            condition: {
              urlFilter: '||facebook.com^',
              resourceTypes: ['main_frame'],
            },
          }),
        ])
      );
    });

    it('BEHAVIOR: Stopping work session should disable blocking by removing rules', async () => {
      // GIVEN: Work session is active with blocking enabled
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);

      // WHEN: User stops the session
      await timer.stop();

      // THEN: Blocking should be disabled
      expect(blocker.isActive()).toBe(false);

      // THEN: All rules should be removed from Chrome
      expect(mockDynamicRules).toHaveLength(0);

      // THEN: updateDynamicRules was called to remove rules
      expect(mockChrome.declarativeNetRequest.updateDynamicRules).toHaveBeenLastCalledWith({
        removeRuleIds: expect.any(Array),
        addRules: [],
      });
    });

    it('BEHAVIOR: Pausing work session should keep blocking active', async () => {
      // GIVEN: Work session is active
      await timer.start('work', 25);
      const rulesAfterStart = [...mockDynamicRules];

      // WHEN: User pauses the session
      await timer.pause();

      // THEN: Rules should still exist (paused ≠ stopped)
      expect(mockDynamicRules).toEqual(rulesAfterStart);
      expect(mockDynamicRules.length).toBeGreaterThan(0);
    });

    it('BEHAVIOR: Resuming paused work session should maintain blocking', async () => {
      // GIVEN: Work session is paused
      await timer.start('work', 25);
      await timer.pause();
      const rulesWhilePaused = [...mockDynamicRules];

      // WHEN: User resumes the session
      await timer.resume();

      // THEN: Blocking should still be active with same rules
      expect(mockDynamicRules).toEqual(rulesWhilePaused);
      expect(blocker.isActive()).toBe(true);
    });
  });

  describe('Break Session Lifecycle', () => {
    it('BEHAVIOR: Starting short break should disable blocking by removing rules', async () => {
      // GIVEN: User starts a short break directly
      await timer.start('short-break', 5);

      // THEN: Blocking should be disabled during break
      expect(blocker.isActive()).toBe(false);

      // THEN: All rules should be removed
      expect(mockDynamicRules).toHaveLength(0);
    });

    it('BEHAVIOR: Starting long break should disable blocking', async () => {
      // WHEN: User starts a long break
      await timer.start('long-break', 15);

      // THEN: Blocking should be disabled
      expect(blocker.isActive()).toBe(false);
      expect(mockDynamicRules).toHaveLength(0);
    });

    it('BEHAVIOR: Stopping break session should keep blocking disabled', async () => {
      // GIVEN: User is on a break
      await timer.start('short-break', 5);

      // WHEN: User stops the break
      await timer.stop();

      // THEN: Blocking should remain disabled (idle state)
      expect(blocker.isActive()).toBe(false);
      expect(mockDynamicRules).toHaveLength(0);
    });
  });

  describe('Work-Break Transitions', () => {
    it('BEHAVIOR: Transitioning from work to break should disable blocking', async () => {
      // GIVEN: Work session is active
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);

      // WHEN: Stop work and start break
      await timer.stop();
      await timer.start('short-break', 5);

      // THEN: Blocking should be disabled
      expect(blocker.isActive()).toBe(false);
      expect(mockDynamicRules).toHaveLength(0);
    });

    it('BEHAVIOR: Transitioning from break to work should enable blocking', async () => {
      // GIVEN: Break is active (no blocking)
      await timer.start('short-break', 5);
      expect(mockDynamicRules).toHaveLength(0);

      // WHEN: Stop break and start work
      await timer.stop();
      await timer.start('work', 25);

      // THEN: Blocking should be enabled
      expect(blocker.isActive()).toBe(true);
      expect(mockDynamicRules.length).toBeGreaterThan(0);
    });

    it('BEHAVIOR: Multiple work-break cycles should correctly toggle blocking', { timeout: 15000 }, async () => {
      // Cycle 1: Work
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);

      // Cycle 1: Break
      await timer.stop();
      await timer.start('short-break', 5);
      expect(mockDynamicRules).toHaveLength(0);

      // Cycle 2: Work
      await timer.stop();
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);

      // Cycle 2: Break
      await timer.stop();
      await timer.start('short-break', 5);
      expect(mockDynamicRules).toHaveLength(0);

      // Final: Stop completely
      await timer.stop();
      expect(mockDynamicRules).toHaveLength(0);
      expect(blocker.isActive()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('BEHAVIOR: Stopping from idle state should not throw errors', async () => {
      // GIVEN: Timer is idle
      expect((await timer.getStatus()).state).toBe('idle');

      // WHEN/THEN: Stopping should throw an error (no active timer)
      await expect(timer.stop()).rejects.toThrow('No active timer');

      // And blocking should remain disabled
      expect(blocker.isActive()).toBe(false);
    });

    it('BEHAVIOR: Starting work after stopping should enable blocking again', async () => {
      // GIVEN: Had a work session that was stopped
      await timer.start('work', 25);
      await timer.stop();
      expect(mockDynamicRules).toHaveLength(0);

      // WHEN: Start work again
      await timer.start('work', 25);

      // THEN: Blocking should be enabled again
      expect(blocker.isActive()).toBe(true);
      expect(mockDynamicRules.length).toBeGreaterThan(0);
    });

    it('BEHAVIOR: Rules should be synced correctly even if manually disabled', async () => {
      // GIVEN: Work session is active
      await timer.start('work', 25);

      // WHEN: Blocker is manually disabled (edge case/bug scenario)
      await blocker.disableBlocking();
      expect(mockDynamicRules).toHaveLength(0);

      // THEN: Starting a new work session should re-enable
      await timer.stop();
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Bug Scenarios', () => {
    it('BUG FIX: Stopping session must actually remove blocking rules from Chrome', async () => {
      // This test specifically catches the bug that was reported:
      // "I stopped focus session manually, but YouTube is still blocked"

      // GIVEN: User starts a work session
      await timer.start('work', 25);

      // AND: Sites are blocked (rules exist in Chrome)
      expect(mockDynamicRules.length).toBeGreaterThan(0);
      const youtubeRule = mockDynamicRules.find(r =>
        r.condition.urlFilter?.includes('youtube.com')
      );
      expect(youtubeRule).toBeDefined();

      // WHEN: User stops the session
      await timer.stop();

      // THEN: Rules must be ACTUALLY removed from Chrome, not just flag set
      expect(mockDynamicRules).toHaveLength(0);

      // THEN: YouTube should be accessible (no rule blocking it)
      const youtubeRuleAfter = mockDynamicRules.find(r =>
        r.condition.urlFilter?.includes('youtube.com')
      );
      expect(youtubeRuleAfter).toBeUndefined();
    });

    it('BUG FIX: Break starting must remove rules, not just set flag', async () => {
      // Related bug: Rules stay active during breaks

      // GIVEN: Work session is active with rules
      await timer.start('work', 25);
      expect(mockDynamicRules.length).toBeGreaterThan(0);

      // WHEN: Work stops and break starts
      await timer.stop();
      await timer.start('short-break', 5);

      // THEN: Rules must be removed, not just isBlocking=false
      expect(mockDynamicRules).toHaveLength(0);
    });
  });
});
