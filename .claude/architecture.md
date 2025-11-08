# Architecture Standards - Focus Mode & Pomodoro Timer Extension

## System Architecture Overview

### Extension Type
Chrome Extension (Manifest V3) - Client-side only, local-first architecture

### Core Architectural Principles

1. **Local-First**: All data stored in `chrome.storage.local` by default (no external servers required)
2. **Privacy-Preserving**: Zero telemetry, no analytics tracking, optional cloud features are opt-in
3. **Event-Driven**: Service worker handles events, communicates with UI via message passing
4. **Stateless UI**: Popup React components derive state from storage, no in-memory state
5. **Defensive**: Assume Chrome can suspend service worker anytime, all state must be persisted

---

## Technology Stack

### Core Technologies
```yaml
language: TypeScript 5.3+
framework: React 18.2+
build_tool: Vite 5.0+
manifest_version: 3
ui_library: Tailwind CSS 3.4+
charts: Chart.js 4.4+
icons: Lucide React 0.263+
state_management: Zustand 4.4+
```

### Chrome APIs Used
- `chrome.declarativeNetRequest` - Website blocking (MV3 compliant)
- `chrome.storage.local` - Primary data persistence (unlimited quota)
- `chrome.storage.sync` - Optional settings sync (cross-device, 100KB limit)
- `chrome.alarms` - Timers and scheduled tasks (survives suspension)
- `chrome.tabs` - Tab tracking for context detection
- `chrome.action` - Badge updates and popup control
- `chrome.notifications` - Desktop notifications
- `chrome.runtime` - Message passing between components

---

## Directory Structure

```
focus-pomodoro-extension/
├── .claude/                    # Claude Code configuration
│   ├── architecture.md         # This file
│   ├── coding-standards.md     # Code quality rules
│   ├── security-standards.md   # OWASP ASVS implementation
│   ├── testing-standards.md    # Testing requirements
│   └── ui-ux-standards.md      # Design system
├── src/
│   ├── background/             # Service worker
│   │   ├── index.ts            # Entry point
│   │   ├── blocker/            # Website blocking engine
│   │   │   ├── BlockerEngine.ts
│   │   │   ├── BlockListManager.ts
│   │   │   ├── ScheduleManager.ts
│   │   │   └── NuclearMode.ts
│   │   ├── timer/              # Pomodoro timer engine
│   │   │   ├── TimerEngine.ts
│   │   │   ├── SessionManager.ts
│   │   │   └── AlarmHandler.ts
│   │   ├── analytics/          # Analytics calculation
│   │   │   ├── AnalyticsEngine.ts
│   │   │   ├── MetricsCalculator.ts
│   │   │   └── DataAggregator.ts
│   │   ├── storage/            # Storage abstraction
│   │   │   ├── StorageManager.ts
│   │   │   ├── migrations/     # Schema migrations
│   │   │   └── validators/     # Data validation
│   │   └── messaging/          # Message handlers
│   │       └── MessageRouter.ts
│   ├── popup/                  # React popup UI
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Root component
│   │   ├── components/         # Reusable components
│   │   │   ├── Timer/
│   │   │   │   ├── TimerDisplay.tsx
│   │   │   │   ├── TimerControls.tsx
│   │   │   │   └── ProgressRing.tsx
│   │   │   ├── BlockList/
│   │   │   │   ├── BlockListEditor.tsx
│   │   │   │   ├── SiteInput.tsx
│   │   │   │   └── BlockedSiteItem.tsx
│   │   │   ├── Analytics/
│   │   │   │   ├── DashboardView.tsx
│   │   │   │   ├── Charts/
│   │   │   │   │   ├── FocusTimeChart.tsx
│   │   │   │   │   ├── StreakCalendar.tsx
│   │   │   │   │   └── TaskDistribution.tsx
│   │   │   │   └── MetricsCard.tsx
│   │   │   └── ui/             # Base UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Badge.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useTimer.ts
│   │   │   ├── useBlockList.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useStorage.ts
│   │   ├── store/              # Zustand state management
│   │   │   ├── timerStore.ts
│   │   │   ├── blockListStore.ts
│   │   │   └── settingsStore.ts
│   │   └── utils/              # Utility functions
│   │       ├── formatTime.ts
│   │       └── messaging.ts
│   ├── options/                # Options page (full settings UI)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── components/
│   │       ├── SettingsForm.tsx
│   │       ├── PremiumUpgrade.tsx
│   │       └── DataExport.tsx
│   ├── content/                # Content scripts
│   │   ├── youtube/            # YouTube-specific controls
│   │   │   ├── shorts-blocker.ts
│   │   │   ├── recommendations-hider.ts
│   │   │   └── comments-hider.ts
│   │   └── block-page/         # Injected block overlay
│   │       └── BlockOverlay.tsx
│   ├── shared/                 # Shared code across contexts
│   │   ├── types/              # TypeScript types
│   │   │   ├── storage.types.ts
│   │   │   ├── timer.types.ts
│   │   │   ├── analytics.types.ts
│   │   │   └── messaging.types.ts
│   │   ├── constants/          # App constants
│   │   │   ├── timers.ts       # Default Pomodoro durations
│   │   │   ├── storage-keys.ts
│   │   │   └── limits.ts       # Free vs Premium limits
│   │   └── utils/              # Pure utility functions
│   │       ├── validation.ts   # Input validation
│   │       ├── crypto.ts       # HMAC signing
│   │       └── date.ts         # Date utilities
│   └── assets/                 # Static assets
│       ├── icons/              # Extension icons
│       ├── sounds/             # Notification sounds
│       └── images/             # UI images
├── public/                     # Static files
│   ├── manifest.json           # Extension manifest
│   ├── blocked.html            # Static block page
│   └── _locales/               # i18n translations
├── tests/
│   ├── unit/                   # Unit tests (Vitest)
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests (Playwright)
├── scripts/                    # Build scripts
│   ├── build.ts                # Production build
│   └── zip.ts                  # Chrome Web Store package
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── package.json                # Dependencies
```

