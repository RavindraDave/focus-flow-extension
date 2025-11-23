# Theme-Specific Notification Sounds

This directory contains audio files for timer notifications, customized per visual theme.

## Required Sound Files

### 1. Modern Pro Theme
**File**: `modern-ping.mp3`
- **Description**: Clean, professional notification sound
- **Characteristics**:
  - Short (0.5-1 second)
  - Soft ping or chime
  - Medium-high frequency (800-1200 Hz)
  - Not jarring, suitable for office environment
- **Example**: Marimba notification, soft bell
- **Download from**: [Freesound.org](https://freesound.org/) or [Zapsplat](https://www.zapsplat.com/) (free with attribution)

### 2. Zen Mode Theme
**File**: `zen-bowl.mp3`
- **Description**: Calming, meditative notification
- **Characteristics**:
  - Singing bowl or temple bell
  - Resonant, peaceful
  - Fades naturally
  - Duration: 1-2 seconds
- **Example**: Tibetan singing bowl, meditation bell
- **Download from**: Freesound.org (search "singing bowl" or "meditation bell")

### 3. Cyber Focus Theme
**File**: `cyber-beep.mp3`
- **Description**: Futuristic, synthetic notification
- **Characteristics**:
  - Short (0.3-0.5 seconds)
  - Synthetic/digital sound
  - Sharp, precise
  - Sci-fi aesthetic
- **Example**: Terminal beep, system notification, retro game sound
- **Download from**: Freesound.org (search "beep" or "system notification")

## Audio Specifications

All audio files should meet these requirements:

- **Format**: MP3 (for best browser compatibility)
- **Bitrate**: 128 kbps (balance of quality and file size)
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono (stereo not necessary for notifications)
- **Normalization**: -3 dB peak to prevent clipping
- **File Size**: < 50 KB each
- **Licensing**: CC0, CC-BY, or royalty-free

## Installation

1. Download or create the three sound files
2. Name them exactly as specified above
3. Place them in this directory (`/public/assets/sounds/`)
4. Ensure files are under 50 KB each
5. Test in browser: `new Audio('/assets/sounds/modern-ping.mp3').play()`

## Usage in Code

```typescript
// Get current theme
const theme = await chrome.storage.sync.get('visual_theme');

// Map theme to sound file
const soundMap = {
  modern: 'modern-ping.mp3',
  zen: 'zen-bowl.mp3',
  cyber: 'cyber-beep.mp3',
};

// Play theme-appropriate sound
const audio = new Audio(`/assets/sounds/${soundMap[theme.visual_theme || 'modern']}`);
audio.volume = 0.5; // 50% volume
audio.play();
```

## Manifest Configuration

Add to `manifest.json` web_accessible_resources:

```json
"web_accessible_resources": [
  {
    "resources": [
      "assets/sounds/*.mp3"
    ],
    "matches": ["<all_urls>"]
  }
]
```

## Testing

Test each sound:
```javascript
// Modern
new Audio('/assets/sounds/modern-ping.mp3').play();

// Zen
new Audio('/assets/sounds/zen-bowl.mp3').play();

// Cyber
new Audio('/assets/sounds/cyber-beep.mp3').play();
```

## Fallback

If sound files are missing, the extension should:
1. Check if file exists before playing
2. Fail silently (no error to user)
3. Show console warning for developers

## Accessibility

- Respect user's notification preferences
- Provide volume control (0-100%)
- Allow disabling sounds completely
- Consider hearing impairments (visual notifications too)

## Attribution

If using CC-BY licensed sounds, add attribution to:
- `CREDITS.md` in repository root
- Chrome Web Store description
- About section in extension

## Future Enhancements

- Custom sound upload
- Volume slider per theme
- Multiple sound options per theme
- Test sound button in settings
