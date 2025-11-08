# Coding Standards - Focus Mode & Pomodoro Timer Extension

## Overview

These standards enforce code quality, maintainability, and consistency across the codebase. All code MUST pass these quality gates before merging to main branch.

---

## Quality Gates (Enforced in CI/CD)

### 1. Code Coverage

#### New Code (Strict)
- **Line Coverage**: ≥80% (SonarQube default)
- **Branch Coverage**: ≥70% for core modules (timer, blocker, storage)
- **Mutation Coverage**: ≥60% for critical paths (recommended, not enforced initially)

#### Overall Code (Gradual Improvement)
- **Target**: 70%+ overall coverage
- **Strategy**: Increase by 2-3% per sprint
- **Legacy Code**: Allowed lower coverage, but new changes must be tested

#### Excluded from Coverage
- Type definition files (`*.types.ts`)
- Configuration files (`vite.config.ts`, `tailwind.config.js`)
- Auto-generated code
- Test utilities and mocks

#### Enforcement
```yaml
# .sonarqube/quality-gate.yml
coverage:
  new_code:
    minimum: 80.0
    scope: lines
  overall:
    minimum: 70.0
    target: 80.0
```

### 2. Code Duplication

#### New Code (Zero Tolerance)
- **Maximum Duplication**: ≤3%
- **Detection**: SonarQube with default settings (5 token threshold)
- **Enforcement**: Fail PR builds if exceeded

#### Overall Code (Continuous Refactoring)
- **Current Target**: ≤5-8%
- **Strategy**: Refactor high-duplication modules incrementally
- **Rationale**: Keep strict on new code, relax on legacy

#### Allowed Duplication
- Test setup boilerplate (arrange/act/assert patterns)
- Type guards with similar structure
- Constants files (if values differ)

#### Example: Preventing Duplication
```typescript
// ❌ BAD: Duplicated validation logic
function validateBlockedSite(site: BlockedSite): boolean {
  if (!site.pattern || site.pattern.length === 0) return false;
  if (!site.type || !['domain', 'keyword', 'url'].includes(site.type)) return false;
  return true;
}

function validateSchedule(schedule: Schedule): boolean {
  if (!schedule.name || schedule.name.length === 0) return false;
  if (!schedule.type || !['daily', 'weekly', 'custom'].includes(schedule.type)) return false;
  return true;
}

// ✅ GOOD: Extracted common validation pattern
function validateRequired<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function validateEnum<T>(value: T, allowedValues: T[]): boolean {
  return allowedValues.includes(value);
}

function validateBlockedSite(site: BlockedSite): boolean {
  return (
    validateRequired(site.pattern) &&
    site.pattern.length > 0 &&
    validateEnum(site.type, ['domain', 'keyword', 'url'])
  );
}
```

### 3. Cyclomatic Complexity

#### Function Complexity Limits
- **Normal Functions**: ≤10 (SonarQube default)
- **Security-Critical**: ≤5-7 (e.g., nuclear mode validation, HMAC signing)
- **Needs Refactor**: >15 (fail CI build)

#### Rationale
- Based on Microsoft Learn guidelines and ISO/IEC 25010 maintainability standards
- Lower complexity = easier testing, fewer bugs

#### Measuring Complexity
```typescript
// Complexity = 1 (base) + 4 (if statements) + 2 (loops) = 7 ✅
function calculateFocusScore(sessions: TimerSession[]): number {
  let completed = 0;
  let total = 0;
  
  for (const session of sessions) {  // +1
    total++;
    
    if (session.status === 'completed') {  // +1
      completed++;
    }
  }
  
  if (total === 0) return 0;  // +1
  
  const score = (completed / total) * 100;
  
  if (score >= 90) return 100;  // +1
  if (score >= 75) return 90;   // +1
  
  return Math.round(score);
}
```

#### Refactoring High Complexity
```typescript
// ❌ BAD: Complexity = 18 (too high)
function processSession(session: TimerSession): ProcessedSession {
  if (!session) throw new Error('Session required');
  
  let category = 'other';
  if (session.taskName) {
    if (session.taskName.includes('code') || session.taskName.includes('dev')) {
      category = 'development';
    } else if (session.taskName.includes('write') || session.taskName.includes('blog')) {
      category = 'writing';
    } else if (session.taskName.includes('meeting') || session.taskName.includes('call')) {
      category = 'communication';
    }
    // ... 10 more conditions
  }
  
  const duration = session.endTime ? session.endTime - session.startTime : 0;
  const isValid = duration > 0 && duration < 60 * 60 * 1000;
  const focusScore = isValid ? calculateScore(session) : 0;
  
  return { ...session, category, duration, focusScore };
}

// ✅ GOOD: Complexity = 3 (extracted helper functions)
function processSession(session: TimerSession): ProcessedSession {
  validateSession(session);
  
  return {
    ...session,
    category: categorizeTask(session.taskName),
    duration: calculateDuration(session),
    focusScore: calculateFocusScore(session),
  };
}

function categorizeTask(taskName?: string): string {
  if (!taskName) return 'other';
  
  const patterns: Record<string, string[]> = {
    development: ['code', 'dev', 'bug', 'feature'],
    writing: ['write', 'blog', 'article', 'doc'],
    communication: ['meeting', 'call', 'email', 'slack'],
  };
  
  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(k => taskName.toLowerCase().includes(k))) {
      return category;
    }
  }
  
  return 'other';
}
```

