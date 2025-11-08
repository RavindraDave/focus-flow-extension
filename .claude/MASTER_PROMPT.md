# Claude Code Master Prompt - Focus Flow Extension

## Project Overview
You are building **Focus Flow**, a premium Chrome Extension (Manifest V3) that combines intelligent website blocking with Pomodoro time management and productivity analytics. This is a production-grade extension targeting 200K users with a freemium monetization model ($3.99/month premium tier).

---

## Critical Standards (ALWAYS ENFORCE)

### 1. TypeScript Strict Mode
- **NO `any` types** - Use `unknown` with type guards or proper generics
- **All functions must have explicit return types**
- **Enable all strict compiler options** (see `.claude/coding-standards.md`)
- **Use Zod for runtime validation** of all external data

### 2. Code Quality Gates
- **Cyclomatic complexity:** ≤ 10 per function (≤ 7 for security-critical)
- **Function length:** < 50 lines (target), < 100 lines (maximum)
- **Code duplication:** ≤ 3% for new code
- **Test coverage:** ≥ 80% line coverage, ≥ 70% branch coverage

### 3. Security (OWASP ASVS Level 2)
- **All inputs validated** with Zod schemas before use
- **No sensitive data in logs** - sanitize error messages
- **chrome.storage.local only** for data persistence (never localStorage)
- **CSP enforced** in manifest.json
- **No XSS vulnerabilities** - React auto-escaping, DOMPurify for HTML

### 4. Architecture Patterns
- **Clean Architecture:** UI → Application → Domain → Infrastructure layers
- **Repository Pattern:** All storage access through service interfaces
- **State Machine:** Timer logic uses explicit state transitions
- **Factory Pattern:** Challenge creation
- **No circular dependencies** - enforce one-way data flow

---

## File Structure (MANDATORY)
```
src/
├── background/
│   ├── service-worker.ts          # Main background script
│   ├── blocking-engine.ts         # Core blocking logic
│   ├── timer-manager.ts           # Pomodoro orchestration
│   └── analytics-collector.ts     # Usage tracking
│
├── components/
│   ├── atoms/                     # Button, Input, Badge
│   ├── molecules/                 # TimerDisplay, BlockListItem
│   ├── organisms/                 # AnalyticsDashboard, SettingsPanel
│   └── templates/                 # PopupLayout, OptionsLayout
│
├── features/
│   ├── blocking/                  # Block rule logic
│   ├── timer/                     # Timer state machine
│   ├── analytics/                 # Stats calculation
│   └── challenges/                # Challenge validators
│
├── hooks/                         # Custom React hooks
├── services/                      # Chrome API wrappers
├── store/                         # Zustand state management
├── types/                         # TypeScript definitions
├── utils/                         # Pure functions
├── popup/                         # Popup entry point
└── options/                       # Options page entry point
```

---

## Development Workflow

### Step 1: Read Relevant Skills First
Before implementing ANY feature, **ALWAYS**:
1. Read `/mnt/skills/public/` skills relevant to the task
2. For documents: Read `docx/SKILL.md`
3. For presentations: Read `pptx/SKILL.md`
4. For spreadsheets: Read `xlsx/SKILL.md`
5. For PDFs: Read `pdf/SKILL.md`

### Step 2: Read Architecture Standards
Before writing code, review:
- `.claude/architecture.md` - System architecture patterns
- `.claude/coding-standards.md` - TypeScript & React standards
- `.claude/security.md` - OWASP ASVS compliance
- `.claude/testing.md` - Testing requirements
- `.claude/ui-ux-standards.md` - Design system
- `.claude/api-hardening.md` - API security
- `.claude/data-protection.md` - Privacy standards

