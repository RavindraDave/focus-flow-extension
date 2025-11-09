# Next Feature Implementation Prompt
**Generated**: November 8, 2025
**Based on**: PRD Focus Flow Extension v1.0
**Current Phase**: Phase 1 - Week 3 (Core Features)
**Previous Work**: ✅ Storage layer complete (95% PRD aligned)

---

## Feature: Background Service Worker (Timer Engine + Blocker Engine)

### Objective

Implement the core background service worker that powers the Pomodoro timer and website blocking functionality. This is the "brain" of the extension that runs independently of the UI and manages all time-based operations.

---

## Scope

### In Scope

1. **Timer Engine** (Pomodoro Timer)
   - Start/pause/stop/reset timer functionality
   - Work session → Short break → Long break cycle
   - Auto-start next session (configurable)
   - Badge counter update (minutes remaining)
   - Desktop notifications (session start/end)
   - State persistence (survives browser restart)
   - Session history tracking

2. **Blocker Engine** (Website Blocking)
   - Convert BlockRules to chrome.declarativeNetRequest rules
   - Enable/disable rules based on timer state
   - During work: blocking active
   - During break: blocking disabled (allow relaxation)
   - Daily time allowances tracking
   - Blocked attempt counting (for analytics)

3. **Streak Tracking**
   - Daily midnight check (using chrome.alarms)
   - Increment streak if ≥1 Pomodoro completed today
   - Reset streak if no Pomodoros (respect freezes)
   - Earn freeze every 7-day streak (max 3)

4. **Analytics Aggregation**
   - Real-time session logging
   - Daily stats calculation
   - Focus score calculation
   - Session history cleanup (keep last 1000)

5. **Nuclear Mode Support**
   - HMAC-SHA256 signature generation for activation
   - System time manipulation detection
   - Settings lockdown enforcement
   - Automatic deactivation at end time

### Out of Scope (Deferred to Later)

- UI components (popup, options page)
- Content scripts (YouTube controls)
- Challenge gates (UI-dependent)
- AI-powered insights
- Schedule-based blocking (Phase 2)

---

## PRD Requirements

### Functional Requirements

#### Timer Engine (PRD Section 2.1)

- **FR-PT-001**: Default durations (25/5/15 minutes)
- **FR-PT-002**: Customizable durations from UserSettings
- **FR-PT-003**: Display timer in badge counter
- **FR-PT-004**: Browser notifications + badge color change
- **FR-PT-005**: Start, Pause, Skip, Reset controls
- **FR-PT-006**: Auto-start next session option

#### Blocker Engine (PRD Section 1.1, 1.4)

- **FR-BL-001**: Support domain, keyword, URL patterns
- **FR-BL-002**: Wildcard patterns (*.reddit.com)
- **FR-TA-001**: Per-site daily allowances (5-120 minutes)
- **FR-TA-003**: Reset allowances at midnight
- **FR-TA-004**: Warnings at 5 min, 1 min remaining
- **FR-TA-005**: Hard block when allowance exhausted

#### Streak Tracking (PRD Section 4.1)

- **FR-ST-001**: Track consecutive days with ≥1 completed Pomodoro
- **FR-ST-003**: Show personal best streak
- **FR-ST-004**: Streak freeze (premium) - 1 per 7-day streak, max 3

#### Break Enforcement (PRD Section 2.3)

- **FR-BE-001**: Temporarily unblock all websites during breaks
- **FR-BE-003**: Break tracking (taken vs skipped)

### Technical Requirements

#### Timer (PRD Section 2.1)

- **TR-PT-001**: Use `chrome.alarms` API (survives suspension, not `setTimeout`)
- **TR-PT-002**: Store timer state in chrome.storage.local (survives restart)
- **TR-PT-003**: Use `chrome.action.setBadgeText` for live countdown
- **TR-PT-004**: Audio notifications using Web Audio API
- **TR-PT-005**: Timer accuracy: ±1 second over 25 minutes

#### Blocker (PRD Section 1.1)

- **TR-BL-001**: Use `chrome.declarativeNetRequest` API (Manifest V3)
- **TR-BL-002**: Store block lists in chrome.storage.local ✅ (already done)
- **TR-BL-003**: Update blocking rules within 100ms
- **TR-BL-004**: Support up to 5,000 dynamic rules

#### Streak (PRD Section 4.1)

