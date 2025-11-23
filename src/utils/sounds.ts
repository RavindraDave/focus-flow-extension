/**
 * Sound Utilities for Theme-Specific Notifications
 *
 * Handles playback of notification sounds based on active visual theme.
 * Respects user preferences for volume and sound enabled/disabled.
 */

export type ThemeMode = 'modern' | 'zen' | 'cyber';

export type NotificationSound = {
  theme: ThemeMode;
  file: string;
  description: string;
};

/**
 * Theme-to-sound mapping
 */
export const THEME_SOUNDS: Record<ThemeMode, NotificationSound> = {
  modern: {
    theme: 'modern',
    file: 'modern-ping.mp3',
    description: 'Clean professional ping',
  },
  zen: {
    theme: 'zen',
    file: 'zen-bowl.mp3',
    description: 'Calming singing bowl',
  },
  cyber: {
    theme: 'cyber',
    file: 'cyber-beep.mp3',
    description: 'Futuristic synthetic beep',
  },
};

/**
 * Check if a sound file exists
 */
async function soundFileExists(filename: string): Promise<boolean> {
  try {
    const url = chrome.runtime.getURL(`assets/sounds/${filename}`);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Sound file check failed for ${filename}:`, error);
    return false;
  }
}

/**
 * Play a notification sound based on current theme
 *
 * @param options - Optional overrides for theme, volume, and sound enablement
 * @returns Promise that resolves when sound finishes playing (or immediately if disabled)
 */
export async function playNotificationSound(options?: {
  theme?: ThemeMode;
  volume?: number;
  enabled?: boolean;
}): Promise<void> {
  try {
    // Get user preferences
    const settings = await chrome.storage.sync.get([
      'visual_theme',
      'sound_enabled',
      'sound_volume',
    ]);

    // Determine if sound should play
    const soundEnabled = options?.enabled ?? settings.sound_enabled ?? true;
    if (!soundEnabled) {
      console.log('Notification sound disabled by user preference');
      return;
    }

    // Determine which theme sound to use
    const theme: ThemeMode = (options?.theme ?? settings.visual_theme ?? 'modern') as ThemeMode;
    const soundInfo = THEME_SOUNDS[theme];

    // Check if sound file exists
    const exists = await soundFileExists(soundInfo.file);
    if (!exists) {
      console.warn(
        `Sound file not found: ${soundInfo.file}. ` +
        `See public/assets/sounds/README.md for installation instructions.`
      );
      return;
    }

    // Create and configure audio element
    const audio = new Audio(chrome.runtime.getURL(`assets/sounds/${soundInfo.file}`));

    // Set volume (0.0 to 1.0)
    const volume = options?.volume ?? settings.sound_volume ?? 0.5;
    audio.volume = Math.max(0, Math.min(1, volume));

    // Play the sound
    await audio.play();

    console.log(`Played notification sound: ${soundInfo.description} (volume: ${Math.round(volume * 100)}%)`);
  } catch (error) {
    // Fail silently - don't interrupt user experience for sound issues
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Test a specific theme sound
 * Useful for settings page preview
 *
 * @param theme - Theme to test
 * @param volume - Volume level (0.0 to 1.0)
 */
export async function testThemeSound(theme: ThemeMode, volume: number = 0.5): Promise<void> {
  await playNotificationSound({
    theme,
    volume,
    enabled: true, // Force enabled for testing
  });
}

/**
 * Preload all theme sounds for faster playback
 * Call this on extension startup or when user opens timer
 */
export async function preloadSounds(): Promise<void> {
  const soundFiles = Object.values(THEME_SOUNDS).map(s => s.file);

  const preloadPromises = soundFiles.map(async (file) => {
    try {
      const exists = await soundFileExists(file);
      if (exists) {
        // Preload by creating Audio element (browser caches it)
        new Audio(chrome.runtime.getURL(`assets/sounds/${file}`));
        console.log(`Preloaded sound: ${file}`);
      }
    } catch (error) {
      console.warn(`Failed to preload sound ${file}:`, error);
    }
  });

  await Promise.all(preloadPromises);
}

/**
 * Get available sounds list (for settings dropdown)
 */
export function getAvailableSounds(): NotificationSound[] {
  return Object.values(THEME_SOUNDS);
}
