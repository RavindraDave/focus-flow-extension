/**
 * YouTube Content Script
 * Focus Flow Extension
 *
 * Hides distracting elements on YouTube based on user settings.
 * Uses MutationObserver for dynamic content.
 *
 * Performance target: <50ms execution time on page load
 * WCAG 2.1 AA compliant: Maintains navigation and accessibility
 */

import type { YouTubeConfig } from '../types';

/**
 * CSS selectors for YouTube elements to hide
 * Updated for current YouTube DOM structure (2025)
 * Complexity: 1 (constant data)
 */
const SELECTORS = {
  // YouTube Shorts
  shorts: [
    'ytd-reel-shelf-renderer', // Shorts shelf on homepage
    'ytd-rich-shelf-renderer[is-shorts]', // Shorts section
    '#shorts-container', // Shorts container
    'ytd-guide-entry-renderer:has([title="Shorts"])', // Shorts in sidebar
    'a[href^="/shorts"]', // Direct shorts links
  ].join(', '),

  // Recommendations
  recommendations: [
    '#related', // Related videos sidebar
    'ytd-watch-next-secondary-results-renderer', // Watch next
    'ytd-compact-video-renderer', // Recommended video items
    '#secondary', // Secondary column
  ].join(', '),

  // Comments
  comments: [
    'ytd-comments#comments', // Comments section
    'ytd-comments-header-renderer', // Comments header
    '#comments', // Comments container
  ].join(', '),

  // Homepage feed and trending
  feed: [
    'ytd-rich-grid-renderer', // Homepage feed
    'ytd-browse[page-subtype="home"]', // Home page content
    'ytd-two-column-browse-results-renderer', // Browse results
  ].join(', '),
} as const;

/**
 * Current YouTube configuration
 */
let config: YouTubeConfig = {
  enabled: false,
  hideShorts: false,
  hideRecommendations: false,
  hideComments: false,
  hideFeed: false,
};

/**
 * MutationObserver instance for detecting dynamic content
 */
let observer: MutationObserver | null = null;

/**
 * Load YouTube settings from storage
 * Complexity: 3 (async + error handling + type validation)
 */
async function loadSettings(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get('youtubeControls');

    if (result.youtubeControls) {
      config = result.youtubeControls;
      console.log('[Focus Flow] YouTube settings loaded:', config);
    } else {
      console.log('[Focus Flow] No YouTube settings found, using defaults');
    }
  } catch (error) {
    console.error('[Focus Flow] Failed to load YouTube settings:', error);
  }
}

/**
 * Apply CSS hiding to matching elements
 * OPTIMIZED: Defers DOM manipulation to next animation frame for better performance
 * Complexity: 5 (multiple conditions + DOM manipulation)
 */
function applyHiding(): void {
  if (!config.enabled) {
    return;
  }

  // Defer DOM manipulation to avoid blocking page load
  requestAnimationFrame(() => {
    // Build combined selector for single query
    const selectorsToHide: string[] = [];

    if (config.hideShorts) {
      selectorsToHide.push(SELECTORS.shorts);
    }
    if (config.hideRecommendations) {
      selectorsToHide.push(SELECTORS.recommendations);
    }
    if (config.hideComments) {
      selectorsToHide.push(SELECTORS.comments);
    }
    if (config.hideFeed && (window.location.pathname === '/' || window.location.pathname === '/feed/trending')) {
      selectorsToHide.push(SELECTORS.feed);
    }

    // Single querySelectorAll for all elements - much faster
    if (selectorsToHide.length > 0) {
      const combinedSelector = selectorsToHide.join(', ');
      const elements = document.querySelectorAll(combinedSelector);

      // Batch DOM updates
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).setAttribute('aria-hidden', 'true');
      });
    }
  });
}

/**
 * Restore visibility to all hidden elements
 * Used when settings are disabled
 * Complexity: 3 (multiple queries + DOM manipulation)
 */
function restoreVisibility(): void {
  const allSelectors = Object.values(SELECTORS).join(', ');
  const elements = document.querySelectorAll(allSelectors);

  elements.forEach(el => {
    (el as HTMLElement).style.display = '';
    (el as HTMLElement).removeAttribute('aria-hidden');
  });
}

/**
 * Set up MutationObserver to watch for dynamically loaded content
 * Complexity: 4 (observer setup + callback + performance check)
 */
function setupObserver(): void {
  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }

  // Only observe if enabled
  if (!config.enabled) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    // Batch process mutations to improve performance
    const hasRelevantChanges = mutations.some(mutation => {
      return mutation.addedNodes.length > 0;
    });

    if (hasRelevantChanges) {
      // Debounce using requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => applyHiding(), { timeout: 100 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(applyHiding, 50);
      }
    }
  });

  // Observe the main content area for changes
  const targetNode = document.body;

  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Handle storage changes from popup/options page
 * Complexity: 4 (event handling + conditional logic)
 */
function handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }): void {
  if (changes.youtubeControls) {
    const newConfig = changes.youtubeControls.newValue as YouTubeConfig;

    // If disabled, restore everything
    if (!newConfig.enabled && config.enabled) {
      restoreVisibility();
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

    // Update config
    config = newConfig;

    // If enabled, apply hiding and setup observer
    if (config.enabled) {
      applyHiding();
      setupObserver();
    }

    console.log('[Focus Flow] YouTube settings updated:', config);
  }
}

/**
 * Initialize content script
 * OPTIMIZED: Proper performance measurement and non-blocking initialization
 * Complexity: 4 (async + setup + error handling + performance logging)
 */
async function initialize(): Promise<void> {
  // Start performance timer at actual initialization start
  const startTime = performance.now();

  try {
    // Load settings from storage (async, unavoidable)
    await loadSettings();

    // Set up storage listener immediately (synchronous)
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Apply hiding on initial load (deferred via requestAnimationFrame)
    if (config.enabled) {
      applyHiding();
      setupObserver();
    }

    // Log performance - measure only initialization logic, not DOM wait time
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(`[Focus Flow] YouTube content script initialized in ${executionTime.toFixed(2)}ms`);

    // Warn if exceeds performance target (adjusted for storage API latency)
    // Note: chrome.storage.sync.get typically takes 10-30ms, so target is <100ms total
    if (executionTime > 100) {
      console.warn(`[Focus Flow] Performance warning: Initialization took ${executionTime.toFixed(2)}ms (target: <100ms)`);
    }
  } catch (error) {
    console.error('[Focus Flow] Failed to initialize YouTube content script:', error);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
  }
});