---

## Component Architecture

### Service Worker (Background)

**Responsibilities**:
- Manage blocking rules via `declarativeNetRequest`
- Run Pomodoro timer using `chrome.alarms`
- Track time spent on blocked sites
- Calculate analytics at midnight
- Handle message passing from popup/options/content scripts

**Key Design Patterns**:
- **Singleton**: One instance per browser session
- **Event-Driven**: Responds to alarms, tab events, storage changes
- **Stateless**: All state persisted to `chrome.storage.local` immediately
- **Defensive**: Assume suspension anytime, re-initialize on wake

**Example: Timer Engine**
```typescript
// src/background/timer/TimerEngine.ts
export class TimerEngine {
  private static instance: TimerEngine;
  
  private constructor() {
    this.initializeFromStorage();
    this.setupAlarmListeners();
  }
  
  static getInstance(): TimerEngine {
    if (!TimerEngine.instance) {
      TimerEngine.instance = new TimerEngine();
    }
    return TimerEngine.instance;
  }
  
  async startPomodoro(taskName?: string): Promise<void> {
    const session: TimerSession = {
      id: crypto.randomUUID(),
      type: 'work',
      duration: 25 * 60,
      startTime: Date.now(),
      taskName,
      status: 'active',
    };
    
    // Persist BEFORE creating alarm (defensive)
    await StorageManager.saveSession(session);
    
    // Create alarm (survives suspension)
    await chrome.alarms.create('pomodoro_end', {
      delayInMinutes: 25,
    });
    
    // Update blocking rules
    await BlockerEngine.getInstance().activateRules();
  }
  
  private async onAlarmFired(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === 'pomodoro_end') {
      const session = await StorageManager.getCurrentSession();
      await this.endSession(session);
      await this.startBreak();
    }
  }
}
```

### Popup UI (React)

**Responsibilities**:
- Display timer state and controls
- Show quick stats (streak, focus time today)
- Provide quick-add for block list
- Communicate with service worker via `chrome.runtime.sendMessage`

