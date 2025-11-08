# Testing Standards - Focus Mode & Pomodoro Timer Extension

## Overview

This document defines testing requirements, strategies, and best practices. All code must meet these testing standards before merging to main branch.

**Testing Philosophy**: Write tests that provide confidence, not just coverage.

---

## Testing Pyramid

```
        ╱╲
       ╱E2╲      ~10% - End-to-End Tests
      ╱────╲     (Critical user flows)
     ╱      ╲
    ╱ Integ. ╲   ~30% - Integration Tests
   ╱──────────╲  (Component interactions)
  ╱            ╲
 ╱     Unit     ╲ ~60% - Unit Tests
╱────────────────╲ (Business logic, utilities)
```

---

## Coverage Requirements

### New Code (Enforced)
- **Line Coverage**: ≥80%
- **Branch Coverage**: ≥70% for core modules
- **Statement Coverage**: ≥80%

### Core Modules (Higher Standards)
- **Timer Engine**: ≥90% coverage
- **Blocker Engine**: ≥90% coverage
- **Storage Manager**: ≥85% coverage
- **Security Functions**: ≥95% coverage (crypto, validation)

### Overall Project
- **Current Target**: ≥70%
- **Long-term Goal**: ≥80%

### Excluded from Coverage
- Type definition files (`.types.ts`)
- Configuration files
- Test utilities
- Mock data

---

## Unit Testing

### Framework: Vitest

**Why Vitest**:
- Native ESM support
- Fast execution (parallelized)
- TypeScript-first
- Compatible with Jest API
- Built-in coverage (c8)

### Test Structure

#### AAA Pattern (Arrange, Act, Assert)
```typescript
// src/shared/utils/formatTime.test.ts
import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('should format seconds into MM:SS', () => {
    // Arrange
    const seconds = 125;
    
    // Act
    const result = formatTime(seconds);
    
    // Assert
    expect(result).toBe('02:05');
  });
  
  it('should pad single-digit minutes and seconds', () => {
    // Arrange
    const seconds = 65;
    
    // Act
    const result = formatTime(seconds);
    
    // Assert
    expect(result).toBe('01:05');
  });
  
  it('should handle zero seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });
  
  it('should handle negative seconds', () => {
    expect(formatTime(-10)).toBe('00:00');
  });
});
```

### Testing Async Code

```typescript
// src/background/storage/StorageManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from './StorageManager';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        return Promise.resolve(
          typeof keys === 'string' 
            ? { [keys]: mockStorage[keys] }
            : Object.fromEntries(
                Object.keys(keys).map(k => [k, mockStorage[k]])
              )
        );
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => delete mockStorage[key]);
        return Promise.resolve();
      }),
    },
  },
} as any;

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });
  
  it('should save and retrieve data', async () => {
    // Arrange
    const manager = new StorageManager();
    const testData = { id: '123', name: 'Test Session' };
    
    // Act
    await manager.save('session', testData);
    const retrieved = await manager.get('session');
    
    // Assert
    expect(retrieved).toEqual(testData);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ session: testData });
  });
  
  it('should return null for non-existent keys', async () => {
    const manager = new StorageManager();
    const result = await manager.get('nonexistent');
    
    expect(result).toBeNull();
  });
  
  it('should delete data', async () => {
    // Arrange
    const manager = new StorageManager();
    await manager.save('session', { id: '123' });
    
    // Act
    await manager.delete('session');
    const result = await manager.get('session');
    
    // Assert
    expect(result).toBeNull();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('session');
  });
});
```

### Testing React Components

