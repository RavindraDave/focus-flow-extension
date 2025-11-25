// Theme Initialization Script for blocked.html
// This script loads and applies the theme immediately to prevent flash of unstyled content

(function () {
    // Load theme from chrome.storage.sync and apply immediately
    function loadAndApplyTheme() {
        try {
            chrome.storage.sync.get('visual_theme', function (result) {
                const theme = result.visual_theme || 'modern';
                document.body.setAttribute('data-theme', theme);
                console.log('[Blocked Page] Theme loaded:', theme);
            });
        } catch (error) {
            console.error('[Blocked Page] Failed to load theme:', error);
            // Fallback to default theme
            document.body.setAttribute('data-theme', 'modern');
        }
    }

    // Listen for theme changes from other pages
    function setupThemeListener() {
        try {
            chrome.storage.onChanged.addListener(function (changes, areaName) {
                if (areaName === 'sync' && changes.visual_theme) {
                    const newTheme = changes.visual_theme.newValue;
                    console.log('[Blocked Page] Theme changed to:', newTheme);
                    document.body.setAttribute('data-theme', newTheme);
                }
            });
        } catch (error) {
            console.error('[Blocked Page] Failed to setup theme listener:', error);
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            loadAndApplyTheme();
            setupThemeListener();
        });
    } else {
        loadAndApplyTheme();
        setupThemeListener();
    }
})();