**Key Design Patterns**:
- **Controlled Components**: All state derived from Zustand stores
- **Optimistic Updates**: Update UI immediately, sync with storage async
- **Error Boundaries**: Graceful error handling for storage failures
- **Accessibility**: Full keyboard navigation, ARIA labels

**Example: Timer Display Component**
```typescript
// src/popup/components/Timer/TimerDisplay.tsx
import { useTimer } from '@/hooks/useTimer';
import { formatTime } from '@/utils/formatTime';

export const TimerDisplay: React.FC = () => {
  const { remainingSeconds, isRunning, sessionType } = useTimer();
  
  const color = sessionType === 'work' ? 'text-red-500' : 'text-green-500';
  
  return (
    <div 
      className={`text-6xl font-bold ${color} tabular-nums`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {formatTime(remainingSeconds)}
    </div>
  );
};
```

### Content Scripts

**Responsibilities**:
- Inject YouTube-specific controls (hide shorts, recommendations, comments)
- Display block overlay when user tries to access blocked site
- Minimal DOM manipulation (performance-critical)

**Key Design Patterns**:
- **MutationObserver**: Detect dynamically loaded YouTube elements
- **CSS Injection**: Use `display: none` for hiding, not DOM removal
- **Lazy Loading**: Only inject scripts on relevant domains

**Example: YouTube Shorts Blocker**
```typescript
// src/content/youtube/shorts-blocker.ts
class ShortsBlocker {
  private observer: MutationObserver | null = null;
  
  init(): void {
    this.hideExistingShorts();
    this.observeDOMChanges();
  }
  
  private hideExistingShorts(): void {
    const selectors = [
      'ytd-reel-shelf-renderer',           // Homepage shelf
      'ytd-shorts',                        // Shorts tab
      'a[href^="/shorts/"]',               // Shorts links
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });
  }
  
  private observeDOMChanges(): void {
    this.observer = new MutationObserver(() => {
      this.hideExistingShorts();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Only run if user enabled YouTube controls
chrome.storage.local.get(['youtubeControls'], ({ youtubeControls }) => {
  if (youtubeControls?.hideShorts) {
    new ShortsBlocker().init();
  }
});
```

---

## Data Flow Architecture

### Message Passing (Popup ↔ Service Worker)

**Pattern**: Command/Query Separation
- **Commands**: UI sends action, service worker executes, returns result
- **Queries**: UI requests data, service worker fetches from storage

**Example: Starting a Pomodoro**
```typescript
// Popup side (src/popup/hooks/useTimer.ts)
export const useTimer = () => {
  const startPomodoro = async (taskName?: string) => {
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'TIMER_START',
        payload: { taskName },
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  };
  
  return { startPomodoro };
};

// Service worker side (src/background/messaging/MessageRouter.ts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'TIMER_START': {
          await TimerEngine.getInstance().startPomodoro(
            message.payload.taskName
          );
          sendResponse({ success: true });
          break;
        }
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep channel open for async response
});
```

### Storage Schema Versioning

**Pattern**: Migrations for backward compatibility

```typescript
// src/background/storage/migrations/index.ts
export const CURRENT_SCHEMA_VERSION = 3;

export const migrations = {
  1: async (data: any) => {
    // Migration from v0 (no version) to v1
    return {
      ...data,
      version: 1,
      blocklist: data.blocklist || [],
    };
  },
  2: async (data: any) => {
    // Migration from v1 to v2 (add nuclear mode)
    return {
      ...data,
      version: 2,
      nuclearMode: {
        active: false,
        endTime: null,
      },
    };
  },
  3: async (data: any) => {
    // Migration from v2 to v3 (add task categorization)
    return {
      ...data,
      version: 3,
      sessions: data.sessions.map((s: any) => ({
        ...s,
        category: s.category || 'uncategorized',
      })),
    };
  },
};

export async function migrateIfNeeded(): Promise<void> {
  const { version = 0 } = await chrome.storage.local.get('version');
  
  if (version < CURRENT_SCHEMA_VERSION) {
    let data = await chrome.storage.local.get();
    
    // Run migrations sequentially
    for (let v = version + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      data = await migrations[v](data);
    }
    
    await chrome.storage.local.set(data);
    console.log(`Migrated storage from v${version} to v${CURRENT_SCHEMA_VERSION}`);
  }
}
```

