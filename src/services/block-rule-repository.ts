/**
 * BlockRule Repository
 * Focus Flow Extension
 *
 * Manages BlockRule persistence for website blocking.
 */

import { StorageService } from './storage-service';
import { BlockRule } from '../types/index';
import { BlockRuleSchema } from '../types/schemas';
import { STORAGE_KEYS } from '../utils/constants';
import { z } from 'zod';

/**
 * Repository for managing block rules
 *
 * @example
 * ```typescript
 * const repo = new BlockRuleRepository();
 * const activeRules = await repo.getActiveRules();
 * ```
 */
export class BlockRuleRepository {
  private storageService: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService ?? new StorageService();
  }

  /**
   * Serialize a block rule for storage
   *
   * Converts Date objects back to ISO strings for schema validation.
   *
   * @param rule - Rule with possible Date objects
   * @returns Rule with date fields as ISO strings
   * @private
   */
  private serializeRule(rule: BlockRule): BlockRule {
    return {
      ...rule,
      createdAt: (rule.createdAt instanceof Date
        ? rule.createdAt.toISOString()
        : rule.createdAt) as unknown as Date,
      updatedAt: (rule.updatedAt instanceof Date
        ? rule.updatedAt.toISOString()
        : rule.updatedAt) as unknown as Date,
    };
  }

  /**
   * Get all block rules
   *
   * @returns Array of all block rules
   */
  async getAllRules(): Promise<BlockRule[]> {
    const rules =
      (await this.storageService.get(
        STORAGE_KEYS.BLOCK_RULES,
        z.array(BlockRuleSchema) as unknown as z.ZodType<BlockRule[]>
      )) ?? [];

    return rules;
  }

  /**
   * Get only enabled block rules
   *
   * @returns Array of active block rules
   */
  async getActiveRules(): Promise<BlockRule[]> {
    const allRules = await this.getAllRules();
    return allRules.filter(rule => rule.enabled);
  }

  /**
   * Add a new block rule
   *
   * @param rule - Block rule to add
   */
  async addRule(rule: BlockRule): Promise<void> {
    const rules = await this.getAllRules();
    const serialized = this.serializeRule(rule);
    rules.push(serialized);

    // Serialize all rules before saving
    const serializedRules = rules.map(r => this.serializeRule(r));

    await this.storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      serializedRules,
      z.array(BlockRuleSchema) as unknown as z.ZodType<BlockRule[]>
    );
  }

  /**
   * Update an existing block rule
   *
   * @param id - Rule ID to update
   * @param updates - Partial rule data to update
   * @throws Error if rule not found
   */
  async updateRule(id: string, updates: Partial<BlockRule>): Promise<void> {
    const rules = await this.getAllRules();
    const index = rules.findIndex(r => r.id === id);

    if (index === -1) {
      throw new Error(`Block rule not found: ${id}`);
    }

    rules[index] = {
      ...rules[index],
      ...updates,
      updatedAt: new Date().toISOString() as unknown as Date,
    } as BlockRule;

    // Serialize all rules before saving
    const serializedRules = rules.map(r => this.serializeRule(r));

    await this.storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      serializedRules,
      z.array(BlockRuleSchema) as unknown as z.ZodType<BlockRule[]>
    );
  }

  /**
   * Delete a block rule
   *
   * @param id - Rule ID to delete
   * @returns true if deleted, false if not found
   */
  async deleteRule(id: string): Promise<boolean> {
    const rules = await this.getAllRules();
    const initialLength = rules.length;
    const filtered = rules.filter(r => r.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    // Serialize all rules before saving
    const serializedRules = filtered.map(r => this.serializeRule(r));

    await this.storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      serializedRules,
      z.array(BlockRuleSchema) as unknown as z.ZodType<BlockRule[]>
    );

    return true;
  }

  /**
   * Find a rule by ID
   *
   * @param id - Rule ID to find
   * @returns Rule if found, null otherwise
   */
  async findById(id: string): Promise<BlockRule | null> {
    const rules = await this.getAllRules();
    return rules.find(r => r.id === id) ?? null;
  }

  /**
   * Delete all block rules
   */
  async deleteAllRules(): Promise<void> {
    await this.storageService.set(
      STORAGE_KEYS.BLOCK_RULES,
      [],
      z.array(BlockRuleSchema) as unknown as z.ZodType<BlockRule[]>,
      { debounce: false }
    );
  }
}