### Step 3: Implement with Quality Gates
For every file you create:
```typescript
// 1. START WITH TYPE DEFINITIONS
interface BlockRule {
  id: string;
  pattern: string;
  type: 'domain' | 'url' | 'keyword';
  enabled: boolean;
}

// 2. CREATE ZOD SCHEMA FOR VALIDATION
const BlockRuleSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string().min(1).max(500),
  type: z.enum(['domain', 'url', 'keyword']),
  enabled: z.boolean(),
});

// 3. IMPLEMENT WITH VALIDATION
class BlockRuleRepository {
  async save(rule: BlockRule): Promise<void> {
    // Validate input
    const validated = BlockRuleSchema.parse(rule);
    
    // Business logic (< 50 lines)
    await this.storage.set('blockRules', validated);
  }
}

// 4. WRITE TESTS IMMEDIATELY
describe('BlockRuleRepository', () => {
  it('validates rule before saving', async () => {
    const repo = new BlockRuleRepository(mockStorage);
    const invalidRule = { id: 123, pattern: '', type: 'invalid' };
    
    await expect(repo.save(invalidRule as any)).rejects.toThrow(ValidationError);
  });
});
```

### Step 4: Test Coverage Requirements
Every function must have:
- ✅ **Unit test** - Logic in isolation
- ✅ **Type test** - TypeScript types verified
- ✅ **Edge cases** - null, undefined, empty arrays, large inputs
- ✅ **Error cases** - Invalid inputs, API failures

### Step 5: Security Review
Before committing any code, verify:
- [ ] All inputs validated with Zod
- [ ] No `any` types without justification
- [ ] Error messages don't leak sensitive data
- [ ] No hardcoded secrets/API keys
- [ ] CSP compliant (no inline scripts)
- [ ] XSS prevention (React escaping or DOMPurify)

---

## Common Tasks & Patterns

### Task: Add New Block Rule Type
```typescript
// 1. Update types
type BlockRuleType = 'domain' | 'url' | 'keyword' | 'regex'; // Add 'regex'

// 2. Update schema
const BlockRuleSchema = z.object({
  type: z.enum(['domain', 'url', 'keyword', 'regex']), // Add 'regex'
  pattern: z.string().refine(
    (val) => {
      if (type === 'regex') {
        // Validate regex (prevent ReDoS)
        return validateRegexPattern(val);
      }
      return true;
    }
  ),
});

// 3. Update blocking engine
class BlockingEngine {
  private matchesRule(url: string, rule: BlockRule): boolean {
    switch (rule.type) {
      case 'domain':
        return this.matchesDomain(url, rule.pattern);
      case 'regex':
        return this.matchesRegex(url, rule.pattern); // New case
      // ...
    }
  }
}

// 4. Write tests
describe('BlockingEngine', () => {
  it('blocks regex patterns', async () => {
    const rule = { type: 'regex', pattern: 'twitter\\.com/.*' };
    expect(await engine.isBlocked('https://twitter.com/home')).toBe(true);
  });
});
```

### Task: Add New Component
```tsx
// 1. Define props interface
interface TimerDisplayProps {
  session: PomodoroSession;
  onStart?: () => void;
  onPause?: () => void;
  className?: string;
}

// 2. Implement with accessibility
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  session,
  onStart,
  onPause,
  className,
}) => {
  const timeLeft = useTimer(session.duration);
  
  return (
    <div className={className} role="timer" aria-live="polite">
      <time>{formatTime(timeLeft)}</time>
      
      <button
        onClick={onStart}
        aria-label="Start 25-minute focus session"
      >
        Start
      </button>
    </div>
  );
};

// 3. Write tests
describe('TimerDisplay', () => {
  it('renders timer correctly', () => {
    render(<TimerDisplay session={mockSession} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });
  
  it('has no accessibility violations', async () => {
    const { container } = render(<TimerDisplay session={mockSession} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Task: Add Chrome API Integration
```typescript
// 1. Create service interface
interface NotificationService {
  show(title: string, message: string): Promise<string>;
  clear(notificationId: string): Promise<boolean>;
}

