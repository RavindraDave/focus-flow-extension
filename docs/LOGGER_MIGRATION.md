# Logger Migration Guide

## Overview

This guide shows how to migrate from `console.log/info/warn/error` to the centralized logging system.

## Benefits

1. **Structured Logging**: All logs have consistent format with timestamp, component, level
2. **Filterable**: Filter logs by level and component in the UI
3. **Exportable**: Export logs as JSON for analysis
4. **Environment-Aware**: Automatically adjusts verbosity based on dev/prod
5. **Persistent**: Optional log persistence to Chrome storage
6. **Performance**: No console overhead in production (unless ERROR level)

## Basic Usage

### Step 1: Import the logger

```typescript
import { createLogger } from '../utils/logger';

// Create a component-specific logger
const log = createLogger('BlockerEngine');
```

### Step 2: Replace console statements

**Before:**
```typescript
console.info('🚫 Blocking enabled');
console.error('Failed to sync block rules:', error);
console.log('Debug info:', data);
```

**After:**
```typescript
log.info('Blocking enabled');
log.error('Failed to sync block rules', error);
log.debug('Debug info', data);
```

## Migration Examples

### Example 1: blocker-engine.ts

**Before:**
```typescript
export class BlockerEngine {
  async syncRules(): Promise<void> {
    try {
      // ... sync logic ...

      if (process.env.NODE_ENV === 'development') {
        console.info(
          `✅ Synced ${chromeRules.length} rules (mode: ${isWhitelistMode ? 'whitelist' : 'blacklist'})`
        );
      }
    } catch (error) {
      throw new BlockerError('Failed to sync block rules');
    }
  }
}
```

**After:**
```typescript
import { createLogger } from '../utils/logger';

const log = createLogger('BlockerEngine');

export class BlockerEngine {
  async syncRules(): Promise<void> {
    try {
      // ... sync logic ...

      log.info('Rules synced', {
        count: chromeRules.length,
        mode: isWhitelistMode ? 'whitelist' : 'blacklist',
      });
    } catch (error) {
      log.error('Failed to sync block rules', error as Error);
      throw new BlockerError('Failed to sync block rules');
    }
  }
}
```

### Example 2: index.ts (Background Worker)

**Before:**
```typescript
class BackgroundServiceWorker {
  constructor() {
    // ... initialization ...

    if (process.env.NODE_ENV === 'development') {
      console.info('🚀 Focus Flow background service worker initialized');
    }
  }

  async initialize(): Promise<void> {
    // ... setup ...

    if (process.env.NODE_ENV === 'development') {
      console.info('✅ Background service worker ready');
    }
  }
}
```

**After:**
```typescript
import { createLogger } from '../utils/logger';

const log = createLogger('Background');

class BackgroundServiceWorker {
  constructor() {
    // ... initialization ...

    log.info('Background service worker initialized');
  }

  async initialize(): Promise<void> {
    // ... setup ...

    log.info('Background service worker ready');
  }
}
```

### Example 3: blocked-theme-init.js

**Before:**
```javascript
function loadAndApplyTheme() {
    try {
        chrome.storage.sync.get('visual_theme', function (result) {
            const theme = result.visual_theme || 'modern';
            document.body.setAttribute('data-theme', theme);
            console.log('[Blocked Page] Theme loaded:', theme);
        });
    } catch (error) {
        console.error('[Blocked Page] Failed to load theme:', error);
        document.body.setAttribute('data-theme', 'modern');
    }
}
```

**After:**
```javascript
import { createLogger } from './utils/logger';

const log = createLogger('BlockedPage');

function loadAndApplyTheme() {
    try {
        chrome.storage.sync.get('visual_theme', function (result) {
            const theme = result.visual_theme || 'modern';
            document.body.setAttribute('data-theme', theme);
            log.info('Theme loaded', { theme });
        });
    } catch (error) {
        log.error('Failed to load theme', error);
        document.body.setAttribute('data-theme', 'modern');
    }
}
```

## Advanced Features

### Timing Operations

```typescript
const endTime = log.time('syncRules');
// ... do work ...
endTime(); // Logs: "syncRules completed in 45ms"
```

### Tracing Async Operations

```typescript
await log.traced('Fetch timer status', async () => {
  return await this.timerEngine.getStatus();
});
// Automatically logs start, end, and errors
```

### Contextual Data

```typescript
log.info('Session completed', {
  sessionId: session.id,
  duration: session.duration,
  type: session.type,
});
```

## Configuration

### Set Log Level

```typescript
import { logger, LogLevel } from './utils/logger';

// Show only warnings and errors
logger.setLevel(LogLevel.WARN);
```

### Enable Persistence

```typescript
// Save logs to Chrome storage
logger.setPersistence(true);
```

### View Logs in UI

Add the LogViewer component to your options page:

```typescript
import { LogViewer } from './components/organisms/LogViewer';

function OptionsApp() {
  return (
    <div>
      {/* ... other tabs ... */}
      <LogViewer />
    </div>
  );
}
```

## Migration Checklist

- [ ] Import `createLogger` in each file
- [ ] Create component-specific logger instance
- [ ] Replace `console.log` → `log.debug`
- [ ] Replace `console.info` → `log.info`
- [ ] Replace `console.warn` → `log.warn`
- [ ] Replace `console.error` → `log.error`
- [ ] Remove `process.env.NODE_ENV === 'development'` checks (logger handles this)
- [ ] Add contextual data to log calls
- [ ] Add LogViewer to options page
- [ ] Test logging in development
- [ ] Verify logs don't appear in production

## Files to Migrate

### High Priority
- [x] `src/utils/logger.ts` - Created ✅
- [x] `src/components/organisms/LogViewer.tsx` - Created ✅
- [ ] `src/background/blocker-engine.ts`
- [ ] `src/background/index.ts`
- [ ] `src/background/timer-engine.ts`
- [ ] `src/background/analytics-tracker.ts`
- [ ] `src/background/schedule-manager.ts`
- [ ] `src/background/nuclear-mode-manager.ts`
- [ ] `src/background/streak-tracker.ts`

### Medium Priority
- [ ] `public/blocked-theme-init.js`
- [ ] `public/blocked.js`
- [ ] Component files with console statements

### Low Priority (Tests)
- [ ] Test files (can keep console for test output)

## Rollout Strategy

### Phase 1: Core Background Services (Week 1)
1. Migrate blocker-engine.ts
2. Migrate timer-engine.ts
3. Migrate index.ts
4. Add LogViewer to options page

### Phase 2: Analytics & Tracking (Week 2)
1. Migrate analytics-tracker.ts
2. Migrate streak-tracker.ts
3. Migrate schedule-manager.ts

### Phase 3: UI & Content Scripts (Week 3)
1. Migrate blocked page scripts
2. Migrate content scripts
3. Remove all development env checks

### Phase 4: Testing & Cleanup (Week 4)
1. Test log UI
2. Verify production log levels
3. Update documentation
4. Remove old console statements

## Testing

```typescript
// In development
const log = createLogger('Test');
log.debug('Debug message', { data: 123 });
log.info('Info message');
log.warn('Warning message');
log.error('Error message', new Error('Test error'));

// Check logs in UI
// Options → Debug Logs tab
```

## Production Behavior

In production:
- Only WARN and ERROR logs are emitted
- DEBUG and INFO are suppressed
- Logs are still captured in memory (last 1000)
- Can be exported if issues occur
- No performance overhead

## Questions?

See `/Users/ravindradave/Documents/Github/focus-flow-extension/src/utils/logger.ts` for full API documentation.
