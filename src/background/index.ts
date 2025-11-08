/**
 * Background service worker entry point
 * Handles extension lifecycle and background tasks
 */

// Service worker installation
chrome.runtime.onInstalled.addListener((details): void => {
  const { reason } = details;

  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // Extension installed
  } else if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // Extension updated
  }
});
