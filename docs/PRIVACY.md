# Privacy Policy for Focus Flow

**Last Updated:** January 19, 2026

## 1. Introduction
Focus Flow ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension handles your data.

**Summary:** We do not collect, sell, or transmit your personal data. All processing happens locally on your device.

## 2. Data Collection and Usage

### No Remote Data Collection
Focus Flow does not transmit any data to external servers. We do not use third-party analytics (like Google Analytics) or tracking pixels.

### Local Data Storage
We save your preferences and settings locally on your computer using the Chrome Storage API (`chrome.storage.local`). This includes:
- Your timer settings (work/break intervals).
- Your lists of blocked websites.
- Your themes and visual preferences.
- Local statistics (e.g., "5 hours focused today") which are calculated and stored only on your device.

This data never leaves your browser instance.

## 3. Permissions Usage
To function, Focus Flow requires the following permissions for the stated purposes:

- **`storage`**: To save your settings and preferences locally.
- **`alarms`**: To run the Pomodoro timer reliably in the background.
- **`notifications`**: To alert you when a timer session ends.
- **`declarativeNetRequest`**: To block network requests to websites you have added to your blocklist.
- **`host_permissions` (<all_urls>)**: Required to check the URL of the tab you are currently visiting against your local blocklist. We do not browse, read, or change content on these sites beyond blocking access to the ones you specify.

## 4. User Rights
Since we do not hold your data, there is no data for us to delete or provide. You can clear all data stored by the extension by simple uninstalling it or clearing the extension's storage in your browser settings.

## 5. Changes to This Policy
We may update this policy to comply with legal requirements or if extension features change. The latest version will always be available at this URL.

## 6. Contact
If you have questions about this privacy policy, please contact us at:
**Email:** admin@r2dsolutions.com
