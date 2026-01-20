
/**
 * Validation Script for Release Readiness
 * 
 * Verifies:
 * 1. Block Rule Limits (Free vs Premium)
 * 2. Schedule Limits (Free vs Premium)
 * 3. Premium Feature Gating
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleRepository } from '../src/services/schedule-repository';
import { BlockRuleRepository } from '../src/features/blocking/block-rule-repository';
import { SettingsRepository } from '../src/services/settings-repository';
import { ERROR_MESSAGES } from '../src/utils/constants';

// Mock storage
const mockStorage = new Map();

vi.mock('../src/services/storage-service', () => {
    class MockStorageService {
        async get(key: string) {
            return mockStorage.get(key);
        }
        async set(key: string, value: any) {
            mockStorage.set(key, value);
        }
    }

    return {
        StorageService: MockStorageService,
        storageService: new MockStorageService(),
        StorageError: class extends Error {
            constructor(message: string, public code: string) {
                super(message);
            }
        }
    };
});

describe('Release Readiness Validation', () => {
    let scheduleRepo: ScheduleRepository;
    let blockRuleRepo: BlockRuleRepository;
    let settingsRepo: SettingsRepository;

    beforeEach(async () => {
        mockStorage.clear();
        scheduleRepo = new ScheduleRepository();
        blockRuleRepo = new BlockRuleRepository();
        settingsRepo = new SettingsRepository();

        // Reset storage with empty arrays
        mockStorage.set('blockRules', []);
        mockStorage.set('schedules', []);
        mockStorage.set('settings', {
            premiumLicenseKey: undefined,
            youtubeControls: { enabled: false },
            nuclearMode: { active: false }
        });
    });

    describe('Block Rule Limits', () => {
        it('should enforce 5 rule limit for free users', async () => {
            // Add 5 rules
            for (let i = 0; i < 5; i++) {
                await blockRuleRepo.save({
                    id: `rule-${i}`,
                    name: `Rule ${i}`,
                    pattern: `test${i}.com`,
                    type: 'domain',
                    enabled: true,
                    allowance: 0,
                    timeUsedToday: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, false); // isPremium = false
            }

            // Try to add 6th rule
            await expect(blockRuleRepo.save({
                id: 'rule-6',
                name: 'Rule 6',
                pattern: 'test6.com',
                type: 'domain',
                enabled: true,
                allowance: 0,
                timeUsedToday: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }, false)).rejects.toThrow(ERROR_MESSAGES.MAX_BLOCK_RULES_REACHED);
        });

        it('should allow unlimited rules for premium users', async () => {
            // Add 5 rules
            for (let i = 0; i < 5; i++) {
                await blockRuleRepo.save({
                    id: `rule-${i}`,
                    name: `Rule ${i}`,
                    pattern: `test${i}.com`,
                    type: 'domain',
                    enabled: true,
                    allowance: 0,
                    timeUsedToday: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, true); // isPremium = true
            }

            // Try to add 6th rule - should match
            await expect(blockRuleRepo.save({
                id: 'rule-6',
                name: 'Rule 6',
                pattern: 'test6.com',
                type: 'domain',
                enabled: true,
                allowance: 0,
                timeUsedToday: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            }, true)).resolves.not.toThrow();
        });
    });

    describe('Schedule Limits', () => {
        it('should enforce 1 schedule limit for free users', async () => {
            // Add 1 schedule
            await scheduleRepo.addSchedule({
                id: 'sched-1',
                name: 'Schedule 1',
                enabled: true,
                daysOfWeek: ['monday'],
                startTime: '09:00',
                endTime: '17:00',
                blockRuleIds: [],
                timezone: 'UTC',
                exceptions: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }, false); // isPremium = false

            // Try to add 2nd schedule
            await expect(scheduleRepo.addSchedule({
                id: 'sched-2',
                name: 'Schedule 2',
                enabled: true,
                daysOfWeek: ['tuesday'],
                startTime: '09:00',
                endTime: '17:00',
                blockRuleIds: [],
                timezone: 'UTC',
                exceptions: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }, false)).rejects.toThrow(ERROR_MESSAGES.MAX_SCHEDULES_REACHED || 'Maximum schedules reached. Upgrade to premium for more schedules.');
        });
    });

    describe('Premium Feature Gating', () => {
        it('should identify free users correctly', async () => {
            const isPremium = await settingsRepo.isPremium();
            expect(isPremium).toBe(false);
        });

        it('should identify premium users correctly', async () => {
            await settingsRepo.setPremiumLicense('valid-key');
            const isPremium = await settingsRepo.isPremium();
            expect(isPremium).toBe(true);
        });
    });
});
