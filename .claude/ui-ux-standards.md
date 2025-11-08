# UI/UX Standards - Focus Mode & Pomodoro Timer Extension

## Design Philosophy

**Core Principles**:
1. **Clarity Over Cleverness**: Every UI element has one clear purpose
2. **Respect User Time**: Minimal clicks, no unnecessary confirmations
3. **Progressive Disclosure**: Advanced features hidden until needed
4. **Consistency**: Same patterns throughout (buttons, colors, spacing)
5. **Accessibility First**: WCAG 2.1 AA compliance mandatory

---

## Design System

### Color Palette

```css
/* Primary - Focus Red (Work Sessions) */
--color-primary-50: #fef2f2;
--color-primary-100: #fee2e2;
--color-primary-200: #fecaca;
--color-primary-300: #fca5a5;
--color-primary-400: #f87171;
--color-primary-500: #ef4444;  /* Main brand color */
--color-primary-600: #dc2626;  /* Hover states */
--color-primary-700: #b91c1c;
--color-primary-800: #991b1b;
--color-primary-900: #7f1d1d;

/* Success - Break Green (Rest Periods) */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-200: #bbf7d0;
--color-success-300: #86efac;
--color-success-400: #4ade80;
--color-success-500: #22c55e;  /* Active break */
--color-success-600: #16a34a;  /* Hover states */
--color-success-700: #15803d;
--color-success-800: #166534;
--color-success-900: #14532d;

/* Neutral - UI Base */
--color-neutral-50: #fafafa;
--color-neutral-100: #f5f5f5;
--color-neutral-200: #e5e5e5;
--color-neutral-300: #d4d4d4;
--color-neutral-400: #a3a3a3;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;

/* Warning - Time Running Out */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-200: #fde68a;
--color-warning-300: #fcd34d;
--color-warning-400: #fbbf24;
--color-warning-500: #f59e0b;  /* Low time alerts */
--color-warning-600: #d97706;
--color-warning-700: #b45309;
--color-warning-800: #92400e;
--color-warning-900: #78350f;

/* Error - Critical Alerts */
--color-error-50: #fef2f2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;

/* Info - Neutral Information */
--color-info-50: #eff6ff;
--color-info-500: #3b82f6;
--color-info-600: #2563eb;
```

**Color Usage Guidelines**:
- Primary Red: Work sessions, active focus mode, CTAs
- Success Green: Breaks, achievements, completed tasks
- Warning Orange: <5 min remaining, skipped breaks, nuclear mode warnings
- Neutral Gray: UI backgrounds, disabled states, secondary text
- Error Red: Form validation errors, failed operations

**Contrast Requirements (WCAG 2.1 AA)**:
- Normal text (16px): minimum 4.5:1 contrast ratio
- Large text (24px): minimum 3:1 contrast ratio
- UI components: minimum 3:1 contrast ratio

### Typography

```css
/* Font Families */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Monaco, "Cascadia Code", 
             "Courier New", monospace;

/* Font Sizes (Tailwind scale) */
--text-xs: 0.75rem;    /* 12px - Small labels */
--text-sm: 0.875rem;   /* 14px - Body text */
--text-base: 1rem;     /* 16px - Default */
--text-lg: 1.125rem;   /* 18px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Headings */
--text-2xl: 1.5rem;    /* 24px - Page titles */
--text-3xl: 1.875rem;  /* 30px - Hero text */
--text-4xl: 2.25rem;   /* 36px - Timer display (mobile) */
--text-6xl: 3.75rem;   /* 60px - Timer display (desktop) */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Typography Examples**:
```tsx
// Popup Heading
<h1 className="text-2xl font-bold text-neutral-900">
  Focus Mode
</h1>

// Timer Display
<div className="text-6xl font-bold text-primary-500 tabular-nums">
  25:00
</div>

// Body Text
<p className="text-sm font-normal text-neutral-600">
  Complete 4 Pomodoros to earn a long break
</p>

// Small Label
<span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
  Today's Focus