- **TR-ST-001**: Store in chrome.storage.local ✅ (already done)
- **TR-ST-002**: Check streak at midnight using chrome.alarms
- **TR-ST-003**: Reset streak if no Pomodoros in 24 hours (excluding freezes)

#### Nuclear Mode (PRD Section 1.3)

- **TR-NO-001**: Store with encrypted timestamp ✅ (schema done)
- **TR-NO-002**: Disable settings UI during nuclear mode
- **TR-NO-004**: Log nuclear mode activations

### Security Requirements (OWASP ASVS Level 2)

- **SR-NO-001**: Use HMAC-SHA256 to sign nuclear mode timestamp (V6.2.1)
  - Device secret: 32 bytes (already generated in settings)
  - Message: ISO 8601 timestamp of activation
  - Signature: HMAC-SHA256(deviceSecret, timestamp)

- **SR-NO-002**: Detect system time manipulation (V8.2.3)
  - Compare `Date.now()` with last known good time
  - If time jumped backward >5 minutes: flag as tampering
  - During nuclear mode: prevent deactivation via time manipulation

- **SR-BL-002**: Sanitize user patterns before regex compilation (V5.3.3)
  - Escape special regex characters
  - Prevent ReDoS (Regular Expression Denial of Service)

---

## Architecture

### File Structure

```
src/
├── background/
│   ├── index.ts                 # Service worker entry point ✅ (stub exists)
│   ├── timer-engine.ts          # 🆕 Pomodoro timer logic
│   ├── blocker-engine.ts        # 🆕 Website blocking logic
│   ├── streak-tracker.ts        # 🆕 Streak management
│   ├── analytics-tracker.ts     # 🆕 Analytics aggregation
│   └── nuclear-mode-manager.ts  # 🆕 Nuclear mode enforcement
├── services/
│   ├── session-repository.ts    # 🆕 PomodoroSession CRUD
│   └── analytics-repository.ts  # 🆕 AnalyticsData CRUD
├── utils/
│   └── crypto.ts                # 🆕 HMAC-SHA256 utilities
└── types/
    └── messages.ts              # 🆕 Message types for popup ↔ background
```

### Component Responsibilities

#### 1. TimerEngine (`src/background/timer-engine.ts`)

**Responsibilities**:
- Manage Pomodoro timer state machine
- Use chrome.alarms for precise timing
- Update badge with countdown
- Send notifications
- Track session history
- Auto-start next session (if enabled)

**State Machine**:
```
IDLE → (start) → WORK → (complete) → SHORT_BREAK → (complete) → WORK
                  ↓                                                ↑
                (4th work session)                                 |
                  ↓                                                 |
              LONG_BREAK -------- (complete) -----------------------
```

**Key Methods**:
```typescript
class TimerEngine {
  async start(taskName?: string, category?: string): Promise<void>
  async pause(): Promise<void>
  async resume(): Promise<void>
  async skip(): Promise<void>
  async reset(): Promise<void>
  async getCurrentSession(): Promise<PomodoroSession | null>
  private async createAlarm(duration: number): Promise<void>
  private async onAlarmFired(): Promise<void>
  private async updateBadge(): Promise<void>
  private async sendNotification(type: 'work_complete' | 'break_complete'): Promise<void>
}
```

**Data Flow**:
1. UI calls `start()` → TimerEngine creates chrome.alarm
2. Every second: Update badge with remaining time
3. Alarm fires → Complete session → Start next (if auto-start)
4. Save session to SessionRepository
5. Update analytics (AnalyticsTracker)
6. Update streak (StreakTracker, if work session completed)

---

#### 2. BlockerEngine (`src/background/blocker-engine.ts`)

**Responsibilities**:
- Convert BlockRules to chrome.declarativeNetRequest rules
- Sync rules with extension (updateDynamicRules)
- Enable blocking during work sessions
- Disable blocking during breaks
- Track time allowances
- Count blocked attempts

**Key Methods**:
```typescript
class BlockerEngine {
  async syncRules(): Promise<void>
  async enableBlocking(): Promise<void>
  async disableBlocking(): Promise<void>
  async trackTimeUsed(domain: string, seconds: number): Promise<void>
  async checkAllowance(domain: string): Promise<{ allowed: boolean; remaining: number }>
  async resetDailyAllowances(): Promise<void>
  private convertToDeclarativeRule(rule: BlockRule, index: number): chrome.declarativeNetRequest.Rule
}
```