// 2. Implement with error handling
class ChromeNotificationService implements NotificationService {
  async show(title: string, message: string): Promise<string> {
    try {
      return await chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title: this.sanitize(title),
        message: this.sanitize(message),
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw new NotificationError('Failed to show notification');
    }
  }
  
  private sanitize(text: string): string {
    // Prevent XSS in notifications
    return text.replace(/<[^>]*>/g, '');
  }
}

// 3. Mock in tests
vi.mock('chrome', () => ({
  notifications: {
    create: vi.fn(() => Promise.resolve('notification-id')),
  },
}));
```

---

## Security Patterns (ALWAYS FOLLOW)

### Pattern: Input Validation
```typescript
// ✅ ALWAYS: Validate with Zod before processing
function processBlockRule(input: unknown): BlockRule {
  const validated = BlockRuleSchema.parse(input); // Throws on invalid
  return validated;
}

// ❌ NEVER: Trust input without validation
function processBlockRule(input: any): BlockRule {
  return input; // DANGEROUS
}
```

### Pattern: Error Handling
```typescript
// ✅ ALWAYS: Sanitize error messages
try {
  await saveSettings(userSettings);
} catch (error) {
  console.error('Failed to save settings', error); // Log full error
  throw new Error('Unable to save settings. Please try again.'); // User-facing
}

// ❌ NEVER: Expose internal details
catch (error) {
  throw new Error(`Failed: ${JSON.stringify(userSettings)}`); // Leaks data
}
```

### Pattern: Storage Access
```typescript
// ✅ ALWAYS: Use service wrappers
class SettingsRepository {
  async save(settings: UserSettings): Promise<void> {
    const validated = UserSettingsSchema.parse(settings);
    await chrome.storage.local.set({ settings: validated });
  }
}

// ❌ NEVER: Direct chrome.storage access
await chrome.storage.local.set({ settings: userSettings }); // No validation
```

---

## Performance Requirements

### Bundle Size Limits
- **Popup:** < 50KB (gzipped)
- **Options:** < 100KB (gzipped)
- **Background:** < 30KB (gzipped)

### Optimization Techniques
```typescript
// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

// Memoize expensive calculations
const score = useMemo(
  () => calculateProductivityScore(sessions),
  [sessions]
);

// Debounce search inputs
const debouncedSearch = useDebouncedCallback(
  (query: string) => searchBlockList(query),
  300
);
```

---

## UI/UX Requirements

### Accessibility (WCAG 2.1 AA)
```tsx
// ✅ REQUIRED: ARIA labels, keyboard navigation, focus indicators
<button
  onClick={handleStart}
  aria-label="Start 25-minute focus session"
  className="focus:ring-2 focus:ring-blue-500"
>
  <PlayIcon aria-hidden="true" />
</button>

// ✅ REQUIRED: Semantic HTML
<main id="main-content">
  <h1>Analytics Dashboard</h1>
  {/* Content */}
</main>