---

## Performance Requirements

### Memory Management
- **Service Worker**: <30MB heap (Chrome suspends at 50MB)
- **Popup UI**: <20MB heap
- **Content Scripts**: <5MB per tab

### CPU Usage
- **Service Worker**: <2% average (spikes OK during alarm events)
- **Popup Rendering**: <100ms initial render
- **Content Script Execution**: <50ms on page load

### Storage Limits
- **chrome.storage.local**: Unlimited (but keep under 10MB for performance)
- **chrome.storage.sync**: 100KB total, 8KB per item
- **Cleanup Strategy**: Delete detailed data >90 days old

### API Rate Limits
- **chrome.alarms**: Max 2 alarms per minute (avoid alarm spam)
- **chrome.storage**: Max 120 writes per minute (batch updates)
- **chrome.declarativeNetRequest**: Max 5,000 dynamic rules

---

## Deployment Architecture

### Build Process
1. **TypeScript Compilation**: `tsc --noEmit` (type checking only)
2. **Vite Build**: Bundle for production (code splitting, minification)
3. **Manifest Generation**: Inject version from package.json
4. **Asset Optimization**: Compress images, inline critical CSS
5. **ZIP Packaging**: Create .zip for Chrome Web Store upload

### Environments
- **Development**: Vite dev server with HMR
- **Staging**: Production build installed via `chrome://extensions` (unpacked)
- **Production**: Signed .crx distributed via Chrome Web Store

### Monitoring (Post-Launch)
- **Error Tracking**: Chrome Error Reporting (built-in, no external service)
- **Performance**: Manual profiling with Chrome DevTools
- **User Feedback**: Chrome Web Store reviews

---

## Security Architecture

### Threat Model
1. **Malicious User**: Tries to bypass nuclear mode or blocking
2. **XSS Attack**: Injects script via user-provided text
3. **SSRF**: Provides malicious URL to block list
4. **Timing Attack**: Manipulates system time to end nuclear mode early

### Security Layers

**Layer 1: Input Validation**
- All user inputs sanitized before storage
- URL validation with allowlist (http/https only)
- Max length enforcement (prevent storage exhaustion)

**Layer 2: Output Encoding**
- DOMPurify for all user-generated content
- CSP headers prevent inline scripts

**Layer 3: Cryptographic Integrity**
- Nuclear mode timestamps signed with HMAC-SHA256
- Detect tampering attempts via signature verification

**Layer 4: Audit Logging**
- Log all security-relevant events (nuclear mode activation, settings changes)
- Store logs locally (privacy-preserving)

---

## Testing Architecture

### Unit Tests (Vitest)
- **Target**: Pure functions, business logic
- **Coverage**: ≥80% for new code
- **Mocking**: Chrome APIs mocked using `vitest-chrome`

### Integration Tests
- **Target**: Component interactions (timer + blocker)
- **Tools**: Vitest + Chrome API mocks

### End-to-End Tests (Playwright)
- **Target**: Critical user flows
- **Browser**: Headless Chrome with extension loaded
- **Scenarios**:
  - Complete Pomodoro cycle
  - Website blocking enforcement
  - Nuclear mode activation

### Performance Tests
- **Memory Profiling**: Chrome DevTools heap snapshots
- **CPU Profiling**: Chrome DevTools performance panel
- **Load Testing**: Simulate 1,000 blocked sites

---

## Architectural Decision Records (ADRs)

### ADR-001: Use Manifest V3 Instead of V2
**Status**: Accepted  
**Context**: Chrome deprecated Manifest V2 (sunset Jan 2024)  
**Decision**: Build on Manifest V3 from the start  
**Consequences**: 
- ✅ Future-proof (no migration needed)
- ✅ Better security (declarativeNetRequest is safer than webRequest)
- ❌ More complex blocking logic (declarative vs imperative)

