/**
 * Blocked Page Theme Tests
 *
 * Tests for the blocked page theme system including:
 * - Theme loading from chrome.storage on page load
 * - Real-time theme updates via storage listener
 * - All three theme rendering (modern, zen, cyber)
 * - Theme-specific visual effects
 * - Error handling and fallback
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Mock chrome API
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `/mocked/${path}`),
  },
};

describe('Blocked Page Theme System', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;
  let storageChangeListeners: Array<(changes: any, areaName: string) => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    storageChangeListeners = [];

    // Read the actual blocked.html file
    const blockedHtmlPath = path.resolve(__dirname, '../../public/blocked.html');
    const blockedHtml = fs.readFileSync(blockedHtmlPath, 'utf-8');

    // Create virtual console to suppress CSS/JS loading errors
    const virtualConsole = new VirtualConsole();
    (virtualConsole as any).sendTo(console, { omitJSDOMErrors: true });

    // Create JSDOM instance with error suppression for resource loading
    dom = new JSDOM(blockedHtml, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'chrome-extension://fake-extension-id/blocked.html?url=https://example.com',
      virtualConsole,
    });

    document = dom.window.document;
    window = dom.window as unknown as Window & typeof globalThis;

    // Setup chrome API mock in window
    (window as any).chrome = mockChrome;

    // Default storage mock
    mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
      callback({ visual_theme: 'modern' });
    });

    // Mock storage change listener
    mockChrome.storage.onChanged.addListener.mockImplementation((listener: any) => {
      storageChangeListeners.push(listener);
    });
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Theme Loading on Page Load', () => {
    it('should load theme from chrome.storage.sync on initialization', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        expect(_keys).toBe('visual_theme');
        callback({ visual_theme: 'cyber' });

        // Wait for script to execute
        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe('cyber');
          done();
        }, 100);
      });

      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }));

    it('should apply modern theme by default when no stored theme exists', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({}); // Empty result

        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe('modern');
          done();
        }, 100);
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }));

    it('should apply zen theme when stored in chrome.storage', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'zen' });

        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe('zen');
          done();
        }, 100);
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }));

    it('should set data-theme attribute on body element', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });

        setTimeout(() => {
          expect(document.body.hasAttribute('data-theme')).toBe(true);
          expect(document.body.getAttribute('data-theme')).toBeTruthy();
          done();
        }, 100);
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }));
  });

  describe('Real-Time Theme Updates', () => {
    it('should register storage change listener on initialization', () => new Promise<void>(done => {
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
        expect(storageChangeListeners.length).toBeGreaterThan(0);
        done();
      }, 100);
    }));

    it('should update data-theme when visual_theme changes in storage', () => new Promise<void>(done => {
      // Initialize with modern theme
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('modern');

        // Simulate storage change to cyber theme
        const changes = {
          visual_theme: {
            oldValue: 'modern',
            newValue: 'cyber',
          },
        };

        storageChangeListeners.forEach(listener => {
          listener(changes, 'sync');
        });

        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe('cyber');
          done();
        }, 50);
      }, 100);
    }));

    it('should update to zen theme when changed from modern', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        const changes = {
          visual_theme: {
            oldValue: 'modern',
            newValue: 'zen',
          },
        };

        storageChangeListeners.forEach(listener => {
          listener(changes, 'sync');
        });

        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe('zen');
          done();
        }, 50);
      }, 100);
    }));

    it('should only respond to sync storage area changes', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        const initialTheme = document.body.getAttribute('data-theme');

        // Try to change via 'local' storage area (should be ignored)
        const changes = {
          visual_theme: {
            oldValue: 'modern',
            newValue: 'cyber',
          },
        };

        storageChangeListeners.forEach(listener => {
          listener(changes, 'local');
        });

        setTimeout(() => {
          // Theme should not change for 'local' area
          expect(document.body.getAttribute('data-theme')).toBe(initialTheme);
          done();
        }, 50);
      }, 100);
    }));

    it('should ignore changes to other storage keys', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        const initialTheme = document.body.getAttribute('data-theme');

        // Change a different storage key
        const changes = {
          nuclear_mode: {
            oldValue: false,
            newValue: true,
          },
        };

        storageChangeListeners.forEach(listener => {
          listener(changes, 'sync');
        });

        setTimeout(() => {
          expect(document.body.getAttribute('data-theme')).toBe(initialTheme);
          done();
        }, 50);
      }, 100);
    }));
  });

  describe('Theme Rendering - All Themes', () => {
    it('should render modern theme correctly', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('modern');

        // Modern theme should not have special pseudo-elements

        // For modern theme, the ::before pseudo-element should not apply
        expect(document.body.getAttribute('data-theme')).not.toBe('cyber');
        done();
      }, 100);
    }));

    it('should render zen theme correctly', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'zen' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('zen');

        // Zen theme should apply organic shapes to .container
        const container = document.querySelector('.container');
        expect(container).toBeTruthy();
        done();
      }, 100);
    }));

    it('should render cyber theme correctly', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'cyber' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('cyber');

        // Cyber theme should have scanline effect via body::before pseudo-element
        // We can't directly test pseudo-elements, but we can verify the attribute
        expect(document.body.getAttribute('data-theme')).toBe('cyber');
        done();
      }, 100);
    }));
  });

  describe('Theme-Specific Visual Effects', () => {
    it('should apply cyber scanline effect via CSS', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'cyber' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('cyber');

        // Check that the style tag exists with cyber-specific CSS
        const styleTags = Array.from(document.querySelectorAll('style'));
        const hasCyberStyles = styleTags.some(style =>
          style.textContent?.includes('[data-theme=\'cyber\'] body::before')
        );
        expect(hasCyberStyles).toBe(true);
        done();
      }, 100);
    }));

    it('should apply zen organic shapes via CSS', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'zen' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(document.body.getAttribute('data-theme')).toBe('zen');

        // Check that the style tag exists with zen-specific CSS
        const styleTags = Array.from(document.querySelectorAll('style'));
        const hasZenStyles = styleTags.some(style =>
          style.textContent?.includes('[data-theme=\'zen\'] .container')
        );
        expect(hasZenStyles).toBe(true);
        done();
      }, 100);
    }));

    it('should have CSS custom properties for theming', () => {
      const styleTags = Array.from(document.querySelectorAll('style'));
      const hasCustomProps = styleTags.some(style =>
        style.textContent?.includes('var(--')
      );
      expect(hasCustomProps).toBe(true);
    });

    it('should use CSS variables for colors and fonts', () => {
      const styleTags = Array.from(document.querySelectorAll('style'));
      const styleContent = styleTags.map(s => s.textContent).join('\n');

      // Check for key CSS variables
      expect(styleContent).toContain('var(--bg-primary)');
      expect(styleContent).toContain('var(--text-primary)');
      expect(styleContent).toContain('var(--accent-primary)');
      expect(styleContent).toContain('var(--font-body)');
    });
  });

  describe('Error Handling', () => {
    it('should fallback to modern theme when chrome.storage throws error', () => new Promise<void>(done => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockChrome.storage.sync.get.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        // Should fallback to modern theme
        expect(document.body.getAttribute('data-theme')).toBe('modern');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Blocked Page] Failed to load theme'),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
        done();
      }, 100);
    }));

    it('should handle storage listener setup errors gracefully', () => new Promise<void>(done => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockChrome.storage.onChanged.addListener.mockImplementation(() => {
        throw new Error('Listener setup failed');
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Blocked Page] Failed to setup theme listener'),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
        done();
      }, 100);
    }));

    it('should log theme loading to console', () => new Promise<void>(done => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'zen' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('[Blocked Page] Theme loaded:', 'zen');

        consoleLogSpy.mockRestore();
        done();
      }, 100);
    }));

    it('should log theme changes to console', () => new Promise<void>(done => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        consoleLogSpy.mockClear();

        const changes = {
          visual_theme: {
            oldValue: 'modern',
            newValue: 'cyber',
          },
        };

        storageChangeListeners.forEach(listener => {
          listener(changes, 'sync');
        });

        setTimeout(() => {
          expect(consoleLogSpy).toHaveBeenCalledWith('[Blocked Page] Theme changed to:', 'cyber');

          consoleLogSpy.mockRestore();
          done();
        }, 50);
      }, 100);
    }));
  });

  describe('Page Structure', () => {
    it('should have body element with initial data-theme attribute', () => {
      expect(document.body).toBeTruthy();
      expect(document.body.hasAttribute('data-theme')).toBe(true);
      // Default attribute in HTML is 'modern'
      expect(document.body.getAttribute('data-theme')).toBe('modern');
    });

    it('should have theme CSS files linked in head', () => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const hasThemesCSS = links.some(link =>
        link.getAttribute('href')?.includes('themes')
      );
      expect(hasThemesCSS).toBe(true);
    });

    it('should have main container element', () => {
      const container = document.querySelector('.container');
      expect(container).toBeTruthy();
    });

    it('should have all required content elements', () => {
      expect(document.getElementById('site-name')).toBeTruthy();
      expect(document.getElementById('timer')).toBeTruthy();
      expect(document.getElementById('progress')).toBeTruthy();
      expect(document.getElementById('streak')).toBeTruthy();
      expect(document.getElementById('focus-time')).toBeTruthy();
      expect(document.getElementById('pomodoros')).toBeTruthy();
    });
  });

  describe('Initialization Timing', () => {
    it('should initialize when document is already loaded', () => new Promise<void>(done => {
      // Create a new DOM with readyState = 'complete'
      const completeDom = new JSDOM(
        fs.readFileSync(path.resolve(__dirname, '../../public/blocked.html'), 'utf-8'),
        {
          runScripts: 'dangerously',
          resources: 'usable',
          url: 'chrome-extension://fake-extension-id/blocked.html',
        }
      );

      const completeDoc = completeDom.window.document;
      Object.defineProperty(completeDoc, 'readyState', {
        value: 'complete',
        writable: true,
      });

      (completeDom.window as any).chrome = mockChrome;

      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'cyber' });

        setTimeout(() => {
          expect(completeDoc.body.getAttribute('data-theme')).toBe('cyber');
          completeDom.window.close();
          done();
        }, 100);
      });

      // Script should execute immediately since readyState is 'complete'
      const event = new completeDom.window.Event('load');
      completeDom.window.dispatchEvent(event);
    }));

    it('should wait for DOMContentLoaded when document is loading', () => new Promise<void>(done => {
      mockChrome.storage.sync.get.mockImplementation((_keys: string | string[], callback: (result: any) => void) => {
        callback({ visual_theme: 'modern' });
      });

      // Dispatch DOMContentLoaded event
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        // Verify that theme loading was triggered
        expect(mockChrome.storage.sync.get).toHaveBeenCalled();
        expect(document.body.getAttribute('data-theme')).toBeTruthy();
        done();
      }, 100);
    }));
  });

  describe('Accessibility - Reduced Motion', () => {
    it('should have prefers-reduced-motion media query styles', () => {
      const styleTags = Array.from(document.querySelectorAll('style'));
      const styleContent = styleTags.map(s => s.textContent).join('\n');

      expect(styleContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should disable animations for reduced motion preference', () => {
      const styleTags = Array.from(document.querySelectorAll('style'));
      const styleContent = styleTags.map(s => s.textContent).join('\n');

      // Should disable icon animation
      expect(styleContent).toContain('animation: none');

      // Should hide cyber scanline effect
      expect(styleContent).toContain('display: none');
    });
  });
});
