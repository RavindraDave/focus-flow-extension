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

interface ToggleControlProps {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  ariaLabel: string;
  title: string;
  description: string;
}

/**
 * Reusable toggle control for YouTube settings
 */
const ToggleControl: React.FC<ToggleControlProps> = ({
  checked,
  onChange,
  disabled,
  ariaLabel,
  title,
  description,
}) => (
  <div className="border border-neutral-200 rounded-lg p-4">
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={ariaLabel}
      />
      <div className="flex-1">
        <div className="font-medium text-neutral-900">{title}</div>
        <div className="text-sm text-neutral-600">{description}</div>
      </div>
    </label>
  </div>
);

interface SettingsHeaderProps {
  isPremium: boolean;
}

/**
 * Header section with title and premium badge
 */
const SettingsHeader: React.FC<SettingsHeaderProps> = ({ isPremium }) => (
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
);

/**
 * Premium gate banner for non-premium users
 */
const PremiumGate: React.FC = () => (
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
);

interface SaveSectionProps {
  isPremium: boolean;
  isSaving: boolean;
  saveMessage: string | null;
  onSave: () => void;
}

/**
 * Save button and status message section
 */
const SaveSection: React.FC<SaveSectionProps> = ({ isPremium, isSaving, saveMessage, onSave }) => (
  <div className="flex items-center justify-between">
    <Button
      variant="primary"
      onClick={onSave}
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
);

/**
 * Info box explaining how settings work
 */
const InfoBox: React.FC = () => (
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
);

/** Toggle item definitions for YouTube controls */
const TOGGLE_ITEMS: Array<{
  key: keyof YouTubeConfig;
  ariaLabel: string;
  title: string;
  description: string;
}> = [
  {
    key: 'hideShorts',
    ariaLabel: 'Hide YouTube Shorts',
    title: 'Hide YouTube Shorts',
    description: 'Removes Shorts shelf and #shorts tab from homepage and sidebar',
  },
  {
    key: 'hideRecommendations',
    ariaLabel: 'Hide recommended videos',
    title: 'Hide Recommended Videos',
    description: 'Removes sidebar recommendations and suggested videos',
  },
  {
    key: 'hideComments',
    ariaLabel: 'Hide comments section',
    title: 'Hide Comments',
    description: 'Hides the comments section on video pages',
  },
  {
    key: 'hideFeed',
    ariaLabel: 'Hide homepage feed',
    title: 'Hide Homepage Feed',
    description: 'Hides trending and recommended content on YouTube homepage',
  },
];

/**
 * YouTubeSettings component
 */
// eslint-disable-next-line max-lines-per-function
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
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      log.error('Failed to save YouTube settings', error instanceof Error ? error : undefined);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof YouTubeConfig): void => {
    if (!isPremium && key === 'enabled') {
      return;
    }
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
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
      <SettingsHeader isPremium={isPremium} />
      {!isPremium && <PremiumGate />}
      <ToggleControl
        checked={config.enabled}
        onChange={() => handleToggle('enabled')}
        disabled={!isPremium}
        ariaLabel="Enable YouTube controls"
        title="Enable YouTube Controls"
        description="Activate element hiding on YouTube.com"
      />
      <div className={`space-y-4 ${config.enabled ? 'opacity-100' : 'opacity-50'}`}>
        {TOGGLE_ITEMS.map(item => (
          <ToggleControl
            key={item.key}
            checked={config[item.key]}
            onChange={() => handleToggle(item.key)}
            disabled={!config.enabled || !isPremium}
            ariaLabel={item.ariaLabel}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
      <SaveSection
        isPremium={isPremium}
        isSaving={isSaving}
        saveMessage={saveMessage}
        onSave={() => void handleSave()}
      />
      <InfoBox />
    </div>
  );
};
