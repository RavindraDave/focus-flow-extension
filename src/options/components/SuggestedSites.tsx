/**
 * SuggestedSites - Pre-populated list of distracting websites
 * Users can add individual sites or entire categories with one click
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { SUGGESTED_SITES, type SiteCategory, type SuggestedSite } from '../../utils/suggested-sites';
import { useBlockRules } from '../../hooks/useBlockRules';
import { createLogger } from '../../utils/logger';

const log = createLogger('SuggestedSites');

/**
 * SuggestedSites component
 */
export const SuggestedSites: React.FC = () => {
  const { rules, addRule, addRules } = useBlockRules();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addingDomains, setAddingDomains] = useState<Set<string>>(new Set());
  const [addingCategories, setAddingCategories] = useState<Set<string>>(new Set());

  // Clear loading states when rules update (after successful add)
  React.useEffect(() => {
    // If we were adding categories/domains and rules changed, clear the loading states
    if (addingCategories.size > 0 || addingDomains.size > 0) {
      setAddingCategories(new Set());
      setAddingDomains(new Set());
    }
  }, [rules]); // Re-run when rules change

  /**
   * Check if a domain is already blocked
   */
  const isDomainBlocked = (domain: string): boolean => {
    return rules.some(
      (rule) =>
        rule.pattern === domain && rule.type === 'domain' && rule.enabled
    );
  };

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  /**
   * Add a single site to block list
   */
  const handleAddSite = async (site: SuggestedSite) => {
    if (isDomainBlocked(site.domain) || addingDomains.has(site.domain)) {
      return;
    }

    setAddingDomains(prev => new Set(prev).add(site.domain));

    try {
      await addRule({
        name: site.name,
        pattern: site.domain,
        type: 'domain',
        enabled: true,
        allowance: null,
        timeUsedToday: 0,
      });
    } catch (error) {
      log.error('Failed to add site', error instanceof Error ? error : undefined);
    } finally {
      setAddingDomains(prev => {
        const next = new Set(prev);
        next.delete(site.domain);
        return next;
      });
    }
  };

  /**
   * Add all sites in a category (optimized batch add)
   */
  const handleAddCategory = async (category: SiteCategory) => {
    // Prevent multiple clicks
    if (addingCategories.has(category.name)) {
      return;
    }

    // Filter out already blocked sites
    const sitesToAdd = category.sites.filter(site => !isDomainBlocked(site.domain));

    if (sitesToAdd.length === 0) {
      return;
    }

    // Mark category as adding
    setAddingCategories(prev => new Set(prev).add(category.name));

    // Mark all sites as adding
    setAddingDomains(prev => {
      const next = new Set(prev);
      sitesToAdd.forEach(site => next.add(site.domain));
      return next;
    });

    try {
      // Use batch add - much faster!
      await addRules(
        sitesToAdd.map(site => ({
          name: site.name,
          pattern: site.domain,
          type: 'domain',
          enabled: true,
          allowance: null,
          timeUsedToday: 0,
        }))
      );
    } catch (error) {
      log.error('Failed to add category', error instanceof Error ? error : undefined);
    } finally {
      // Clear category loading state
      setAddingCategories(prev => {
        const next = new Set(prev);
        next.delete(category.name);
        return next;
      });

      // Clear all adding states
      setAddingDomains(prev => {
        const next = new Set(prev);
        sitesToAdd.forEach(site => next.delete(site.domain));
        return next;
      });
    }
  };

  /**
   * Calculate how many sites in a category are already blocked
   */
  const getBlockedCount = (category: SiteCategory): number => {
    return category.sites.filter(site => isDomainBlocked(site.domain)).length;
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            ⚡ Quick Add: Popular Distracting Sites
          </h3>
          <p className="text-sm text-text-secondary">
            Add commonly distracting websites with a single click. Choose individual sites or entire categories.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {SUGGESTED_SITES.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          const blockedCount = getBlockedCount(category);
          const totalCount = category.sites.length;
          const allBlocked = blockedCount === totalCount;

          return (
            <div
              key={category.name}
              className="bg-surface border border-border rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 bg-bg-secondary">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.name)}
                  className="flex items-center space-x-3 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                  aria-expanded={isExpanded}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-text-primary">{category.name}</span>
                      <Badge variant="info" size="sm">
                        {blockedCount}/{totalCount}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {totalCount} sites {allBlocked && '(all blocked)'}
                    </p>
                  </div>
                  <span className="text-text-muted text-xl">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {/* Add All Category Button */}
                {!allBlocked && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddCategory(category)}
                    disabled={allBlocked || addingCategories.has(category.name)}
                    className="ml-3"
                  >
                    {addingCategories.has(category.name)
                      ? 'Adding...'
                      : `+ Add All (${totalCount - blockedCount})`
                    }
                  </Button>
                )}
              </div>

              {/* Site List (Expanded) */}
              {isExpanded && (
                <div className="p-4 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {category.sites.map((site) => {
                      const isBlocked = isDomainBlocked(site.domain);
                      const isAdding = addingDomains.has(site.domain);

                      return (
                        <div
                          key={site.domain}
                          className={`flex items-center gap-3 p-3 border-b transition ${isDomainBlocked(site.domain)
                            ? 'bg-success/10 border-success/30'
                            : 'bg-surface border-border hover:border-accent'
                            }`}
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="font-medium text-sm text-text-primary truncate">
                              {site.name}
                            </div>
                            <div className="text-xs text-text-tertiary truncate">
                              {site.domain}
                            </div>
                          </div>

                          {isBlocked ? (
                            <Badge variant="success" size="sm">
                              ✓ Added
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddSite(site)}
                              disabled={isAdding}
                              className="whitespace-nowrap text-xs px-2 py-1"
                            >
                              {isAdding ? '...' : '+ Add'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-md">
        <p className="text-xs text-text-primary">
          <strong>💡 Tip:</strong> Added sites will only be blocked during work sessions (not during breaks).
          You can enable/disable or remove them anytime from your block list below.
        </p>
      </div>
    </div>
  );
};
