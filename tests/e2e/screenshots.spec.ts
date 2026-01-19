
import { test, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(process.cwd(), 'dist');

test.describe('Store Screenshots', () => {
    test('capture flow', async () => {
        // 1. Launch with extension
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
                '--window-size=1280,900',
                '--force-dark-mode' // Capture in dark mode for "Pro" look
            ],
        });

        // 2. Wait for Service Worker to be ready to get Extension ID
        let serviceWorker = context.serviceWorkers()[0];
        if (!serviceWorker) {
            const page = await context.newPage();
            await page.waitForTimeout(1000);
            serviceWorker = context.serviceWorkers()[0];
        }

        if (!serviceWorker) {
            console.error("Could not find extension service worker to determine ID");
            return;
        }

        const extensionId = serviceWorker.url().split('/')[2];
        console.log(`Extension ID: ${extensionId}`);

        const themes = [
            { id: 'modern', name: 'Modern Pro', label: '1_modern' },
            { id: 'zen', name: 'Zen Mode', label: '2_zen' },
            { id: 'cyber', name: 'Cyber Focus', label: '3_cyber' }
        ];

        const page = await context.newPage();

        for (const theme of themes) {
            console.log(`Capturing theme: ${theme.name}`);

            // 1. Set Theme via Timer Settings
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await page.getByText('Timer Settings').click();
            await page.getByRole('button', { name: theme.name }).click();
            await page.waitForTimeout(500); // Wait for theme to apply

            // 2. Screenshot: Dashboard
            await page.getByText('Dashboard').click();
            await page.waitForTimeout(500); // Wait for transition
            await page.screenshot({ path: `screenshots/${theme.label}_dashboard.png`, fullPage: true });

            // 3. Screenshot: Popup
            // Open popup in a new page to capture it with the correct theme context
            const popupPage = await context.newPage();
            await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
            await popupPage.setViewportSize({ width: 380, height: 600 });
            await popupPage.waitForTimeout(500);
            await popupPage.screenshot({ path: `screenshots/${theme.label}_popup.png` });
            await popupPage.close();
        }

        // Capture specific features using the last set theme (Cyber is good for tech vibes)
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // Blocking Rules
        await page.getByText('Blocking Rules').click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/4_blocking_rules.png', fullPage: true });

        // Premium Features
        await page.getByText('Help & Guide').click();
        await page.getByText('✨ Premium').click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/5_premium_features.png', fullPage: true });

        await context.close();
    });
});