```typescript
// src/popup/components/Timer/TimerDisplay.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from './TimerDisplay';
import { useTimer } from '@/hooks/useTimer';

// Mock the hook
vi.mock('@/hooks/useTimer');

describe('TimerDisplay', () => {
  it('should display formatted time', () => {
    // Arrange
    vi.mocked(useTimer).mockReturnValue({
      remainingSeconds: 1500, // 25 minutes
      isRunning: true,
      sessionType: 'work',
      startPomodoro: vi.fn(),
      pausePomodoro: vi.fn(),
      resetPomodoro: vi.fn(),
    });
    
    // Act
    render(<TimerDisplay />);
    
    // Assert
    expect(screen.getByRole('timer')).toHaveTextContent('25:00');
  });
  
  it('should use red color for work sessions', () => {
    vi.mocked(useTimer).mockReturnValue({
      remainingSeconds: 1500,
      isRunning: true,
      sessionType: 'work',
      startPomodoro: vi.fn(),
      pausePomodoro: vi.fn(),
      resetPomodoro: vi.fn(),
    });
    
    render(<TimerDisplay />);
    
    const timer = screen.getByRole('timer');
    expect(timer).toHaveClass('text-red-500');
  });
  
  it('should use green color for break sessions', () => {
    vi.mocked(useTimer).mockReturnValue({
      remainingSeconds: 300,
      isRunning: true,
      sessionType: 'short-break',
      startPomodoro: vi.fn(),
      pausePomodoro: vi.fn(),
      resetPomodoro: vi.fn(),
    });
    
    render(<TimerDisplay />);
    
    const timer = screen.getByRole('timer');
    expect(timer).toHaveClass('text-green-500');
  });
  
  it('should have accessible ARIA attributes', () => {
    vi.mocked(useTimer).mockReturnValue({
      remainingSeconds: 1500,
      isRunning: true,
      sessionType: 'work',
      startPomodoro: vi.fn(),
      pausePomodoro: vi.fn(),
      resetPomodoro: vi.fn(),
    });
    
    render(<TimerDisplay />);
    
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live', 'polite');
    expect(timer).toHaveAttribute('aria-atomic', 'true');
  });
});
```

### Test Data Factories

```typescript
// tests/factories/session.factory.ts
import { TimerSession } from '@/shared/types/storage.types';

export function createMockSession(
  overrides?: Partial<TimerSession>
): TimerSession {
  return {
    id: crypto.randomUUID(),
    type: 'work',
    duration: 1500,
    startTime: Date.now(),
    status: 'active',
    ...overrides,
  };
}

// Usage in tests
const session = createMockSession({ type: 'short-break', duration: 300 });
```

---

## Integration Testing

### Testing Component Interactions

```typescript
// tests/integration/timer-blocker.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerEngine } from '@/background/timer/TimerEngine';
import { BlockerEngine } from '@/background/blocker/BlockerEngine';
import { StorageManager } from '@/background/storage/StorageManager';

describe('Timer + Blocker Integration', () => {
  let timer: TimerEngine;
  let blocker: BlockerEngine;
  let storage: StorageManager;
  
  beforeEach(() => {
    storage = new StorageManager();
    blocker = BlockerEngine.getInstance();
    timer = TimerEngine.getInstance();
    
    // Mock chrome.alarms
    vi.spyOn(chrome.alarms, 'create').mockResolvedValue(undefined);
  });
  
  it('should activate blocker when Pomodoro starts', async () => {
    // Arrange
    const activateSpy = vi.spyOn(blocker, 'activateRules');
    
    // Act
    await timer.startPomodoro('Test Task');
    
    // Assert
    expect(activateSpy).toHaveBeenCalled();
  });
  
  it('should deactivate blocker during breaks', async () => {
    // Arrange
    await timer.startPomodoro();
    const deactivateSpy = vi.spyOn(blocker, 'deactivateRules');
    
    // Simulate session end
    await timer['endSession']();
    
    // Act
    await timer.startBreak();
    
    // Assert
    expect(deactivateSpy).toHaveBeenCalled();
  });
  
  it('should re-activate blocker after break ends', async () => {
    // Arrange
    await timer.startPomodoro();
    await timer.startBreak();
    const activateSpy = vi.spyOn(blocker, 'activateRules');
    
    // Act
    await timer.endBreak();
    
    // Assert
    expect(activateSpy).toHaveBeenCalled();
  });
});
```