### ADR-002: Use Zustand Instead of Redux
**Status**: Accepted  
**Context**: Need lightweight state management for popup UI  
**Decision**: Use Zustand (simpler API, smaller bundle)  
**Consequences**:
- ✅ Faster development (less boilerplate)
- ✅ Smaller bundle size (2KB vs 20KB for Redux)
- ❌ Less ecosystem (fewer middleware options)

### ADR-003: Local-First with Optional Cloud AI
**Status**: Accepted  
**Context**: Privacy concerns + cost efficiency  
**Decision**: All features work locally, AI is premium opt-in  
**Consequences**:
- ✅ 97% profit margin (no server costs)
- ✅ Privacy-preserving (GDPR-compliant)
- ❌ More complex architecture (two paths: local ML vs cloud AI)

### ADR-004: Use TensorFlow.js for Local Task Categorization
**Status**: Accepted  
**Context**: Need task categorization without sending data to servers  
**Decision**: Use pre-trained Universal Sentence Encoder in browser  
**Consequences**:
- ✅ Zero API costs
- ✅ Works offline
- ❌ 5MB model size (one-time download)
- ❌ Lower accuracy than cloud AI (~75% vs 95%)

---

## Scalability Considerations

### Current Scale (MVP)
- **Users**: 1,000 - 10,000
- **Architecture**: Client-only (zero servers)
- **Cost**: $600/month (domain + payment processing)

### Growth Scale (200K Users)
- **Architecture**: Still client-only
- **New Requirements**:
  - License validation API (serverless: Cloudflare Workers)
  - Stripe webhook handler (serverless)
- **Cost**: $600/month (no change, serverless free tier)

### Enterprise Scale (1M+ Users)
- **Architecture**: Hybrid (client-first + optional cloud features)
- **New Requirements**:
  - CDN for TensorFlow.js model (Cloudflare R2)
  - Dedicated database for license keys (Postgres or DynamoDB)
  - Premium+ AI insights backend (OpenAI API + caching layer)
- **Cost**: $5,000/month (still 95%+ profit margin)

---

## Appendix: Key Interfaces

### Storage Schema
```typescript
// src/shared/types/storage.types.ts
export interface ExtensionStorage {
  version: number;
  
  // Timer state
  currentSession: TimerSession | null;
  sessions: TimerSession[];  // Last 90 days
  
  // Blocking
  blockLists: BlockList[];
  schedules: Schedule[];
  nuclearMode: NuclearModeState;
  
  // Analytics
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  streak: StreakData;
  
  // Settings
  settings: UserSettings;
  premiumLicense: LicenseKey | null;
}

export interface TimerSession {
  id: string;
  type: 'work' | 'short-break' | 'long-break';
  duration: number;  // seconds
  startTime: number;  // Unix timestamp
  endTime?: number;
  taskName?: string;
  category?: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface BlockList {
  id: string;
  name: string;
  sites: BlockedSite[];
  enabled: boolean;
}

export interface BlockedSite {
  pattern: string;  // URL pattern or domain
  type: 'domain' | 'keyword' | 'url';
  allowance?: number;  // Daily minutes allowed (null = full block)
}
```

### Message Protocol
```typescript
// src/shared/types/messaging.types.ts
export type Message =
  | { type: 'TIMER_START'; payload: { taskName?: string } }
  | { type: 'TIMER_PAUSE'; payload: {} }
  | { type: 'TIMER_RESET'; payload: {} }
  | { type: 'TIMER_SKIP_BREAK'; payload: {} }
  | { type: 'BLOCKLIST_ADD_SITE'; payload: { listId: string; site: BlockedSite } }
  | { type: 'BLOCKLIST_REMOVE_SITE'; payload: { listId: string; siteId: string } }
  | { type: 'NUCLEAR_MODE_ACTIVATE'; payload: { duration: number; challengeToken: string } }
  | { type: 'ANALYTICS_EXPORT'; payload: { format: 'csv' | 'json' } };

export type MessageResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

**Document End**  
This architecture document should be referenced by Claude Code for all implementation decisions.