// ✅ REQUIRED: Skip links
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Dark Mode Support
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--color-dark-bg);
    --color-text: var(--color-dark-text);
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
describe('ProductivityCalculator', () => {
  it('returns 100 for perfect focus', () => {
    const sessions = [{ focusTime: 1500, distractions: 0 }];
    expect(calculateProductivityScore(sessions)).toBe(100);
  });
  
  it('handles empty sessions', () => {
    expect(() => calculateProductivityScore([])).toThrow(ValidationError);
  });
});
```

### E2E Tests (Playwright)
```typescript
test('user can activate nuclear mode', async ({ page }) => {
  await page.goto('chrome-extension://[id]/options.html');
  await page.click('[data-testid="nuclear-mode-btn"]');
  await page.fill('[data-testid="challenge-input"]', 'I commit to focused work');
  await page.click('[data-testid="confirm-nuclear"]');
  
  await expect(page.locator('[data-testid="nuclear-active"]')).toBeVisible();
});
```

---

## Code Review Checklist

Before submitting ANY code, verify:
- [ ] Read relevant `.claude/*.md` standards
- [ ] TypeScript strict mode passing (no `any` types)
- [ ] All inputs validated with Zod schemas
- [ ] Test coverage ≥ 80% for new code
- [ ] No ESLint errors, max 5 warnings
- [ ] Accessibility tested (axe, keyboard navigation)
- [ ] Bundle size under limits
- [ ] Security checklist passed (no XSS, CSRF, injection)
- [ ] Error messages sanitized
- [ ] No console.log in production code
- [ ] Documentation (TSDoc) on public APIs

---

## Common Mistakes to AVOID

### ❌ NEVER Do This:
```typescript
// 1. Using `any` type
function processData(data: any) { } // FORBIDDEN

// 2. Direct chrome.storage access
await chrome.storage.local.set({ key: value }); // Use service wrapper

// 3. Unvalidated input
const rule = JSON.parse(userInput); // DANGEROUS

// 4. Hardcoded secrets
const API_KEY = 'sk-proj-abc123'; // FORBIDDEN

// 5. Mutating props
function Component({ items }: Props) {
  items.push(newItem); // FORBIDDEN
}

// 6. Inline styles bypassing CSP
<div style="color: red"> // Use className

// 7. Non-null assertion without guard
const value = data!.property; // DANGEROUS

// 8. Ignoring async errors
chrome.storage.local.get('key'); // Missing await
```

### ✅ ALWAYS Do This:
```typescript
// 1. Explicit types with validation
function processData(data: unknown): ProcessedData {
  const validated = DataSchema.parse(data);
  return validated;
}

// 2. Service wrappers
await storageService.set('key', value);

// 3. Validated input
const rule = BlockRuleSchema.parse(JSON.parse(userInput));

// 4. Secure secrets
const apiKey = await apiKeyManager.getKey();

// 5. Immutable updates
const newItems = [...items, newItem];

// 6. CSS classes
<div className="text-red-500">

// 7. Type guards
if (isBlockRule(data)) {
  const value = data.property; // Safe
}

// 8. Proper async handling
try {
  await chrome.storage.local.get('key');
} catch (error) {
  handleError(error);
}
```

---

## Response Format

When implementing features, follow this format:

### 1. Acknowledge Requirements
"I'll implement [feature name] following the Focus Flow architecture standards. I've reviewed:
- `.claude/architecture.md` for [relevant patterns]
- `.claude/security.md` for [security requirements]
- `.claude/coding-standards.md` for [code quality]"

### 2. Plan Implementation
"Implementation plan:
1. Create types and Zod schemas
2. Implement service layer with validation
3. Add UI components with accessibility
4. Write comprehensive tests (≥80% coverage)
5. Security review checklist"

### 3. Implement with Standards
[Show code following all patterns above]

### 4. Testing Evidence
"Test coverage:
- Unit tests: X passing
- E2E tests: Y passing
- Coverage: Z% (meets ≥80% requirement)
- Accessibility: Passed axe audit"

### 5. Security Verification
"Security checklist:
- ✅ All inputs validated with Zod
- ✅ No sensitive data in logs
- ✅ XSS prevention verified
- ✅ Error messages sanitized"

---

## When Stuck

If you encounter a problem:
1. **Re-read the relevant `.claude/*.md` file** - the answer is likely there
2. **Check the PRD** - verify you understand the requirement
3. **Review existing code** - find similar patterns already implemented
4. **Ask for clarification** - don't make assumptions about requirements

---

## Success Criteria

Code is ready to merge when:
- ✅ TypeScript compiles with strict mode
- ✅ All tests passing (≥80% coverage)
- ✅ ESLint clean (0 errors, <5 warnings)
- ✅ Accessibility audit passed
- ✅ Security checklist completed
- ✅ Bundle size under limits
- ✅ Follows all `.claude/*.md` standards

---

**Remember:** Quality over speed. Taking time to follow these standards prevents bugs, security issues, and technical debt. Every shortcut creates future work.