</span>
```

**Tabular Numbers**:
- Always use `tabular-nums` for timer displays to prevent width jumping
- Use `font-variant-numeric: tabular-nums` or Tailwind's `tabular-nums` class

### Spacing Scale

```css
/* Tailwind Spacing (rem-based) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px - Tight spacing */
--space-2: 0.5rem;    /* 8px - Small gaps */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px - Default spacing */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px - Section spacing */
--space-8: 2rem;      /* 32px - Large gaps */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px - Major sections */
--space-16: 4rem;     /* 64px - Hero spacing */
```

**Spacing Guidelines**:
- Use 4px grid system (all spacing multiples of 4)
- Component padding: `space-4` (16px)
- Section gaps: `space-6` to `space-8` (24-32px)
- Card padding: `space-6` (24px)

### Border Radius

```css
--radius-sm: 0.25rem;  /* 4px - Small elements */
--radius-md: 0.375rem; /* 6px - Buttons, inputs */
--radius-lg: 0.5rem;   /* 8px - Cards */
--radius-xl: 0.75rem;  /* 12px - Modals */
--radius-full: 9999px; /* Fully rounded (pills, badges) */
```

### Shadows

```css
/* Elevation levels */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Focus rings */
--shadow-focus: 0 0 0 3px rgba(239, 68, 68, 0.5); /* Primary color */
```

**Shadow Usage**:
- Popup/Options pages: No shadow (fills window)
- Cards: `shadow-md`
- Modals: `shadow-xl`
- Dropdowns: `shadow-lg`
- Buttons: No shadow (flat design)

---

## Component Library

### Buttons

#### Primary Button
```tsx
<button className="
  px-6 py-3 
  bg-primary-500 hover:bg-primary-600 active:bg-primary-700
  text-white font-semibold text-sm
  rounded-lg
  transition-colors duration-150
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Start Pomodoro
</button>
```

**Accessibility**:
- `aria-label` if text is not descriptive
- `disabled` attribute for non-clickable states
- Visible focus indicator (ring)

#### Secondary Button
```tsx
<button className="
  px-4 py-2
  bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300
  text-neutral-900 font-medium text-sm
  rounded-md
  transition-colors duration-150
  focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2
">
  Skip Break
</button>
```

#### Destructive Button
```tsx
<button className="
  px-4 py-2
  bg-red-500 hover:bg-red-600 active:bg-red-700
  text-white font-semibold text-sm
  rounded-md
  transition-colors duration-150
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
">
  Delete Streak
</button>
```

#### Icon Button
```tsx
<button 
  className="
    p-2
    text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100
    rounded-md
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-primary-500
  "
  aria-label="Settings"
>
  <SettingsIcon className="w-5 h-5" />
</button>
```

**Button States**:
- Default: Base colors
- Hover: Slightly darker background
- Active: Darkest background
- Focus: Ring indicator (keyboard navigation)
- Disabled: 50% opacity, no hover effects

### Inputs

#### Text Input
```tsx
<input
  type="text"
  className="
    w-full px-4 py-2
    border border-neutral-300
    rounded-md
    text-neutral-900 placeholder:text-neutral-400
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
    disabled:bg-neutral-100 disabled:cursor-not-allowed
    transition-all duration-150
  "
  placeholder="Enter task name..."
  aria-label="Task name"
/>
```

**Validation States**:
```tsx
// Error state
<input className="border-red-500 focus:ring-red-500" />
<p className="mt-1 text-sm text-red-600">Please enter a valid URL</p>

// Success state
<input className="border-green-500 focus:ring-green-500" />
<p className="mt-1 text-sm text-green-600">Site added successfully</p>
```

### Cards

```tsx
<div className="
  p-6
  bg-white
  rounded-lg shadow-md
  border border-neutral-200
">
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    Today's Focus
  </h3>
  <p className="text-sm text-neutral-600">
    3 Pomodoros completed, 2 hours focused
  </p>