### 4. Function Size

#### Heuristics
- **Ideal**: <25 lines per function
- **Acceptable**: <50 lines
- **Exceptions**: Data mappers, simple linear code (e.g., configuration objects)

#### Enforcement
```javascript
// .eslintrc.js
rules: {
  'max-lines-per-function': ['error', {
    max: 50,
    skipBlankLines: true,
    skipComments: true,
    IIFEs: false,
  }],
}
```

#### Example: Splitting Large Functions
```typescript
// ❌ BAD: 80 lines, does too much
async function startPomodoro(taskName?: string): Promise<void> {
  // 20 lines of validation
  // 20 lines of storage operations
  // 20 lines of alarm setup
  // 20 lines of UI updates
}

// ✅ GOOD: Split into 4 focused functions
async function startPomodoro(taskName?: string): Promise<void> {
  const session = await createSession(taskName);
  await persistSession(session);
  await scheduleAlarm(session);
  await updateUI(session);
}

async function createSession(taskName?: string): Promise<TimerSession> {
  // 15 lines: validation + session creation
}

async function persistSession(session: TimerSession): Promise<void> {
  // 10 lines: storage operations
}
```

---

## TypeScript Standards

### Type Safety

#### Strict Mode (Required)
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### No `any` Types (Enforced)
```typescript
// ❌ BAD
function handleMessage(msg: any) {
  console.log(msg.type);
}

// ✅ GOOD
interface Message {
  type: string;
  payload: unknown;
}

function handleMessage(msg: Message) {
  console.log(msg.type);
}
```

#### Explicit Return Types (Required for Public Functions)
```typescript
// ❌ BAD: Inferred return type
export function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${seconds % 60}`;
}

// ✅ GOOD: Explicit return type
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
```

#### Type Guards (Use for Runtime Type Checking)
```typescript
// ✅ GOOD: Type guard for storage data
function isValidSession(data: unknown): data is TimerSession {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    'startTime' in data &&
    typeof data.startTime === 'number'
  );
}

// Usage
const data = await chrome.storage.local.get('currentSession');
if (isValidSession(data.currentSession)) {
  // TypeScript knows data.currentSession is TimerSession
  console.log(data.currentSession.startTime);
}
```

### Naming Conventions

#### Files
- Components: `PascalCase.tsx` (e.g., `TimerDisplay.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatTime.ts`)
- Types: `kebab-case.types.ts` (e.g., `storage.types.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