**Rule Conversion Example**:
```typescript
// BlockRule { pattern: "youtube.com", type: "domain", allowance: 30 }
// ↓
{
  id: 1001,
  priority: 1,
  action: {
    type: "redirect",
    redirect: { extensionPath: "/blocked.html?domain=youtube.com&remaining=30" }
  },
  condition: {
    urlFilter: "*://*.youtube.com/*",
    resourceTypes: ["main_frame"]
  }
}
```

**Data Flow**:
1. BlockRuleRepository changes → BlockerEngine.syncRules()
2. Timer starts work session → BlockerEngine.enableBlocking()
3. User visits blocked site → chrome.declarativeNetRequest redirects
4. Timer starts break → BlockerEngine.disableBlocking()
5. Midnight alarm → BlockerEngine.resetDailyAllowances()

---

#### 3. StreakTracker (`src/background/streak-tracker.ts`)

**Responsibilities**:
- Check streak at midnight
- Award freezes every 7 days
- Handle freeze usage
- Update personal best

**Key Methods**:
```typescript
class StreakTracker {
  async checkDailyStreak(): Promise<void>
  async recordPomodoroCompletion(): Promise<void>
  async useFreeze(): Promise<boolean>
  async getStreak(): Promise<StreakData>
  private async shouldAwardFreeze(): Promise<boolean>
}
```

**Logic**:
```typescript
// At midnight:
if (completedPomodorosToday >= 1) {
  streak.current++;
  if (streak.current > streak.longest) {
    streak.longest = streak.current;
  }
  if (streak.current % 7 === 0 && streak.freezesAvailable < 3) {
    streak.freezesAvailable++;  // Award freeze
  }
} else if (streak.freezesAvailable > 0) {
  // User can use freeze (auto-use or manual?)
  streak.freezesUsed++;
  streak.freezesAvailable--;
} else {
  streak.current = 0;  // Streak broken
}
```

---

#### 4. AnalyticsTracker (`src/background/analytics-tracker.ts`)

**Responsibilities**:
- Aggregate session data into DailyStats
- Calculate focus score
- Clean up old data (>90 days)
- Track blocked attempts

**Key Methods**:
```typescript
class AnalyticsTracker {
  async recordSession(session: PomodoroSession): Promise<void>
  async recordBlockedAttempt(domain: string): Promise<void>
  async getTodayStats(): Promise<DailyStats>
  async calculateFocusScore(): Promise<number>
  private async cleanupOldStats(): Promise<void>
}
```

**Focus Score Calculation**:
```typescript
focusScore = (pomodorosCompleted / (pomodorosCompleted + pomodorosAbandoned)) × 100
```

---

#### 5. NuclearModeManager (`src/background/nuclear-mode-manager.ts`)

**Responsibilities**:
- Generate HMAC-SHA256 signatures
- Verify nuclear mode activation
- Detect time manipulation
- Auto-deactivate at end time

**Key Methods**:
```typescript
class NuclearModeManager {
  async activate(duration: number): Promise<void>
  async isActive(): Promise<boolean>
  async getRemainingTime(): Promise<number>
  async verifyIntegrity(): Promise<boolean>
  private async generateSignature(timestamp: string): Promise<string>
  private async detectTimeManipulation(): Promise<boolean>
}
```

**HMAC Signature Generation**:
```typescript
// Use Web Crypto API
const encoder = new TextEncoder();
const keyData = hexToBytes(deviceSecret);
const messageData = encoder.encode(timestamp);

const key = await crypto.subtle.importKey(
  'raw',
  keyData,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

const signature = await crypto.subtle.sign('HMAC', key, messageData);
return bytesToHex(new Uint8Array(signature));
```

---

#### 6. SessionRepository (`src/services/session-repository.ts`)

**Responsibilities**:
- CRUD for PomodoroSession
- Session history management
- Max 1000 sessions cleanup

**Key Methods**:
```typescript
class SessionRepository {
  async getCurrentSession(): Promise<PomodoroSession | null>
  async saveSession(session: PomodoroSession): Promise<void>
  async getSessionHistory(limit?: number): Promise<PomodoroSession[]>
  async updateSession(id: string, updates: Partial<PomodoroSession>): Promise<void>
  private async cleanupOldSessions(): Promise<void>
}
```

---

#### 7. AnalyticsRepository (`src/services/analytics-repository.ts`)

**Responsibilities**:
- CRUD for AnalyticsData
- DailyStats aggregation
- 90-day cleanup