### Testing Storage Migrations

```typescript
// tests/integration/storage-migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { migrateIfNeeded, migrations } from '@/background/storage/migrations';

describe('Storage Migrations', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });
  
  it('should migrate from v0 to current version', async () => {
    // Arrange: Set old schema data
    await chrome.storage.local.set({
      blocklist: ['youtube.com'], // Old format
      // No version field
    });
    
    // Act
    await migrateIfNeeded();
    
    // Assert
    const data = await chrome.storage.local.get();
    expect(data.version).toBe(3); // Current version
    expect(data.blocklist).toBeDefined();
  });
  
  it('should not re-run migrations if already at current version', async () => {
    // Arrange
    await chrome.storage.local.set({ version: 3 });
    const migrationSpy = vi.spyOn(migrations, '3');
    
    // Act
    await migrateIfNeeded();
    
    // Assert
    expect(migrationSpy).not.toHaveBeenCalled();
  });
  
  it('should preserve existing data during migration', async () => {
    // Arrange
    await chrome.storage.local.set({
      version: 1,
      blocklist: ['youtube.com', 'reddit.com'],
      sessions: [{ id: '123', type: 'work' }],
    });
    
    // Act
    await migrateIfNeeded();
    
    // Assert
    const data = await chrome.storage.local.get();
    expect(data.blocklist).toContain('youtube.com');
    expect(data.sessions).toHaveLength(1);
  });
});
```

---

## End-to-End Testing

### Framework: Playwright

**Why Playwright**:
- Chrome extension support
- Multi-browser testing
- Fast and reliable
- Excellent DevTools integration

### Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Extensions need sequential tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // One worker for extension tests
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Load extension
        launchOptions: {
          args: [
            `--disable-extensions-except=./dist`,
            `--load-extension=./dist`,
          ],
        },
      },
    },
  ],
});
```

### E2E Test Examples

```typescript
// tests/e2e/pomodoro-cycle.spec.ts
import { test, expect, chromium } from '@playwright/test';

