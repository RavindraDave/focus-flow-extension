/**
 * Blocker Engine
 * Focus Flow Extension
 *
 * Manages website blocking using chrome.declarativeNetRequest.
 * Converts BlockRules to dynamic rules and handles time allowances.
 */

import { BlockRuleRepository } from '../services/block-rule-repository';
import { SettingsRepository } from '../services/settings-repository';
import { AnalyticsTracker } from './analytics-tracker';
import { BlockRule } from '../types/index';
import { createLogger } from '../utils/logger';

const log = createLogger('BlockerEngine');

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
  private settingsRepository: SettingsRepository;
  private analyticsTracker: AnalyticsTracker;
  private isBlocking: boolean = false;

  // Rule ID range: 1000-9999 (reserve 0-999 for static rules)
  private static readonly RULE_ID_START = 1000;
  private static readonly RULE_ID_MAX = 9999;

  // Special rule ID for whitelist mode block-all rule
  private static readonly WHITELIST_BLOCK_ALL_ID = 999;

  // Storage key for allowance tracking
  private static readonly ALLOWANCE_KEY = 'domain_allowances';

  constructor(
    blockRuleRepository?: BlockRuleRepository,
    settingsRepository?: SettingsRepository,
    analyticsTracker?: AnalyticsTracker
  ) {
    this.blockRuleRepository = blockRuleRepository ?? new BlockRuleRepository();
    this.settingsRepository = settingsRepository ?? new SettingsRepository();
    this.analyticsTracker = analyticsTracker ?? new AnalyticsTracker();
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
      const settings = await this.settingsRepository.getSettings();
      const isWhitelistMode = settings.blockingMode === 'whitelist';

      const chromeRules = isWhitelistMode
        ? this.buildWhitelistRules(rules)
        : this.buildBlacklistRules(rules);

      await this.updateDynamicRules(chromeRules);

      log.info('Rules synced', {
        count: chromeRules.length,
        mode: isWhitelistMode ? 'whitelist' : 'blacklist',
      });
    } catch (error) {
      // Re-throw BlockerErrors as-is
      if (error instanceof BlockerError) {
        throw error;
      }
      throw new BlockerError('Failed to sync block rules');
    }
  }

  /**
   * Build whitelist mode rules
   * @private
   */
  private buildWhitelistRules(
    rules: BlockRule[]
  ): chrome.declarativeNetRequest.Rule[] {
    const chromeRules: chrome.declarativeNetRequest.Rule[] = [];

    // Add block-all rule (lowest priority)
    const blockAllUrl = chrome.runtime?.getURL
      ? chrome.runtime.getURL('/blocked.html?mode=whitelist')
      : '/blocked.html?mode=whitelist';

    chromeRules.push({
      id: BlockerEngine.WHITELIST_BLOCK_ALL_ID,
      priority: 1,
      action: {
        type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
        redirect: { url: blockAllUrl },
      },
      condition: {
        urlFilter: '*://*/*',
        resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
      },
    });

    // Add allow rules for each site
    chromeRules.push(
      ...rules.map((rule, index) => this.convertToWhitelistRule(rule, index))
    );

    return chromeRules;
  }

  /**
   * Build blacklist mode rules
   * @private
   */
  private buildBlacklistRules(
    rules: BlockRule[]
  ): chrome.declarativeNetRequest.Rule[] {
    return rules.map((rule, index) =>
      this.convertToDeclarativeRule(rule, index)
    );
  }

  /**
   * Update Chrome dynamic rules
   * @private
   */
  private async updateDynamicRules(
    chromeRules: chrome.declarativeNetRequest.Rule[]
  ): Promise<void> {
    if (!chrome?.declarativeNetRequest) {
      return;
    }

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: chromeRules,
    });
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

    log.info('Blocking enabled');
  }

  /**
   * Disable blocking (called during breaks or when timer stops)
   *
   * Removes all dynamic rules to disable blocking.
   */
  async disableBlocking(): Promise<void> {
    this.isBlocking = false;

    // Remove all dynamic rules from Chrome
    if (chrome?.declarativeNetRequest) {
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = existingRules.map(r => r.id);

      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
          addRules: [],
        });
      }
    }

    log.info('Blocking disabled (break time)');
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
    log.info('Daily allowances reset');
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
    log.info('Blocked attempt', { domain });
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
      // Use AdBlock-style filter for domains: matches http/https and subdomains
      if (rule.pattern.includes('.')) {
        urlFilter = `||${rule.pattern}^`;
      } else {
        // Partial domain (e.g. "youtube") - allow matching any TLD
        urlFilter = `||${rule.pattern}`;
      }
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
   * Convert BlockRule to whitelist allow rule
   *
   * In whitelist mode, rules specify sites that should be ALLOWED.
   * These rules have higher priority than the block-all rule.
   *
   * @param rule - Block rule to convert
   * @param index - Index for rule ID generation
   * @returns Chrome declarative allow rule
   * @private
   */
  private convertToWhitelistRule(
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
      // Use AdBlock-style filter for domains
      if (rule.pattern.includes('.')) {
        urlFilter = `||${rule.pattern}^`;
      } else {
        // Partial domain (e.g. "youtube") - allow matching any TLD
        urlFilter = `||${rule.pattern}`;
      }
    } else if (rule.type === 'url') {
      urlFilter = rule.pattern;
    } else {
      // Keyword type - use pattern directly
      urlFilter = rule.pattern;
    }

    return {
      id: ruleId,
      priority: 2, // Higher priority than block-all rule (which is priority 1)
      action: {
        type: 'allow' as chrome.declarativeNetRequest.RuleActionType,
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
    if (chrome?.storage) {
      const result = await chrome.storage.local.get(
        BlockerEngine.ALLOWANCE_KEY
      );
      return (result[BlockerEngine.ALLOWANCE_KEY] as DomainAllowance[]) ?? [];
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
    if (chrome?.storage) {
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

  /**
   * Grant temporary access to a domain using allowance
   *
   * @param domain - Domain to grant access to
   * @param durationMinutes - Duration in minutes (max: remaining allowance)
   * @returns Object with success status and expiration time
   */
  async grantTemporaryAccess(
    domain: string,
    durationMinutes: number
  ): Promise<{
    success: boolean;
    expiresAt?: Date;
    remaining?: number;
    error?: string;
  }> {
    // Check if domain has allowance available
    const allowanceCheck = await this.checkAllowance(domain);

    if (!allowanceCheck.allowed || allowanceCheck.remaining <= 0) {
      return {
        success: false,
        error: 'No allowance remaining for this domain',
      };
    }

    // Cap duration to available allowance
    const grantedMinutes = Math.min(durationMinutes, allowanceCheck.remaining);

    // Temporarily remove blocking for this domain
    await this.temporarilyUnblockDomain(domain);

    // Calculate expiration and set up re-block alarm
    const expiresAt = new Date(Date.now() + grantedMinutes * 60 * 1000);
    await this.scheduleReblock(domain, expiresAt, grantedMinutes);

    log.info('Granted temporary access', {
      domain,
      durationMinutes: grantedMinutes,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      success: true,
      expiresAt,
      remaining: allowanceCheck.remaining - grantedMinutes,
    };
  }

  /**
   * Temporarily unblock a domain
   * @private
   */
  private async temporarilyUnblockDomain(domain: string): Promise<void> {
    const rules = await this.blockRuleRepository.getActiveRules();
    const filteredRules = rules.filter(r => r.pattern !== domain);

    // Convert to declarativeNetRequest rules
    const chromeRules = filteredRules.map((rule, index) =>
      this.convertToDeclarativeRule(rule, index)
    );

    // Update dynamic rules (temporarily remove this domain)
    await this.updateDynamicRules(chromeRules);
  }

  /**
   * Schedule re-blocking of a domain
   * @private
   */
  private async scheduleReblock(
    domain: string,
    expiresAt: Date,
    grantedMinutes: number
  ): Promise<void> {
    if (!chrome?.alarms) {
      return;
    }

    const alarmName = `reblock-${domain}`;
    await chrome.alarms.create(alarmName, {
      when: expiresAt.getTime(),
    });

    // Store temporary access info
    await this.saveTemporaryAccess({
      domain,
      startTime: new Date(),
      expiresAt,
      grantedMinutes,
    });
  }

  /**
   * Handle re-blocking when temporary access expires
   *
   * @param domain - Domain to re-block
   */
  async handleTemporaryAccessExpired(domain: string): Promise<void> {
    // Get temporary access info
    const tempAccess = await this.getTemporaryAccess(domain);

    if (!tempAccess) {
      return; // No temp access for this domain
    }

    // Calculate actual time used
    const startTime = new Date(tempAccess.startTime);
    const now = new Date();
    const actualMinutes = Math.ceil((now.getTime() - startTime.getTime()) / (60 * 1000));

    // Track the time used
    await this.trackTimeUsed(domain, actualMinutes * 60);

    // Remove temporary access record
    await this.removeTemporaryAccess(domain);

    // Re-sync rules to re-enable blocking for this domain
    await this.syncRules();

    log.info('Re-blocked domain after temporary access', {
      domain,
      actualMinutes,
    });
  }

  /**
   * Get active temporary access for a domain
   *
   * @param domain - Domain to check
   * @returns Temporary access info if active
   */
  async getActiveTemporaryAccess(domain: string): Promise<{
    domain: string;
    expiresAt: Date;
    remainingSeconds: number;
  } | null> {
    const tempAccess = await this.getTemporaryAccess(domain);

    if (!tempAccess) {
      return null;
    }

    const expiresAt = new Date(tempAccess.expiresAt);
    const now = new Date();
    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    );

    if (remainingSeconds <= 0) {
      // Expired - clean up
      await this.removeTemporaryAccess(domain);
      return null;
    }

    return {
      domain,
      expiresAt,
      remainingSeconds,
    };
  }

  // Storage key for temporary access tracking
  private static readonly TEMP_ACCESS_KEY = 'temporary_access';

  /**
   * Save temporary access info
   * @private
   */
  private async saveTemporaryAccess(info: {
    domain: string;
    startTime: Date;
    expiresAt: Date;
    grantedMinutes: number;
  }): Promise<void> {
    if (!chrome?.storage) {
      return;
    }

    const result = await chrome.storage.local.get(
      BlockerEngine.TEMP_ACCESS_KEY
    );
    const tempAccesses: Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }> = (result[BlockerEngine.TEMP_ACCESS_KEY] as Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }>) ?? {};

    tempAccesses[info.domain] = {
      startTime: info.startTime.toISOString(),
      expiresAt: info.expiresAt.toISOString(),
      grantedMinutes: info.grantedMinutes,
    };

    await chrome.storage.local.set({
      [BlockerEngine.TEMP_ACCESS_KEY]: tempAccesses,
    });
  }

  /**
   * Get temporary access info for domain
   * @private
   */
  private async getTemporaryAccess(domain: string): Promise<{
    startTime: string;
    expiresAt: string;
    grantedMinutes: number;
  } | null> {
    if (!chrome?.storage) {
      return null;
    }

    const result = await chrome.storage.local.get(
      BlockerEngine.TEMP_ACCESS_KEY
    );
    const tempAccesses: Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }> = (result[BlockerEngine.TEMP_ACCESS_KEY] as Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }>) ?? {};

    const access = tempAccesses[domain];
    return access ?? null;
  }

  /**
   * Remove temporary access info for domain
   * @private
   */
  private async removeTemporaryAccess(domain: string): Promise<void> {
    if (!chrome?.storage) {
      return;
    }

    const result = await chrome.storage.local.get(
      BlockerEngine.TEMP_ACCESS_KEY
    );
    const tempAccesses: Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }> = (result[BlockerEngine.TEMP_ACCESS_KEY] as Record<string, {
      startTime: string;
      expiresAt: string;
      grantedMinutes: number;
    }>) ?? {};

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete tempAccesses[domain];

    await chrome.storage.local.set({
      [BlockerEngine.TEMP_ACCESS_KEY]: tempAccesses,
    });
  }
}