</div>
```

### Modals

```tsx
<div 
  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <div className="
    bg-white rounded-xl shadow-xl
    p-6 max-w-md w-full mx-4
    transform transition-all
  ">
    <h2 id="modal-title" className="text-xl font-bold text-neutral-900 mb-4">
      Activate Nuclear Mode
    </h2>
    
    <p className="text-sm text-neutral-600 mb-6">
      You won't be able to modify settings for the next 4 hours.
    </p>
    
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md">
        Cancel
      </button>
      <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">
        Activate
      </button>
    </div>
  </div>
</div>
```

**Modal Accessibility**:
- `role="dialog"` on container
- `aria-modal="true"` to indicate modal state
- `aria-labelledby` pointing to title ID
- Focus trap (Tab cycles within modal only)
- Escape key closes modal

### Badges

```tsx
// Status badge (work session active)
<span className="
  inline-flex items-center gap-1
  px-2 py-1
  bg-red-100 text-red-700
  text-xs font-medium
  rounded-full
">
  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
  Focus Mode
</span>

// Counter badge (streak)
<span className="
  inline-flex items-center justify-center
  w-6 h-6
  bg-primary-500 text-white
  text-xs font-bold
  rounded-full
">
  7
</span>

// Achievement badge
<div className="
  flex flex-col items-center gap-2
  p-4
  bg-gradient-to-br from-yellow-100 to-orange-100
  rounded-lg border-2 border-yellow-400
">
  <span className="text-3xl">🏆</span>
  <span className="text-sm font-semibold text-yellow-900">7 Day Streak!</span>
</div>
```

### Progress Indicators

#### Progress Bar
```tsx
<div className="w-full bg-neutral-200 rounded-full h-2">
  <div 
    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
    style={{ width: `${(completed / total) * 100}%` }}
    role="progressbar"
    aria-valuenow={completed}
    aria-valuemin={0}
    aria-valuemax={total}
  />
</div>
```

#### Circular Progress (Timer Ring)
```tsx
<svg className="w-64 h-64 transform -rotate-90">
  {/* Background circle */}
  <circle
    cx="128"
    cy="128"
    r="120"
    stroke="currentColor"
    strokeWidth="8"
    fill="none"
    className="text-neutral-200"
  />
  
  {/* Progress circle */}
  <circle
    cx="128"
    cy="128"
    r="120"
    stroke="currentColor"
    strokeWidth="8"
    fill="none"
    className="text-primary-500 transition-all duration-1000"
    strokeDasharray={`${2 * Math.PI * 120}`}
    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress)}`}
    strokeLinecap="round"
  />
</svg>
```

### Loading States

#### Skeleton Loader
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-neutral-200 rounded w-3/4" />
  <div className="h-32 bg-neutral-200 rounded" />
  <div className="h-4 bg-neutral-200 rounded w-1/2" />
</div>
```

#### Spinner
```tsx
<div className="
  inline-block
  w-6 h-6
  border-2 border-neutral-300 border-t-primary-500
  rounded-full
  animate-spin
"
  role="status"
  aria-label="Loading"
/>
```

---

## Layout Guidelines

### Popup Dimensions
```css
/* Default popup size (manifest.json) */
width: 400px;
min-height: 600px;
max-height: 800px;
```

**Layout Structure**:
```tsx
<div className="w-full min-h-screen bg-neutral-50 p-4">
  {/* Header */}
  <header className="mb-6">
    <h1 className="text-2xl font-bold">Focus Mode</h1>
  </header>
  
  {/* Main Content */}
  <main className="space-y-6">
    {/* Timer Section */}
    <section>...</section>
    
    {/* Stats Section */}
    <section>...</section>
  </main>
  
  {/* Footer */}
  <footer className="mt-8 pt-4 border-t border-neutral-200">
    <button>Settings</button>
  </footer>
</div>
```

### Responsive Design

**Breakpoints** (for full-page options/analytics):
```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