#### Variables & Functions
- Variables: `camelCase` (e.g., `currentSession`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_BLOCKED_SITES`)
- Functions: `camelCase` (e.g., `startPomodoro`)
- React Components: `PascalCase` (e.g., `TimerDisplay`)
- Hooks: `use` prefix (e.g., `useTimer`)

#### Types & Interfaces
- Interfaces: `PascalCase` (e.g., `TimerSession`)
- Type Aliases: `PascalCase` (e.g., `SessionStatus`)
- Enums: `PascalCase` with `SCREAMING_SNAKE_CASE` values

```typescript
// ✅ GOOD: Consistent naming
export const MAX_POMODORO_DURATION = 60; // constant

export interface TimerSession {  // interface
  id: string;
  type: SessionType;
  startTime: number;
}

export type SessionType = 'work' | 'short-break' | 'long-break';  // type alias

export enum SessionStatus {  // enum
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}
```

---

## Code Organization

### Module Structure

#### Single Responsibility Principle
Each file should have ONE primary export (class, function, or component).

```typescript
// ❌ BAD: Multiple unrelated exports
export function formatTime(seconds: number): string { ... }
export function validateURL(url: string): boolean { ... }
export class TimerEngine { ... }

// ✅ GOOD: Related utility functions in one file
// src/shared/utils/time.ts
export function formatTime(seconds: number): string { ... }
export function parseTime(formatted: string): number { ... }
export function addMinutes(time: number, minutes: number): number { ... }

// src/shared/utils/validation.ts
export function validateURL(url: string): boolean { ... }
export function validateEmail(email: string): boolean { ... }

// src/background/timer/TimerEngine.ts
export class TimerEngine { ... }
```

#### Barrel Exports (Index Files)
Use `index.ts` to re-export public API.

```typescript
// src/shared/utils/index.ts
export * from './time';
export * from './validation';
export * from './crypto';

// Usage
import { formatTime, validateURL } from '@/shared/utils';
```

### Dependency Direction

#### Layered Architecture
```
UI Layer (Popup, Options)
    ↓ depends on
Domain Layer (Business Logic)
    ↓ depends on
Infrastructure Layer (Storage, Chrome APIs)
```

**Rules**:
- UI can depend on Domain
- Domain can depend on Infrastructure
- Infrastructure cannot depend on Domain or UI
- Domain should be Chrome API agnostic (use dependency injection)

```typescript
// ✅ GOOD: Domain layer doesn't know about Chrome APIs
// src/background/timer/TimerEngine.ts
export class TimerEngine {
  constructor(
    private storage: StorageAdapter,  // interface, not chrome.storage directly
    private alarms: AlarmAdapter,
  ) {}
  
  async startPomodoro(taskName?: string): Promise<void> {
    const session = this.createSession(taskName);
    await this.storage.save('currentSession', session);
    await this.alarms.create('pomodoro_end', 25);
  }
}

// src/background/infrastructure/ChromeStorageAdapter.ts
export class ChromeStorageAdapter implements StorageAdapter {
  async save(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}
```

---

## Error Handling

### Fail Fast Principle

#### Validate Early
```typescript
// ✅ GOOD: Validate at function entry
function addBlockedSite(listId: string, site: BlockedSite): void {
  if (!listId) {
    throw new Error('List ID is required');
  }
  
  if (!validateBlockedSite(site)) {
    throw new Error('Invalid blocked site');
  }
  
  // Main logic here
}
```

#### Use Custom Error Types
```typescript
// src/shared/errors/index.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Usage
try {
  await chrome.storage.local.set({ key: value });
} catch (error) {
  throw new StorageError(
    'Failed to save data',
    'set'
  );
}
```

#### Never Swallow Errors
```typescript
// ❌ BAD: Silent failure
try {
  await startPomodoro();
} catch (error) {
  // Nothing
}

// ✅ GOOD: Log and propagate
try {
  await startPomodoro();
} catch (error) {
  console.error('Failed to start Pomodoro:', error);
  throw error;  // Re-throw for caller to handle
}

// ✅ ALSO GOOD: Log and show user-friendly message
try {
  await startPomodoro();
} catch (error) {
  console.error('Failed to start Pomodoro:', error);
  showNotification('Failed to start timer. Please try again.');
}
```

---

## Performance Standards

### Async/Await Best Practices

#### Avoid Sequential Awaits (Parallelize When Possible)
```typescript
// ❌ BAD: Sequential (slow)
async function loadDashboard(): Promise<DashboardData> {
  const sessions = await getSessions();  // 100ms
  const stats = await getStats();        // 100ms
  const streak = await getStreak();      // 100ms
  return { sessions, stats, streak };    // Total: 300ms
}

// ✅ GOOD: Parallel (fast)
async function loadDashboard(): Promise<DashboardData> {
  const [sessions, stats, streak] = await Promise.all([
    getSessions(),
    getStats(),
    getStreak(),
  ]);
  return { sessions, stats, streak };    // Total: ~100ms
}
```

#### Use Promise.allSettled for Independent Operations
```typescript
// ✅ GOOD: Don't fail all if one fails
async function updateAll(): Promise<void> {
  const results = await Promise.allSettled([
    updateBlockList(),
    updateAnalytics(),
    updateStreak(),
  ]);
  
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Operation ${index} failed:`, result.reason);
    }
  });
}
```

### Memory Management

#### Clean Up Event Listeners
```typescript
// ✅ GOOD: Remove listeners when done
export class TimerEngine {
  private alarmListener: (alarm: chrome.alarms.Alarm) => void;
  
  init(): void {
    this.alarmListener = this.onAlarmFired.bind(this);
    chrome.alarms.onAlarm.addListener(this.alarmListener);
  }
  
  destroy(): void {
    chrome.alarms.onAlarm.removeListener(this.alarmListener);
  }
}
```

#### Use WeakMap for Object Metadata
```typescript
// ✅ GOOD: No memory leak if objects are garbage collected
const sessionMetadata = new WeakMap<TimerSession, { processed: boolean }>();

sessionMetadata.set(session, { processed: true });
```

### Debouncing & Throttling

#### Debounce User Input
```typescript
// src/shared/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Usage in React component
const debouncedSave = useMemo(
  () => debounce((value: string) => {
    chrome.storage.local.set({ searchQuery: value });
  }, 300),
  []
);
```

#### Throttle High-Frequency Events
```typescript
// src/shared/utils/throttle.ts
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Usage for timer updates
const throttledBadgeUpdate = throttle((seconds: number) => {
  chrome.action.setBadgeText({ text: String(Math.ceil(seconds / 60)) });
}, 1000);  // Update badge max once per second
```

---

## Code Review Checklist

### Pre-Commit Checklist
- [ ] All TypeScript errors resolved (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatting applied
- [ ] Unit tests written for new code (≥80% coverage)
- [ ] No console.log statements (use proper logging)
- [ ] No hardcoded values (use constants)
- [ ] All functions <50 lines
- [ ] Cyclomatic complexity ≤10 per function

### PR Review Checklist
- [ ] Code passes all CI checks
- [ ] No new code duplication introduced
- [ ] Security hotspots reviewed and resolved
- [ ] Performance impact assessed (no memory leaks)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Error handling implemented
- [ ] Types are explicit (no `any`)
- [ ] Documentation updated (JSDoc comments for public API)

---

## Automated Checks (CI/CD)

### GitHub Actions Workflow
```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage
      - name: Check coverage
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
          
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## Example: Well-Structured Module

```typescript
// src/background/timer/TimerEngine.ts

/**
 * Manages Pomodoro timer lifecycle and state.
 * 
 * @example
 * ```typescript
 * const timer = TimerEngine.getInstance();
 * await timer.startPomodoro('Write documentation');
 * ```
 */
export class TimerEngine {
  private static instance: TimerEngine | null = null;
  
  private constructor(
    private readonly storage: StorageAdapter,
    private readonly alarms: AlarmAdapter,
    private readonly blocker: BlockerEngine,
  ) {
    this.initializeListeners();
  }
  
  /**
   * Get singleton instance of TimerEngine.
   * Initializes with Chrome API adapters if not provided.
   */
  public static getInstance(): TimerEngine {
    if (!TimerEngine.instance) {
      TimerEngine.instance = new TimerEngine(
        new ChromeStorageAdapter(),
        new ChromeAlarmAdapter(),
        BlockerEngine.getInstance(),
      );
    }
    return TimerEngine.instance;
  }
  
  /**
   * Start a new Pomodoro work session.
   * 
   * @param taskName - Optional task description
   * @throws {ValidationError} If a session is already active
   * @throws {StorageError} If session cannot be persisted
   */
  public async startPomodoro(taskName?: string): Promise<void> {
    const existingSession = await this.storage.get<TimerSession>('currentSession');
    
    if (existingSession?.status === 'active') {
      throw new ValidationError('A session is already active');
    }
    
    const session = this.createSession('work', taskName);
    
    await this.persistSession(session);
    await this.scheduleAlarm(session);
    await this.blocker.activateRules();
    
    this.notifySessionStart(session);
  }
  
  /**
   * Create a new timer session object.
   * Complexity: 2 (simple factory method)
   */
  private createSession(
    type: SessionType,
    taskName?: string
  ): TimerSession {
    return {
      id: crypto.randomUUID(),
      type,
      duration: this.getDuration(type),
      startTime: Date.now(),
      taskName,
      status: 'active',
    };
  }
  
  /**
   * Get duration in seconds for session type.
   * Complexity: 3 (switch statement)
   */
  private getDuration(type: SessionType): number {
    switch (type) {
      case 'work':
        return 25 * 60;
      case 'short-break':
        return 5 * 60;
      case 'long-break':
        return 15 * 60;
    }
  }
  
  /**
   * Persist session to storage.
   * Complexity: 1 (single operation, error handled by caller)
   */
  private async persistSession(session: TimerSession): Promise<void> {
    await this.storage.set('currentSession', session);
    
    // Also add to session history
    const sessions = await this.storage.get<TimerSession[]>('sessions') || [];
    sessions.push(session);
    await this.storage.set('sessions', sessions);
  }
  
  /**
   * Schedule alarm for session end.
   * Complexity: 1
   */
  private async scheduleAlarm(session: TimerSession): Promise<void> {
    await this.alarms.create('pomodoro_end', {
      delayInMinutes: session.duration / 60,
    });
  }
  
  // Additional methods...
  
  /**
   * Initialize event listeners.
   * Complexity: 1
   */
  private initializeListeners(): void {
    this.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
  }
  
  /**
   * Handle alarm fired event.
   * Complexity: 2 (one conditional)
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === 'pomodoro_end') {
      await this.handleSessionEnd();
    }
  }
}

// Total file: ~120 lines, average complexity: 2.5, max complexity: 3 ✅
```

---

**Document End**  
These coding standards must be followed for all code submitted to the repository.
