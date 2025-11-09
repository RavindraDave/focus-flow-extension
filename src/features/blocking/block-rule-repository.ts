/**
 * Block Rule Repository
 * Focus Flow Extension
 *
 * Repository pattern for BlockRule data access.
 * All storage access goes through StorageService with validation.
 */

import { storageService, StorageError } from '../../services/storage-service';
import { BlockRuleSchema } from '../../types/schemas';
import { STORAGE_KEYS, STORAGE_LIMITS, ERROR_MESSAGES } from '../../utils/constants';
import type { BlockRule } from '../../types';
import { z } from 'zod';

/**
 * Repository for managing block rules
 */
export class BlockRuleRepository {
  /**
   * Get all block rules
   *
   * @returns Array of block rules (empty if none exist)
   */
  async findAll(): Promise<BlockRule[]> {
    const rules = await storageService.get(
      STORAGE_KEYS.BLOCK_RULES,
      z.array(BlockRuleSchema)
    );

    return rules ?? [];
  }

  /**
   * Find a block rule by ID
   *
   * @param id - Block rule UUID
   * @returns Block rule or null if not found
   */
  async findById(id: string): Promise<BlockRule | null> {
    const rules = await this.findAll();
    const rule = rules.find((r) => r.id === id);
    return rule ?? null;
  }

  /**
   * Find all enabled block rules
   *
   * @returns Array of enabled block rules
   */
  async findByEnabled(): Promise<BlockRule[]> {
    const rules = await this.findAll();
    return rules.filter((r) => r.enabled);
  }

  /**
   * Find block rules by pattern match
   *
   * @param searchPattern - Pattern to search for
   * @returns Array of matching block rules
   */
  async findByPattern(searchPattern: string): Promise<BlockRule[]> {
    const rules = await this.findAll();
    return rules.filter((r) =>
      r.pattern.toLowerCase().includes(searchPattern.toLowerCase())
    );
  }

  /**
   * Save a block rule (create or update)
   *
   * If rule.id exists in storage, updates it.
   * Otherwise, creates a new rule.
   *
   * @param rule - Block rule to save
   * @param isPremium - Whether user has premium tier
   * @throws {StorageError} If validation fails or quota exceeded
   */
  async save(rule: BlockRule, isPremium: boolean = false): Promise<void> {
    const rules = await this.findAll();

    // Check tier limits for new rules
    const existingIndex = rules.findIndex((r) => r.id === rule.id);
    const isNewRule = existingIndex === -1;

    if (isNewRule) {
      const maxRules = isPremium
        ? STORAGE_LIMITS.MAX_BLOCK_RULES_PREMIUM
        : STORAGE_LIMITS.MAX_BLOCK_RULES_FREE;

      if (rules.length >= maxRules) {
        throw new StorageError(
          ERROR_MESSAGES.MAX_BLOCK_RULES_REACHED,
          'VALIDATION_FAILED' as any
        );
      }
    }

    // Update or add rule
    if (existingIndex !== -1) {
      rules[existingIndex] = rule;
    } else {
      rules.push(rule);
    }

    // Save to storage with validation
    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      rules,
      z.array(BlockRuleSchema)
    );
  }

  /**
   * Delete a block rule by ID
   *
   * @param id - Block rule UUID to delete
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const rules = await this.findAll();
    const filteredRules = rules.filter((r) => r.id !== id);

    // If no rules were removed, return false
    if (filteredRules.length === rules.length) {
      return false;
    }

    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      filteredRules,
      z.array(BlockRuleSchema)
    );

    return true;
  }

  /**
   * Delete all block rules
   */
  async deleteAll(): Promise<void> {
    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      [],
      z.array(BlockRuleSchema)
    );
  }

  /**
   * Update time used for a block rule
   *
   * @param id - Block rule UUID
   * @param minutes - Minutes to add to time used
   */
  async updateTimeUsed(id: string, minutes: number): Promise<void> {
    const rules = await this.findAll();
    const ruleIndex = rules.findIndex((r) => r.id === id);

    if (ruleIndex === -1) {
      throw new StorageError(
        `Block rule with ID ${id} not found`,
        'NOT_FOUND' as any
      );
    }

    const rule = rules[ruleIndex];
    rule.timeUsedToday = Math.min(
      rule.timeUsedToday + minutes,
      rule.allowance ?? 1440
    );
    rule.updatedAt = new Date();

    rules[ruleIndex] = rule;

    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      rules,
      z.array(BlockRuleSchema)
    );
  }

  /**
   * Reset daily time used for all rules
   * Should be called at midnight
   */
  async resetDailyTimeUsed(): Promise<void> {
    const rules = await this.findAll();

    const updatedRules = rules.map((rule) => ({
      ...rule,
      timeUsedToday: 0,
      updatedAt: new Date(),
    }));

    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      updatedRules,
      z.array(BlockRuleSchema)
    );
  }

  /**
   * Toggle enabled state for a block rule
   *
   * @param id - Block rule UUID
   * @returns New enabled state
   */
  async toggleEnabled(id: string): Promise<boolean> {
    const rules = await this.findAll();
    const ruleIndex = rules.findIndex((r) => r.id === id);

    if (ruleIndex === -1) {
      throw new StorageError(
        `Block rule with ID ${id} not found`,
        'NOT_FOUND' as any
      );
    }

    const rule = rules[ruleIndex];
    rule.enabled = !rule.enabled;
    rule.updatedAt = new Date();

    rules[ruleIndex] = rule;

    await storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      rules,
      z.array(BlockRuleSchema)
    );

    return rule.enabled;
  }

  /**
   * Get total count of block rules
   *
   * @returns Number of block rules
   */
  async count(): Promise<number> {
    const rules = await this.findAll();
    return rules.length;
  }

  /**
   * Check if adding a new rule would exceed tier limit
   *
   * @param isPremium - Whether user has premium tier
   * @returns true if can add more rules
   */
  async canAddMore(isPremium: boolean): Promise<boolean> {
    const currentCount = await this.count();
    const maxRules = isPremium
      ? STORAGE_LIMITS.MAX_BLOCK_RULES_PREMIUM
      : STORAGE_LIMITS.MAX_BLOCK_RULES_FREE;

    return currentCount < maxRules;
  }
}

/**
 * Singleton instance
 */
export const blockRuleRepository = new BlockRuleRepository();