test.describe('Complete Pomodoro Cycle', () => {
  test('should complete work → break → work cycle', async () => {
    // Launch browser with extension
    const browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=./dist`,
        `--load-extension=./dist`,
      ],
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Get extension ID
    const extensionId = await page.evaluate(() => {
      return chrome.runtime.id;
    });
    
    // Navigate to popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Start Pomodoro
    await page.click('button:has-text("Start Pomodoro")');
    
    // Verify timer is running
    const timer = page.locator('[role="timer"]');
    await expect(timer).toContainText('25:00');
    
    // Verify badge shows countdown
    const badge = await page.evaluate(() => {
      return chrome.action.getBadgeText({});
    });
    expect(badge).toBe('25');
    
    // Fast-forward time (for testing, use short duration)
    await page.evaluate(() => {
      chrome.alarms.create('pomodoro_end', { when: Date.now() + 100 });
    });
    
    // Wait for break to start
    await page.waitForSelector('text=Break Active', { timeout: 5000 });
    
    // Verify break timer
    await expect(timer).toContainText('05:00');
    
    await browser.close();
  });
});
```

```typescript
// tests/e2e/website-blocking.spec.ts
import { test, expect, chromium } from '@playwright/test';

test.describe('Website Blocking', () => {
  test('should block YouTube when in focus mode', async () => {
    const browser = await chromium.launch({
      args: [
        `--disable-extensions-except=./dist`,
        `--load-extension=./dist`,
      ],
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Configure block list
    const extensionId = await page.evaluate(() => chrome.runtime.id);
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Add YouTube to block list
    await page.fill('input[placeholder="Enter website"]', 'youtube.com');
    await page.click('button:has-text("Add Site")');
    
    // Start Pomodoro
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button:has-text("Start Pomodoro")');
    
    // Try to access YouTube
    const blockedPage = await context.newPage();
    await blockedPage.goto('https://www.youtube.com');
    
    // Verify redirect to block page
    await expect(blockedPage).toHaveURL(new RegExp(`chrome-extension://${extensionId}/blocked.html`));
    
    // Verify block message
    await expect(blockedPage.locator('h1')).toContainText('Site Blocked');
    
    await browser.close();
  });
  
  test('should allow YouTube during breaks', async () => {
    const browser = await chromium.launch({
      args: [
        `--disable-extensions-except=./dist`,
        `--load-extension=./dist`,
      ],
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const extensionId = await page.evaluate(() => chrome.runtime.id);
    
    // Add YouTube to block list
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.fill('input[placeholder="Enter website"]', 'youtube.com');
    await page.click('button:has-text("Add Site")');
    
    // Start Pomodoro and force-end it (start break)
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.click('button:has-text("Start Pomodoro")');
    
    // Fast-forward to break
    await page.evaluate(() => {
      chrome.runtime.sendMessage({ type: 'TIMER_SKIP_TO_BREAK' });
    });
    
    // Wait for break to start
    await page.waitForSelector('text=Break Active');
    
    // Try to access YouTube (should succeed)
    const youtubePage = await context.newPage();
    await youtubePage.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded' });
    
    // Verify NOT redirected
    await expect(youtubePage).toHaveURL(/youtube\.com/);
    
    await browser.close();
  });
});
```

---

## Performance Testing

### Memory Leak Detection

```typescript
// tests/performance/memory-leak.test.ts
import { test, expect } from 'vitest';
import { TimerEngine } from '@/background/timer/TimerEngine';

test('should not leak memory after 100 Pomodoro cycles', async () => {
  const timer = TimerEngine.getInstance();
  
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Run 100 cycles
  for (let i = 0; i < 100; i++) {
    await timer.startPomodoro(`Task ${i}`);
    await timer.endSession();
  }
  
  // Force garbage collection (requires --expose-gc flag)
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryGrowth = finalMemory - initialMemory;
  
  // Allow max 5MB growth for 100 sessions
  expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
});
```

### Load Testing

```typescript
// tests/performance/load.test.ts
import { test, expect } from 'vitest';
import { BlockerEngine } from '@/background/blocker/BlockerEngine';

test('should handle 1000 blocked sites without performance degradation', async () => {
  const blocker = BlockerEngine.getInstance();
  
  // Generate 1000 mock sites
  const sites = Array.from({ length: 1000 }, (_, i) => ({
    pattern: `example${i}.com`,
    type: 'domain' as const,
  }));
  
  const startTime = performance.now();
  
  await blocker.updateBlockList(sites);
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Should complete in less than 500ms
  expect(duration).toBeLessThan(500);
  
  // Verify rules are active
  const rules = await blocker.getActiveRules();
  expect(rules).toHaveLength(1000);
});
```

---

## Test Organization

### Directory Structure

```
tests/
├── unit/                       # Unit tests (mirror src/ structure)
│   ├── background/
│   │   ├── timer/
│   │   │   └── TimerEngine.test.ts
│   │   ├── blocker/
│   │   │   └── BlockerEngine.test.ts
│   │   └── storage/
│   │       └── StorageManager.test.ts
│   ├── popup/
│   │   └── components/
│   │       └── Timer/
│   │           └── TimerDisplay.test.tsx
│   └── shared/
│       └── utils/
│           ├── formatTime.test.ts
│           └── validation.test.ts
├── integration/                # Integration tests
│   ├── timer-blocker.test.ts
│   ├── storage-migration.test.ts
│   └── analytics-calculation.test.ts
├── e2e/                        # End-to-end tests
│   ├── pomodoro-cycle.spec.ts
│   ├── website-blocking.spec.ts
│   ├── nuclear-mode.spec.ts
│   └── analytics-dashboard.spec.ts
├── performance/                # Performance tests
│   ├── memory-leak.test.ts
│   └── load.test.ts
├── fixtures/                   # Test data
│   ├── sessions.json
│   └── block-lists.json
└── helpers/                    # Test utilities
    ├── setup.ts
    └── mocks/
        ├── chrome-api.ts
        └── storage.ts
```

### Naming Conventions

- Unit tests: `*.test.ts` or `*.spec.ts`
- E2E tests: `*.spec.ts` (Playwright convention)
- Test files mirror source file names

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - name: Install Playwright
        run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:watch": "vitest watch",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## Best Practices

### Do's ✅

1. **Test Behavior, Not Implementation**
   ```typescript
   // ✅ GOOD: Tests behavior
   it('should show error when invalid URL is added', async () => {
     await addSite('not-a-url');
     expect(screen.getByRole('alert')).toHaveTextContent('Invalid URL');
   });
   
   // ❌ BAD: Tests implementation
   it('should call validateURL function', async () => {
     const spy = vi.spyOn(utils, 'validateURL');
     await addSite('example.com');
     expect(spy).toHaveBeenCalled();
   });
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ✅ GOOD
   it('should format 125 seconds as "02:05"', () => { ... });
   
   // ❌ BAD
   it('works', () => { ... });
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should increment streak on daily check-in', async () => {
     // Arrange
     const initialStreak = 5;
     await setStreak(initialStreak);
     
     // Act
     await performDailyCheckIn();
     
     // Assert
     const newStreak = await getStreak();
     expect(newStreak).toBe(6);
   });
   ```

4. **Test Edge Cases**
   ```typescript
   describe('formatTime', () => {
     it('should handle zero', () => { ... });
     it('should handle negative numbers', () => { ... });
     it('should handle very large numbers', () => { ... });
   });
   ```

5. **Use Test Factories**
   ```typescript
   const session = createMockSession({ duration: 300 });
   ```

### Don'ts ❌

1. **Don't Test Third-Party Libraries**
   ```typescript
   // ❌ BAD: Testing React, not our code
   it('should call useState', () => {
     const spy = vi.spyOn(React, 'useState');
     render(<TimerDisplay />);
     expect(spy).toHaveBeenCalled();
   });
   ```

2. **Don't Use Magic Numbers**
   ```typescript
   // ❌ BAD
   expect(result).toBe(1500);
   
   // ✅ GOOD
   const POMODORO_DURATION = 25 * 60;
   expect(result).toBe(POMODORO_DURATION);
   ```

3. **Don't Share State Between Tests**
   ```typescript
   // ❌ BAD: Shared state
   let sharedVariable = 0;
   
   it('test 1', () => {
     sharedVariable++;
   });
   
   it('test 2', () => {
     expect(sharedVariable).toBe(1); // Flaky!
   });
   
   // ✅ GOOD: Clean state
   beforeEach(() => {
     sharedVariable = 0;
   });
   ```

4. **Don't Test Multiple Things in One Test**
   ```typescript
   // ❌ BAD
   it('should start timer and update badge and save to storage', () => {
     // Testing 3 things
   });
   
   // ✅ GOOD: Separate tests
   it('should start timer', () => { ... });
   it('should update badge when timer starts', () => { ... });
   it('should save session to storage', () => { ... });
   ```

---

## Code Review Checklist

### Before Submitting PR
- [ ] All tests pass locally
- [ ] New code has ≥80% coverage
- [ ] Edge cases tested
- [ ] Integration tests added for new features
- [ ] E2E tests added for critical flows
- [ ] No flaky tests (run suite 3 times)

### During Review
- [ ] Tests are readable and well-named
- [ ] No unnecessary mocking
- [ ] Tests verify behavior, not implementation
- [ ] Test data is realistic
- [ ] Performance impact assessed

---

**Document End**  
All new code must include tests meeting these standards.
