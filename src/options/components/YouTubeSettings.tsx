/**
 * YouTubeSettings - Configure YouTube-specific controls
 * WCAG 2.1 AA compliant with clear labeling
 * Premium feature
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms/Button';
import type { YouTubeConfig } from '../../types';
import { IS_PREMIUM_COMING_SOON } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const log = createLogger('YouTubeSettings');

export interface YouTubeSettingsProps {
  isPremium: boolean;
}

/**
 * YouTubeSettings component
 * Complexity: 7 (state management + storage + conditional rendering)
 */
export const YouTubeSettings: React.FC<YouTubeSettingsProps> = ({ isPremium }) => {
  const [config, setConfig] = useState<YouTubeConfig>({
    enabled: false,
    hideShorts: false,
    hideRecommendations: false,
    hideComments: false,
    hideFeed: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  /**
   * Load YouTube settings from storage
   * Complexity: 3 (async + error handling)
   */
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const result = (await chrome.storage.sync.get(
          'youtubeControls'
        )) as { youtubeControls?: YouTubeConfig };

        if (result.youtubeControls) {
          setConfig(result.youtubeControls);
        }
      } catch (error) {
        log.error('Failed to load YouTube settings', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  /**
   * Save YouTube settings to storage
   * Complexity: 4 (async + validation + error handling + feedback)
   */
  const handleSave = async (): Promise<void> => {
    if (!isPremium) {
      setSaveMessage('YouTube controls require Premium');
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      await chrome.storage.sync.set({ youtubeControls: config });

      setSaveMessage('Settings saved successfully!');

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      log.error('Failed to save YouTube settings', error instanceof Error ? error : undefined);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle checkbox changes
   * Complexity: 2 (event handling + state update)
   */
  const handleToggle = (key: keyof YouTubeConfig): void => {
    if (!isPremium && key === 'enabled') {
      return;
    }

    setConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
        <div className="h-20 bg-neutral-200 rounded"></div>
        <div className="h-20 bg-neutral-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
          YouTube Controls
          {isPremium && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
              Premium
            </span>
          )}
        </h2>
        <p className="text-sm text-neutral-600">
          Hide distracting elements on YouTube to maintain focus during work sessions.
        </p>
      </div>

      {/* Premium Gate */}
      {!isPremium && (
        <div className="border border-warning-300 bg-warning-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⭐</span>
            <div>
              <h3 className="font-semibold text-warning-900 mb-1">
                {IS_PREMIUM_COMING_SOON ? 'Premium Features Coming Soon' : 'Premium Feature'}
              </h3>
              <p className="text-sm text-warning-800 mb-3">
                {IS_PREMIUM_COMING_SOON
                  ? 'YouTube controls will be part of our Premium tier. Stay tuned for updates!'
                  : 'YouTube controls are available for Premium users. Upgrade to unlock advanced blocking features.'
                }
              </p>
              {!IS_PREMIUM_COMING_SOON && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open('https://focusflow.app/premium', '_blank')}
                >
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={() => handleToggle('enabled')}
            disabled={!isPremium}
            className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enable YouTube controls"
          />
          <div className="flex-1">
            <div className="font-medium text-neutral-900">Enable YouTube Controls</div>
            <div className="text-sm text-neutral-600">
              Activate element hiding on YouTube.com
            </div>
          </div>
        </label>
      </div>

      {/* Individual Controls */}
      <div className="space-y-4 opacity-${config.enabled ? '100' : '50'}">
        {/* Hide Shorts */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hideShorts}
              onChange={() => handleToggle('hideShorts')}
              disabled={!config.enabled || !isPremium}
              className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Hide YouTube Shorts"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Hide YouTube Shorts</div>
              <div className="text-sm text-neutral-600">
                Removes Shorts shelf and #shorts tab from homepage and sidebar
              </div>
            </div>
          </label>
        </div>

        {/* Hide Recommendations */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hideRecommendations}
              onChange={() => handleToggle('hideRecommendations')}
              disabled={!config.enabled || !isPremium}
              className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Hide recommended videos"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Hide Recommended Videos</div>
              <div className="text-sm text-neutral-600">
                Removes sidebar recommendations and suggested videos
              </div>
            </div>
          </label>
        </div>

        {/* Hide Comments */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hideComments}
              onChange={() => handleToggle('hideComments')}
              disabled={!config.enabled || !isPremium}
              className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Hide comments section"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Hide Comments</div>
              <div className="text-sm text-neutral-600">
                Hides the comments section on video pages
              </div>
            </div>
          </label>
        </div>

        {/* Hide Feed */}
        <div className="border border-neutral-200 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hideFeed}
              onChange={() => handleToggle('hideFeed')}
              disabled={!config.enabled || !isPremium}
              className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Hide homepage feed"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Hide Homepage Feed</div>
              <div className="text-sm text-neutral-600">
                Hides trending and recommended content on YouTube homepage
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          disabled={!isPremium || isSaving}
          aria-label="Save YouTube settings"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>

        {saveMessage && (
          <div
            className={`text-sm ${saveMessage.includes('success') ? 'text-success-600' : 'text-error-600'
              }`}
            role="status"
            aria-live="polite"
          >
            {saveMessage}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="border border-info-200 bg-info-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-xl">ℹ️</span>
          <div className="text-sm text-info-900">
            <p className="font-medium mb-1">How it works</p>
            <p className="text-info-800">
              These settings only affect YouTube.com and will apply across all your devices (via Chrome Sync).
              Changes take effect immediately - refresh YouTube to see the updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
