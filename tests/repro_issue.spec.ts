
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockerEngine } from '../src/background/blocker-engine';
import { BlockRule } from '../src/types/index';

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
} as any;

global.chrome = mockChrome;

describe('BlockerEngine Rule Generation Repro', () => {
    let engine: BlockerEngine;

    beforeEach(() => {
        // Correct constructor usage: repo, settings, analytics
        engine = new BlockerEngine(
            mockBlockRuleRepository as any,
            mockSettingsRepository as any,
            mockAnalyticsTracker as any
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