**Key Methods**:
```typescript
class AnalyticsRepository {
  async getAnalytics(): Promise<AnalyticsData>
  async addDailyStats(stats: DailyStats): Promise<void>
  async getTodayStats(): Promise<DailyStats | null>
  async updateTodayStats(updates: Partial<DailyStats>): Promise<void>
  private async cleanupOldStats(): Promise<void>
}
```

---

### Message Passing (Popup ↔ Background)

**Create**: `src/types/messages.ts`

```typescript
// Message types for chrome.runtime.sendMessage
export type BackgroundMessage =
  | { type: 'TIMER_START'; taskName?: string; category?: string }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME' }
  | { type: 'TIMER_SKIP' }
  | { type: 'TIMER_RESET' }
  | { type: 'GET_CURRENT_SESSION' }
  | { type: 'GET_TODAY_STATS' }
  | { type: 'GET_STREAK' }
  | { type: 'NUCLEAR_MODE_ACTIVATE'; duration: number }
  | { type: 'SYNC_BLOCK_RULES' };

export type BackgroundResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Example Usage**:
```typescript
// In popup UI:
const response = await chrome.runtime.sendMessage({ type: 'TIMER_START' });

// In background:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TIMER_START') {
    timerEngine.start(message.taskName, message.category)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;  // Async response
  }
});
```

---

## Implementation Steps

### Step 1: Crypto Utilities

**File**: `src/utils/crypto.ts`

1. Implement HMAC-SHA256 signing
2. Implement signature verification
3. Implement hex ↔ bytes conversion
4. Add unit tests (mock Web Crypto API)

**Quality Gate**: ≥80% test coverage

---

### Step 2: SessionRepository & AnalyticsRepository

**Files**:
- `src/services/session-repository.ts`
- `src/services/analytics-repository.ts`

1. Implement all CRUD methods
2. Use StorageService (already exists)
3. Implement cleanup logic (max 1000 sessions, 90-day stats)
4. Add unit tests (mock StorageService)

**Quality Gate**: ≥80% test coverage, no direct chrome.storage calls

---

### Step 3: NuclearModeManager

**File**: `src/background/nuclear-mode-manager.ts`

1. Implement signature generation (use crypto.ts)
2. Implement time manipulation detection
3. Implement auto-deactivation check
4. Add unit tests (mock crypto.subtle)

**Quality Gate**: ≥80% test coverage, cyclomatic complexity ≤7 (security-critical)

---

### Step 4: StreakTracker

**File**: `src/background/streak-tracker.ts`

1. Implement daily check logic
2. Implement freeze awarding (every 7 days)
3. Implement freeze usage
4. Add unit tests

**Quality Gate**: ≥80% test coverage

---

### Step 5: AnalyticsTracker

**File**: `src/background/analytics-tracker.ts`

1. Implement session aggregation
2. Implement focus score calculation
3. Implement blocked attempt tracking
4. Add unit tests

**Quality Gate**: ≥80% test coverage

---

### Step 6: BlockerEngine

**File**: `src/background/blocker-engine.ts`

1. Implement BlockRule → declarativeNetRequest rule conversion
2. Implement rule sync (chrome.declarativeNetRequest.updateDynamicRules)
3. Implement enable/disable blocking
4. Implement time allowance tracking
5. Add unit tests (mock chrome.declarativeNetRequest)

**Quality Gate**: ≥80% test coverage, rules update <100ms

---

### Step 7: TimerEngine

**File**: `src/background/timer-engine.ts`

1. Implement state machine (IDLE → WORK → BREAK → ...)
2. Implement chrome.alarms integration
3. Implement badge updates
4. Implement notifications
5. Integrate with BlockerEngine, StreakTracker, AnalyticsTracker
6. Add unit tests (mock chrome.alarms, chrome.action, chrome.notifications)

**Quality Gate**: ≥80% test coverage, timer accuracy ±1 second

---

### Step 8: Background Service Worker Integration

**File**: `src/background/index.ts`

1. Initialize all engines
2. Set up chrome.runtime.onMessage listener
3. Set up chrome.alarms listener (for midnight checks, timer ticks)
4. Handle onInstalled (run migrations, set up midnight alarm)
5. Add integration tests

**Quality Gate**: All message types handled, alarms set up correctly

---

### Step 9: Message Types

**File**: `src/types/messages.ts`

1. Define all message types (TypeScript discriminated unions)
2. Define response types
3. Export type guards for runtime validation

**Quality Gate**: Full type safety, no `any` types

---

## Testing Requirements

### Unit Tests (Vitest)

**Target**: ≥80% coverage for all new code

**Key Test Scenarios**:

#### TimerEngine
- ✅ Start timer → alarm created, badge updated
- ✅ Timer completes → session saved, next session starts (if auto-start)
- ✅ Pause/resume → state preserved
- ✅ Skip → current session abandoned, next starts
- ✅ Reset → back to IDLE
- ✅ Browser restart → state restored from storage
- ✅ 4th work session → long break instead of short

#### BlockerEngine
- ✅ BlockRule conversion (domain, keyword, URL patterns)
- ✅ Wildcard patterns (*.reddit.com)
- ✅ Enable blocking → rules added
- ✅ Disable blocking → rules removed
- ✅ Time allowance tracking
- ✅ Midnight reset

#### StreakTracker
- ✅ Daily check: ≥1 Pomodoro → increment streak
- ✅ Daily check: 0 Pomodoros, no freeze → reset streak
- ✅ Daily check: 0 Pomodoros, has freeze → use freeze
- ✅ Award freeze every 7 days (max 3)
- ✅ Personal best tracking

#### NuclearModeManager
- ✅ Signature generation (HMAC-SHA256)
- ✅ Signature verification
- ✅ Time manipulation detection (backward time jump)
- ✅ Auto-deactivation at end time
- ✅ Settings lockdown during active nuclear mode

#### SessionRepository & AnalyticsRepository
- ✅ CRUD operations
- ✅ Cleanup old data (1000 sessions, 90 days)
- ✅ Validation (Zod schemas)

---

### Integration Tests

**Key Scenarios**:

1. **Complete Pomodoro Cycle**:
   - Start timer → wait 25 min (mocked) → break starts
   - Complete break → next work session starts
   - 4 work sessions → long break

2. **Blocking During Work**:
   - Start work session → blocking enabled
   - Visit blocked site → redirected
   - Start break → blocking disabled

3. **Streak Tracking**:
   - Complete 1 Pomodoro → check at midnight → streak increments
   - Complete 0 Pomodoros → check at midnight → streak resets (no freeze)
   - 7-day streak → freeze awarded

4. **Nuclear Mode**:
   - Activate nuclear mode → signature generated
   - Attempt to disable → blocked
   - End time reached → auto-deactivated

---

## Quality Gates

### Code Quality

- ✅ Test Coverage: ≥80%
- ✅ Code Duplication: ≤3%
- ✅ Cyclomatic Complexity: ≤10 (≤7 for security functions)
- ✅ Function Size: <50 lines
- ✅ TypeScript Strict Mode: Enabled
- ✅ No `any` Types: Zero usage

### Security

- ✅ HMAC-SHA256 signature validation (SR-NO-001)
- ✅ Time manipulation detection (SR-NO-002)
- ✅ Sanitize regex patterns (SR-BL-002)
- ✅ No sensitive data in error messages

### Performance

- ✅ Timer accuracy: ±1 second over 25 minutes
- ✅ Rule updates: <100ms (TR-BL-003)
- ✅ Memory footprint: <50MB (PRD Technical Metrics)
- ✅ CPU usage: <2% during active blocking

---

## Acceptance Criteria

### Timer Engine

```gherkin
Given the timer is in IDLE state
When I send TIMER_START message
Then chrome.alarms should create a 25-minute alarm
And the badge should display "25" in red
And the session should be saved with status "active"

