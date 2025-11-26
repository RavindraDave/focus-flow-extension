/**
 * BlockList Message Handler
 * Focus Flow Extension
 *
 * Handles all block list CRUD messages.
 */

import type { BlockRuleRepository } from '../../services/block-rule-repository';
import type { BlockerEngine } from '../blocker-engine';
import type {
  BlockListGetMessage,
  BlockListAddMessage,
  BlockListUpdateMessage,
  BlockListDeleteMessage
} from '../message-types';
import type { BlockRule } from '../../types/index';

export class BlockListMessageHandler {
  constructor(
    private blockRuleRepository: BlockRuleRepository,
    private blockerEngine: BlockerEngine
  ) {}

  /**
   * Handle get all block rules
   */
  async handleGetAll(_message: BlockListGetMessage): Promise<BlockRule[]> {
    return await this.blockRuleRepository.getAllRules();
  }

  /**
   * Handle add block rule
   */
  async handleAdd(message: BlockListAddMessage): Promise<BlockRule> {
    // Check for duplicate pattern
    const existingRules = await this.blockRuleRepository.getAllRules();
    const isDuplicate = existingRules.some(
      rule => rule.pattern === message.rule.pattern && rule.type === message.rule.type
    );

    if (isDuplicate) {
      // Return existing rule instead of creating duplicate
      const existing = existingRules.find(
        rule => rule.pattern === message.rule.pattern && rule.type === message.rule.type
      );
      if (existing) {
        return existing;
      }
    }

    const now = new Date().toISOString();
    const newRule: BlockRule = {
      ...message.rule,
      id: crypto.randomUUID(),
      createdAt: now as unknown as Date,
      updatedAt: now as unknown as Date,
      timeUsedToday: 0
    };

    await this.blockRuleRepository.addRule(newRule);
    await this.blockerEngine.syncRules();
    return newRule;
  }

  /**
   * Handle update block rule
   */
  async handleUpdate(message: BlockListUpdateMessage): Promise<boolean> {
    const updates = {
      ...message.updates,
      updatedAt: new Date().toISOString() as unknown as Date
    };
    await this.blockRuleRepository.updateRule(message.id, updates);
    await this.blockerEngine.syncRules();
    return true;
  }

  /**
   * Handle delete block rule
   */
  async handleDelete(message: BlockListDeleteMessage): Promise<boolean> {
    const deleted = await this.blockRuleRepository.deleteRule(message.id);
    if (deleted) {
      await this.blockerEngine.syncRules();
    }
    return deleted;
  }
}
