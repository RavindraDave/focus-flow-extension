/**
 * Blocker Engine
 * Focus Flow Extension
 *
 * Manages website blocking using chrome.declarativeNetRequest.
 * Converts BlockRules to dynamic rules and handles time allowances.
 */

import { BlockRuleRepository } from '../services/block-rule-repository';
import { AnalyticsTracker } from './analytics-tracker';
import { BlockRule } from '../types/index';

/**
 * Error class for blocker engine violations
 */
export class BlockerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockerError';
  }
}

/**
 * Allowance tracking for time-limited blocks
 */
interface DomainAllowance {
  domain: string;
  totalMinutes: number;
  usedMinutes: number;
  lastReset: Date;
}

/**
 * Manager for website blocking functionality
 *
 * @example
 * ```typescript
 * const blocker = new BlockerEngine();
 * await blocker.syncRules();
 * await blocker.enableBlocking();
 * ```
 */
export class BlockerEngine {
  private blockRuleRepository: BlockRuleRepository;
  private analyticsTracker: AnalyticsTracker;
  private isBlocking: boolean = false;

  // Rule ID range: 1000-9999 (reserve 0-999 for static rules)
  private static readonly RULE_ID_START = 1000;
  private static readonly RULE_ID_MAX = 9999;

  // Storage key for allowance tracking
  private static readonly ALLOWANCE_KEY = 'domain_allowances';

  constructor(
    blockRuleRepository?: BlockRuleRepository,
    analyticsTracker?: AnalyticsTracker
  ) {
    this.blockRuleRepository = blockRuleRepository || new BlockRuleRepository();
    this.analyticsTracker = analyticsTracker || new AnalyticsTracker();
  }

