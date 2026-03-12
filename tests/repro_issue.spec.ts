
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockerEngine } from '../src/background/blocker-engine';
import { BlockRule } from '../src/types/index';
import type { BlockRuleRepository } from '../src/services/block-rule-repository';
import type { SettingsRepository } from '../src/services/settings-repository';
import type { AnalyticsTracker } from '../src/background/analytics-tracker';

// Mock repositories
const mockBlockRuleRepository = {
    getActiveRules: vi.fn(),
    getAllRules: vi.fn(),
};

const mockSettingsRepository = {
    getSettings: vi.fn().mockResolvedValue({ blockingMode: 'blacklist' }),
};

const mockAnalyticsTracker = {
    trackBlockedAttempt: vi.fn(),
};

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

// @ts-expect-error - partial chrome mock for testing
global.chrome = mockChrome;

describe('BlockerEngine Rule Generation Repro', () => {
    let engine: BlockerEngine;

    beforeEach(() => {
        // Correct constructor usage: repo, settings, analytics
        engine = new BlockerEngine(
            mockBlockRuleRepository as unknown as BlockRuleRepository,
            mockSettingsRepository as unknown as SettingsRepository,
            mockAnalyticsTracker as unknown as AnalyticsTracker
        );
        mockChrome.declarativeNetRequest.getDynamicRules.mockResolvedValue([]);
        mockChrome.declarativeNetRequest.updateDynamicRules.mockResolvedValue(undefined);
        mockSettingsRepository.getSettings.mockResolvedValue({ blockingMode: 'blacklist' });
        vi.clearAllMocks();
    });

    const createMockRule = (pattern: string, type: 'domain' | 'keyword' | 'url' = 'domain'): BlockRule => ({
        id: 'test-id',
        name: 'Test Rule',
        pattern,
        type,
        enabled: true,
        allowance: null,
        timeUsedToday: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    it('generates expected failing rule for "youtube"', async () => {
        mockBlockRuleRepository.getActiveRules.mockResolvedValue([createMockRule('youtube')]);

        await engine.syncRules();

        const call = mockChrome.declarativeNetRequest.updateDynamicRules.mock.calls[0][0];
        const rule = call.addRules[0];
        console.log('Rule for "youtube":', rule.condition.urlFilter);
        expect(rule.condition.urlFilter).toBe('||youtube');
    });

    it('generates expected failing rule for "youtube.com"', async () => {
        mockBlockRuleRepository.getActiveRules.mockResolvedValue([createMockRule('youtube.com')]);

        await engine.syncRules();

        const call = mockChrome.declarativeNetRequest.updateDynamicRules.mock.calls[0][0];
        const rule = call.addRules[0];
        console.log('Rule for "youtube.com":', rule.condition.urlFilter);
        expect(rule.condition.urlFilter).toBe('||youtube.com^');
    });
});