Given the timer is running for 25 minutes
When the alarm fires
Then the session should be marked "completed"
And a notification should be sent
And the break timer should start (5 minutes)
And the badge should display "5" in green
```

### Blocker Engine

```gherkin
Given I have a BlockRule for "youtube.com"
When the timer starts a work session
Then chrome.declarativeNetRequest should add a redirect rule
And visiting youtube.com should redirect to blocked.html

Given the timer starts a break
When I visit youtube.com
Then the site should be accessible (no redirect)
```

### Streak Tracking

```gherkin
Given I have a 5-day streak
When I complete at least 1 Pomodoro today
And the midnight alarm fires
Then my streak should increment to 6 days

Given I have a 7-day streak
When the streak increments to 7
Then I should earn 1 streak freeze
And freezesAvailable should be 1
```

### Nuclear Mode

```gherkin
Given I activate nuclear mode for 4 hours
When the activation completes
Then a HMAC-SHA256 signature should be generated
And the signature should be stored in settings
And the endTime should be 4 hours from now

Given nuclear mode is active
When I attempt to modify settings
Then the modification should be blocked
And an error should be thrown

Given nuclear mode endTime has passed
When the background service worker checks
Then nuclear mode should auto-deactivate
```

---

## Files to Create

1. ✅ `src/utils/crypto.ts` (HMAC utilities)
2. ✅ `src/services/session-repository.ts`
3. ✅ `src/services/analytics-repository.ts`
4. ✅ `src/background/nuclear-mode-manager.ts`
5. ✅ `src/background/streak-tracker.ts`
6. ✅ `src/background/analytics-tracker.ts`
7. ✅ `src/background/blocker-engine.ts`
8. ✅ `src/background/timer-engine.ts`
9. ✅ `src/types/messages.ts`
10. ✅ Update `src/background/index.ts` (wire everything together)

**Total**: 9 new files, 1 update

---

## Files to Test

1. ✅ `tests/unit/utils/crypto.test.ts`
2. ✅ `tests/unit/services/session-repository.test.ts`
3. ✅ `tests/unit/services/analytics-repository.test.ts`
4. ✅ `tests/unit/background/nuclear-mode-manager.test.ts`
5. ✅ `tests/unit/background/streak-tracker.test.ts`
6. ✅ `tests/unit/background/analytics-tracker.test.ts`
7. ✅ `tests/unit/background/blocker-engine.test.ts`
8. ✅ `tests/unit/background/timer-engine.test.ts`
9. ✅ `tests/integration/pomodoro-cycle.test.ts`
10. ✅ `tests/integration/blocking-flow.test.ts`

**Total**: 10 test files

---

## Dependencies

### Chrome APIs Required

- `chrome.alarms` - Timer functionality
- `chrome.declarativeNetRequest` - Website blocking
- `chrome.action` - Badge updates
- `chrome.notifications` - Desktop notifications
- `chrome.runtime` - Message passing
- `chrome.storage.local` - State persistence ✅ (already used)

### Manifest Permissions

Add to `manifest.json`:
```json
{
  "permissions": [
    "alarms",
    "declarativeNetRequest",
    "notifications",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  }
}
```

### NPM Packages

No new dependencies needed (use built-in Web Crypto API).

---

## Success Criteria

### Functional Success

- ✅ Can start/pause/skip/reset Pomodoro timer
- ✅ Badge shows countdown during active session
- ✅ Notifications sent at session start/end
- ✅ Blocking active during work, disabled during breaks
- ✅ Streak increments at midnight if ≥1 Pomodoro completed
- ✅ Nuclear mode activates with HMAC signature
- ✅ Analytics track all sessions with focus score

### Quality Success

- ✅ All tests pass (≥80% coverage)
- ✅ No `any` types
- ✅ All functions <50 lines
- ✅ Cyclomatic complexity ≤10 (≤7 for security)
- ✅ Timer accuracy ±1 second
- ✅ Rule updates <100ms

### Security Success

- ✅ HMAC signatures verified (cannot be tampered)
- ✅ Time manipulation detected
- ✅ No sensitive data in errors
- ✅ Regex patterns sanitized (no ReDoS)

---

## Next Steps After Completion

1. **Implement Popup UI** (React components)
   - Timer display with start/pause/skip buttons
   - Block list management
   - Analytics dashboard
   - Settings page

2. **Implement Options Page** (full-page settings)
   - Advanced timer settings
   - Nuclear mode activation with challenges
   - Data export

3. **Implement Content Scripts** (YouTube controls)
   - Hide Shorts
   - Hide recommendations
   - Hide comments

4. **Implement Manifest V3 Configuration**
   - Complete manifest.json
   - Package extension

5. **End-to-End Testing** (Playwright)
   - Full user flows
   - Cross-browser testing

---

## References

- **PRD**: `.claude/PRD_Focus_Pomodoro_Extension.md`
- **Architecture**: `.claude/architecture.md`
- **Security Standards**: `.claude/security-standards.md`
- **Storage Layer**: Already implemented ✅
- **Design System**: Already implemented ✅

---

**End of Prompt**

Start with Step 1 (Crypto Utilities) and proceed sequentially. Use the TodoWrite tool to track progress through all 9 implementation steps.