  /**
   * Sync block rules with Chrome declarativeNetRequest
   *
   * Converts BlockRules to dynamic rules and updates the extension.
   * Should be called when rules change or on extension startup.
   */
  async syncRules(): Promise<void> {
    try {
      const rules = await this.blockRuleRepository.getActiveRules();

      // Convert to declarativeNetRequest rules
      const chromeRules = rules.map((rule, index) =>
        this.convertToDeclarativeRule(rule, index)
      );

      // Update dynamic rules
      if (typeof chrome !== 'undefined' && chrome.declarativeNetRequest) {
        // Remove all existing dynamic rules
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const ruleIdsToRemove = existingRules.map(r => r.id);

        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
          addRules: chromeRules,
        });

        console.info(`✅ Synced ${chromeRules.length} block rules`);
      }
    } catch (error) {
      // Re-throw BlockerErrors as-is
      if (error instanceof BlockerError) {
        throw error;
      }
      console.error('Failed to sync block rules:', error);
      throw new BlockerError('Failed to sync block rules');
    }
  }

  /**
   * Enable blocking (called when work session starts)
   *
   * Syncs and activates all enabled block rules.
   */
  async enableBlocking(): Promise<void> {
    this.isBlocking = true;

    // Sync rules to Chrome declarativeNetRequest
    await this.syncRules();

    console.info('🚫 Blocking enabled');
  }

  /**
   * Disable blocking (called during breaks or when timer stops)
   *
   * Removes all dynamic rules to disable blocking.
   */
  async disableBlocking(): Promise<void> {
    this.isBlocking = false;

    // Remove all dynamic rules from Chrome
    if (typeof chrome !== 'undefined' && chrome.declarativeNetRequest) {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = existingRules.map(r => r.id);

      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
          addRules: [],
        });
      }
    }

    console.info('✅ Blocking disabled (break time)');
  }

  /**
   * Check if blocking is currently active
   *
   * @returns true if blocking is enabled
   */
  isActive(): boolean {
    return this.isBlocking;
  }

  /**
   * Track time used on a domain (for allowance tracking)
   *
   * @param domain - Domain to track (e.g., "youtube.com")
   * @param seconds - Seconds spent on domain
   */
  async trackTimeUsed(domain: string, seconds: number): Promise<void> {
    const allowances = await this.getAllowances();
    const allowance = allowances.find(a => a.domain === domain);

    if (!allowance) {
      return; // No allowance rule for this domain
    }

    allowance.usedMinutes += seconds / 60;

    await this.saveAllowances(allowances);
  }

  /**
   * Check if domain has remaining allowance
   *
   * @param domain - Domain to check
   * @returns Allowance status
   */
  async checkAllowance(domain: string): Promise<{
    allowed: boolean;
    remaining: number;
  }> {
    const rules = await this.blockRuleRepository.getActiveRules();
    const rule = rules.find(r => r.pattern === domain);

    if (!rule?.allowance) {
      return { allowed: false, remaining: 0 };
    }

    const allowances = await this.getAllowances();
    let allowance = allowances.find(a => a.domain === domain);

    // Initialize allowance if not exists
    if (!allowance) {
      allowance = {
        domain,
        totalMinutes: rule.allowance,
        usedMinutes: 0,
        lastReset: new Date(),
      };
      allowances.push(allowance);
      await this.saveAllowances(allowances);
    }

    const remaining = Math.max(0, allowance.totalMinutes - allowance.usedMinutes);
    const allowed = remaining > 0;

    return { allowed, remaining: Math.round(remaining) };
  }

  /**
   * Reset daily allowances (called at midnight)
   *
   * Resets all domain allowances to their configured limits.
   */
  async resetDailyAllowances(): Promise<void> {
    const rules = await this.blockRuleRepository.getActiveRules();
    const allowances: DomainAllowance[] = [];

    // Reset all domains with allowances
    for (const rule of rules) {
      if (rule.allowance) {
        allowances.push({
          domain: rule.pattern,
          totalMinutes: rule.allowance,
          usedMinutes: 0,
          lastReset: new Date(),
        });
      }
    }

    await this.saveAllowances(allowances);
    console.info('🔄 Daily allowances reset');
  }

  /**
   * Handle blocked attempt
   *
   * Tracks blocked attempts for analytics.
   *
   * @param domain - Domain that was blocked
   */
  async handleBlockedAttempt(domain: string): Promise<void> {
    if (!this.isBlocking) {
      return; // Not in blocking mode
    }

    await this.analyticsTracker.trackBlockedAttempt();
    console.info(`🚫 Blocked attempt: ${domain}`);
  }

  /**
   * Convert BlockRule to chrome.declarativeNetRequest.Rule
   *
   * @param rule - Block rule to convert
   * @param index - Index for rule ID generation
   * @returns Chrome declarative rule
   * @private
   */
  private convertToDeclarativeRule(
    rule: BlockRule,
    index: number
  ): chrome.declarativeNetRequest.Rule {
    const ruleId = BlockerEngine.RULE_ID_START + index;

    if (ruleId > BlockerEngine.RULE_ID_MAX) {
      throw new BlockerError(
        `Exceeded maximum number of rules (${BlockerEngine.RULE_ID_MAX - BlockerEngine.RULE_ID_START})`
      );
    }

    // Determine URL filter based on rule type
    let urlFilter: string;
    if (rule.type === 'domain') {
      urlFilter = `*://*.${rule.pattern}/*`;
    } else if (rule.type === 'url') {
      urlFilter = rule.pattern;
    } else {
      // Regex type - use url pattern directly
      urlFilter = rule.pattern;
    }

    // Build redirect URL with context
    const redirectUrl = chrome.runtime
      ? chrome.runtime.getURL(
          `/blocked.html?domain=${encodeURIComponent(rule.pattern)}&name=${encodeURIComponent(rule.name)}`
        )
      : `/blocked.html?domain=${encodeURIComponent(rule.pattern)}&name=${encodeURIComponent(rule.name)}`;

    return {
      id: ruleId,
      priority: 1, // Fixed priority for all rules
      action: {
        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
        redirect: {
          url: redirectUrl,
        },
      },
      condition: {
        urlFilter,
        resourceTypes: [
          'main_frame' as chrome.declarativeNetRequest.ResourceType,
        ],
      },
    };
  }

  /**
   * Get allowances from storage
   *
   * @returns Array of domain allowances
   * @private
   */
  private async getAllowances(): Promise<DomainAllowance[]> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(
        BlockerEngine.ALLOWANCE_KEY
      );
      return result[BlockerEngine.ALLOWANCE_KEY] || [];
    }
    return [];
  }

  /**
   * Save allowances to storage
   *
   * @param allowances - Allowances to save
   * @private
   */
  private async saveAllowances(allowances: DomainAllowance[]): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        [BlockerEngine.ALLOWANCE_KEY]: allowances,
      });
    }
  }

  /**
   * Get blocking statistics
   *
   * @returns Statistics about blocking activity
   */
  async getStats(): Promise<{
    totalRules: number;
    activeRules: number;
    isBlocking: boolean;
    allowances: Array<{ domain: string; remaining: number }>;
  }> {
    const allRules = await this.blockRuleRepository.getAllRules();
    const activeRules = await this.blockRuleRepository.getActiveRules();
    const allowances = await this.getAllowances();

    const allowanceStats = allowances.map(a => ({
      domain: a.domain,
      remaining: Math.round(a.totalMinutes - a.usedMinutes),
    }));

    return {
      totalRules: allRules.length,
      activeRules: activeRules.length,
      isBlocking: this.isBlocking,
      allowances: allowanceStats,
    };
  }
}