**Grid Layouts**:
```tsx
// Analytics cards - responsive grid
<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
">
  <StatsCard title="Focus Time" value="3h 45m" />
  <StatsCard title="Pomodoros" value="9" />
  <StatsCard title="Streak" value="7 days" />
</div>
```

---

## Animation Standards

### Transitions

**Duration Guidelines**:
- Micro-interactions (hover): 150ms
- Component changes (tabs): 300ms
- Page transitions: 500ms
- Never use transitions >1000ms

**Easing Functions**:
```css
/* Default (most interactions) */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */

/* Entrances */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1); /* ease-in */

/* Exits */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1); /* ease-out */

/* Bouncy (celebrations) */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* spring */
```

**Examples**:
```tsx
// Button hover
<button className="
  transition-colors duration-150 ease-out
  hover:bg-primary-600
">
  Start
</button>

// Modal entrance
<div className="
  transition-all duration-300 ease-out
  transform scale-100 opacity-100
  data-[state=closed]:scale-95 data-[state=closed]:opacity-0
">
  Modal content
</div>

// Timer tick (subtle pulse every second)
<div className="
  transition-transform duration-150
  animate-pulse
">
  {remainingSeconds}
</div>
```

### Animations

```css
/* Pulse (live indicator) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin (loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Slide up (modal entrance) */
@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Confetti (achievement unlock) */
@keyframes confetti {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

**Usage**:
```tsx
// Pulse
<div className="animate-pulse">Live</div>

// Spin
<div className="animate-spin">⏳</div>

// Custom animation
<div className="animate-[slideUp_300ms_ease-out]">
  Modal
</div>
```

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

**Focus Management**:
- All interactive elements must be keyboard accessible (Tab, Enter, Space)
- Visible focus indicators required (2px ring, high contrast)
- Logical tab order (top-to-bottom, left-to-right)
- Skip links for complex pages

**Focus Styles**:
```tsx
<button className="
  focus:outline-none
  focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
">
  Action
</button>
```

**Keyboard Shortcuts**:
```typescript
// Popup keyboard shortcuts
Space: Start/pause timer
Escape: Close modal/popup
Tab: Navigate forward
Shift+Tab: Navigate backward
Enter: Activate focused button
```

### Screen Readers

**ARIA Labels**:
```tsx
// Icon buttons
<button aria-label="Start Pomodoro timer">
  <PlayIcon />
</button>

// Timer display
<div 
  role="timer" 
  aria-live="polite" 
  aria-atomic="true"
  aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
>
  {formatTime(remainingSeconds)}
</div>

// Status indicators
<span className="sr-only">
  Focus mode active
</span>
<div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
```

**Live Regions**:
```tsx
// Alert (high priority)
<div role="alert" aria-live="assertive">
  Nuclear mode activated!
</div>

// Status (low priority)
<div role="status" aria-live="polite">
  Pomodoro completed
</div>
```

**Screen Reader Only Text**:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Color Contrast

**Testing Tools**:
- Chrome DevTools Lighthouse
- Axe DevTools browser extension
- WebAIM Contrast Checker

**Requirements**:
- Text: 4.5:1 minimum (normal text)
- Large text: 3:1 minimum (18px+ or 14px+ bold)
- UI components: 3:1 minimum

**Examples**:
```tsx
// ✅ PASS: text-neutral-900 on white (21:1 contrast)
<p className="text-neutral-900 bg-white">High contrast</p>

// ❌ FAIL: text-neutral-400 on white (2.7:1 contrast)
<p className="text-neutral-400 bg-white">Low contrast</p>

// ✅ PASS: Use darker gray
<p className="text-neutral-600 bg-white">Acceptable contrast</p>
```

### Focus Indicators

```tsx
// Global focus style (apply to all interactive elements)
<style>{`
  *:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`}</style>

// Alternative: ring utility (Tailwind)
<button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Button
</button>
```

---

## Error Handling & Empty States

### Error Messages

```tsx
// Form validation error
<div className="rounded-md bg-red-50 border border-red-200 p-4">
  <div className="flex items-start gap-3">
    <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
    <div>
      <h3 className="text-sm font-semibold text-red-800">Invalid URL</h3>
      <p className="text-sm text-red-700 mt-1">
        Please enter a valid website URL (e.g., youtube.com)
      </p>
    </div>
  </div>
</div>

// Inline error
<div>
  <input 
    className="border-red-500 focus:ring-red-500"
    aria-invalid="true"
    aria-describedby="url-error"
  />
  <p id="url-error" className="mt-1 text-sm text-red-600">
    URL must start with http:// or https://
  </p>
</div>
```

### Success Messages

```tsx
<div className="rounded-md bg-green-50 border border-green-200 p-4">
  <div className="flex items-center gap-3">
    <CheckCircleIcon className="w-5 h-5 text-green-600" />
    <p className="text-sm font-medium text-green-800">
      Site added to block list
    </p>
  </div>
</div>
```

### Empty States

```tsx
// No data yet
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
    <ChartIcon className="w-8 h-8 text-neutral-400" />
  </div>
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
    No analytics yet
  </h3>
  <p className="text-sm text-neutral-600 max-w-sm mb-4">
    Complete your first Pomodoro session to see your productivity stats
  </p>
  <button className="px-4 py-2 bg-primary-500 text-white rounded-md">
    Start Pomodoro
  </button>
</div>
```

---

## Dark Mode (Future Enhancement)

**Color Adjustments**:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #171717;
    --color-surface: #262626;
    --color-text-primary: #fafafa;
    --color-text-secondary: #a3a3a3;
    --color-border: #404040;
  }
}
```

**Implementation**:
```tsx
<div className="
  bg-white dark:bg-neutral-900
  text-neutral-900 dark:text-white
  border-neutral-200 dark:border-neutral-700
">
  Content
</div>
```

---

## Performance Guidelines

### Rendering Performance

1. **Avoid Layout Thrashing**:
   ```tsx
   // ❌ BAD: Forces reflow on every render
   const width = element.offsetWidth;
   element.style.width = `${width + 10}px`;
   
   // ✅ GOOD: Use CSS transitions
   <div className="transition-all duration-300 hover:w-[calc(100%+10px)]">
   ```

2. **Use CSS for Animations**:
   ```tsx
   // ✅ GOOD: GPU-accelerated
   <div className="transition-transform duration-300 transform hover:scale-105">
   
   // ❌ BAD: JavaScript animation (janky)
   requestAnimationFrame(() => {
     element.style.width = `${newWidth}px`;
   });
   ```

3. **Debounce/Throttle User Input**:
   ```tsx
   const debouncedSearch = useMemo(
     () => debounce((value) => performSearch(value), 300),
     []
   );
   ```

### Image Optimization

```tsx
// Use appropriate sizes
<img 
  src="/icon-128.png"
  srcSet="/icon-128.png 1x, /icon-256.png 2x"
  alt="Focus Mode"
  width={128}
  height={128}
  loading="lazy"
/>
```

---

## Component Checklist

Before marking a component as complete, verify:

### Visual Design
- [ ] Matches design system colors
- [ ] Uses spacing scale (multiples of 4px)
- [ ] Correct border radius applied
- [ ] Shadows appropriate for elevation
- [ ] Typography follows scale

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and high contrast
- [ ] ARIA labels on icon buttons
- [ ] Color contrast ≥4.5:1 for text
- [ ] Screen reader tested

### Responsive Design
- [ ] Works at 320px width (minimum)
- [ ] Scales appropriately to 1920px
- [ ] Touch targets ≥44×44px (mobile)
- [ ] No horizontal scroll

### Performance
- [ ] No layout shifts (CLS)
- [ ] Animations use transform/opacity only
- [ ] Images optimized and lazy-loaded
- [ ] Re-renders minimized

### Browser Support
- [ ] Chrome 120+ (primary)
- [ ] Edge 120+
- [ ] Brave (Chromium-based)

---

**Document End**  
All UI components must meet these standards before production deployment.
