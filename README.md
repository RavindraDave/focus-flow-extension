# Focus Flow

A powerful Chrome Extension for productivity and focus management with Pomodoro timer, website blocking, and advanced analytics.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Development](#development)
- [API Reference](#api-reference)
- [Security](#security)
- [Privacy](#privacy)
- [Browser Compatibility](#browser-compatibility)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Pomodoro Timer

- **Customizable sessions**: Configure work (1-60 min, default 25), short break (1-30 min, default 5), and long break (1-60 min, default 15) durations
- **Auto-start**: Automatically start next session after completion
- **Smart cycles**: Automatic long break after configurable number of work sessions (2-10, default 4)
- **Timer states**: Idle, Work, Short Break, Long Break, Paused with visual indicators
- **Badge display**: Extension icon shows remaining time with color coding (red=work, green=break, gray=paused)
- **Quick stats**: View current streak, total focus time, and sessions at a glance
- **Notifications**: Desktop notifications and optional sound alerts when sessions complete
- **Session tracking**: Records all sessions with type, duration, task name, category, and completion status

### Website Blocking

- **Domain blocking**: Block entire domains (e.g., `youtube.com`, `twitter.com`)
- **URL pattern blocking**: Block specific URLs with pattern matching
- **Keyword blocking**: Block any URL containing specific keywords
- **Daily allowances**: Set time limits for specific sites (e.g., 30 min/day for social media)
- **Automatic reset**: Daily allowances reset at midnight
- **Rule management**: Enable/disable rules individually, add/edit/delete in real-time
- **Enhanced blocked page**: Shows remaining time, streak info, and motivational content
- **Chrome declarativeNetRequest**: Uses modern Chrome API for efficient, performant blocking

### Scheduling

- **Time-based schedules**: Block sites during specific hours (e.g., 9 AM - 5 PM)
- **Day selection**: Apply schedules to specific days with quick presets (Weekdays, Weekends, Every Day)
- **Multiple schedules**: Create unlimited schedules for different contexts (work hours, study time, etc.)
- **Schedule exceptions**: Define specific dates to skip (holidays, etc.)
- **Timezone support**: Full IANA timezone support for accurate time calculations
- **Auto-activation**: Schedules automatically enable/disable block rules based on current time
- **Minute-level precision**: Checks every 60 seconds for accurate scheduling

### Nuclear Mode (Premium)

- **Commitment mechanism**: Lock yourself into focus mode for a set duration (1-8 hours)
- **Tamper-proof**: Uses HMAC-SHA256 cryptographic signatures to prevent disabling
- **Time manipulation detection**: Detects if system clock is adjusted backward
- **Challenge system**: Solve challenges to cancel (with attempts tracking)
- **Failed attempts monitoring**: Tracks all deactivation attempts
- **Device-specific security**: Generated secret per browser profile
- **Visual feedback**: Clear countdown timer with progress bar when active

### Analytics Dashboard

- **Overview cards**:
  - Today's focus time
  - Current streak with personal best
  - Completion rate with quality badges
  - Sessions completed today

- **Weekly & Monthly summaries**:
  - Total pomodoros completed
  - Total focus time (hours/minutes)
  - Daily average
  - Completion rate percentage
  - Top 5 productivity categories

- **Visual charts** (Chart.js):
  - 7-day focus time trend (bar chart)
  - Session distribution pie chart (work vs breaks)
  - 24-hour productivity heatmap
  - Focus time trends over 30 days
  - Session completion rates

- **Focus Score** (0-100 scale):
  - 40% Completion Rate (completed / total sessions)
  - 30% Consistency (active days in last 7 days)
  - 30% Streak (current streak / 30 days, capped)

- **Historical data**: Track up to 90 days of session history with automatic cleanup

### Streak & Achievements

- **Daily streaks**: Track consecutive days with at least one completed pomodoro
- **Streak protection** (Premium): 2 freeze days per month to protect your streak
- **Monthly freeze reset**: Freezes replenish automatically each month
- **Achievement system**: Unlock badges for milestones:
  - First Pomodoro - Complete your first session
  - Century Club (100 sessions)
  - Streak Warrior (7-day streak)
  - Marathon Runner (30-day streak)
  - Focus Beast (1000+ minutes)
  - And more...
- **Motivation**: Visual progress indicators and celebration animations

### Data Export

- **CSV export**: Full session history with all fields (ID, type, duration, timestamps, status, category)
- **JSON export**: Complete analytics data including sessions, daily stats, streaks, achievements
- **Data portability**: Download and backup your productivity history
- **Privacy-first**: All data stored locally, export for your own use

### YouTube Controls (Premium)

- **Hide YouTube Shorts**: Removes Shorts shelf and #shorts tab completely
- **Hide recommendations**: Removes sidebar recommendations and suggested videos
- **Hide comments section**: Hides all comments on video pages
- **Hide homepage feed**: Hides trending and recommended content on homepage
- **Individual toggles**: Enable only the controls you need
- **Seamless integration**: Uses MutationObserver for dynamic content
- **Performance optimized**: <50ms execution, debounced updates
- **Accessibility maintained**: Uses aria-hidden attributes (WCAG 2.1 AA compliant)

### Customization

- **Theme support**: Light, dark, or system-synchronized themes
- **Custom categories**: Tag sessions with custom categories for better analytics
- **Flexible settings**: Customize all timer durations and behaviors
- **Task naming**: Add optional task names/descriptions to sessions
- **Reset to defaults**: One-click reset for all settings

## Installation

### From Chrome Web Store

1. Visit the [Focus Flow page on Chrome Web Store](#) (coming soon)
2. Click "Add to Chrome"
3. Grant necessary permissions
4. Start focusing!

### Development Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RavindraDave/focus-flow-extension.git
   cd focus-flow-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

5. **Start developing** (optional)
   ```bash
   npm run dev
   ```
   This starts the development server with hot reload.

## Usage Guide

### Getting Started

1. **Click the extension icon** in your Chrome toolbar to open the popup
2. **Start a work session** by clicking the "Start" button
3. **Configure settings** by clicking "Settings" or right-click icon -> Options

### Popup Interface

The popup provides quick access to:
- **Timer Display**: Large circular countdown with progress ring, color-coded by session type
- **Timer Controls**: Start, Pause, Resume, Stop buttons (state-aware)
- **Quick Stats**: Today's focus time, pomodoros completed, current streak, longest streak
- **Nuclear Mode**: Activate commitment mode from popup

### Setting Up Website Blocking

1. Open **Options** (right-click extension icon -> Options)
2. Navigate to **"Block List"** tab
3. Click **"Add Rule"**
4. Configure your rule:
   - **Name**: Descriptive name (e.g., "Social Media Block") - max 100 characters
   - **Pattern**: URL/domain to block (e.g., `facebook.com`) - max 2048 characters
   - **Type**: Choose Domain, Keyword, or URL pattern
   - **Allowance**: Optional daily time limit in minutes (1-1440, leave empty for full block)
   - **Enabled**: Toggle rule on/off
5. Click **"Save"**

**Pattern Examples:**
- Domain: `youtube.com` - blocks entire domain including subdomains
- Keyword: `social` - blocks any URL containing "social"
- URL: `reddit.com/r/programming` - blocks specific path

### Creating Schedules

1. Open **Options** -> **"Schedules"** tab
2. Click **"Add Schedule"**
3. Configure:
   - **Name**: Schedule name (e.g., "Work Hours") - max 100 characters
   - **Start Time**: When blocking starts (24-hour format, e.g., 09:00)
   - **End Time**: When blocking ends (must be after start time)
   - **Days**: Select which days it applies (quick presets available)
   - **Block Rules**: Select which rules to activate during this schedule
   - **Exceptions**: Add specific dates to skip (holidays, etc.)
   - **Timezone**: Auto-detected, but can be changed
4. Click **"Save"**

### Using Nuclear Mode

1. Click the **Nuclear Mode** button in the popup
2. Set your commitment duration (1 to 8 hours)
3. **Confirm** - once activated, it CANNOT be easily disabled
4. Timer shows remaining time with progress bar
5. To cancel early, you'll need to solve challenges (attempts are monitored)

**Warning**: Nuclear mode uses cryptographic signatures to prevent tampering. Think carefully before activating!

### Viewing Analytics

1. Open **Options** -> **"Analytics"** tab
2. View your productivity metrics:
   - **Overview Cards**: Today's stats, streak info, completion rate
   - **Weekly Summary**: Last 7 days aggregated data
   - **Charts**: Visual trends and patterns
   - **Focus Score**: Your productivity score (0-100)
3. **Export data** using the "Export" buttons:
   - CSV: Session history spreadsheet
   - JSON: Full analytics data

### Customizing Timer Settings

1. Open **Options** -> **"Settings"** tab
2. Adjust timer durations:
   - Work session duration (1-60 min, default 25)
   - Short break duration (1-30 min, default 5)
   - Long break duration (1-60 min, default 15)
   - Sessions until long break (2-10, default 4)
3. Toggle features:
   - Auto-start next session
   - Sound notifications
   - Desktop notifications
4. Select theme (Light/Dark/System)
5. Reset to defaults if needed

### YouTube Controls (Premium)

1. Open **Options** -> **"YouTube"** tab
2. Enable master toggle
3. Configure individual controls:
   - Hide Shorts
   - Hide Recommendations
   - Hide Comments
   - Hide Feed
4. Save settings
5. Refresh YouTube to see changes

## Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for lightweight, performant state
- **Charts**: Chart.js with react-chartjs-2
- **Validation**: Zod for runtime type safety
- **Build Tool**: Vite with custom plugins
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Code Quality**: ESLint + Prettier

### Project Structure

```
focus-flow-extension/
├── src/
│   ├── background/                 # Background service worker
│   │   ├── index.ts                   # Main entry, message handlers (40+ types)
│   │   ├── timer-engine.ts            # Pomodoro timer logic with alarms
│   │   ├── blocker-engine.ts          # Website blocking with declarativeNetRequest
│   │   ├── analytics-tracker.ts       # Analytics aggregation and scoring
│   │   ├── streak-tracker.ts          # Streak management with freeze system
│   │   ├── nuclear-mode-manager.ts    # Cryptographic commitment mode
│   │   └── schedule-manager.ts        # Time-based schedule automation
│   │
│   ├── popup/                      # Extension popup UI
│   │   ├── index.html                 # Popup entry point
│   │   ├── main.tsx                   # React mount point
│   │   ├── App.tsx                    # Main popup component
│   │   └── components/
│   │       ├── TimerDisplay.tsx       # Circular countdown timer
│   │       ├── TimerControls.tsx      # Start/Pause/Resume/Stop buttons
│   │       ├── QuickStats.tsx         # Today's stats cards
│   │       ├── NuclearModeStatus.tsx  # Active nuclear mode display
│   │       └── NuclearModeModal.tsx   # Activation dialog
│   │
│   ├── options/                    # Settings/options page
│   │   ├── index.html                 # Options entry point
│   │   ├── main.tsx                   # React mount point
│   │   ├── App.tsx                    # Main options component with tabs
│   │   └── components/
│   │       ├── SettingsTab.tsx        # Timer and app settings
│   │       ├── AnalyticsDashboard.tsx # Charts and statistics
│   │       ├── BlockRuleList.tsx      # Block rules management
│   │       ├── BlockRuleForm.tsx      # Add/edit block rules
│   │       ├── ScheduleList.tsx       # Schedules management
│   │       ├── ScheduleForm.tsx       # Add/edit schedules
│   │       └── YouTubeSettings.tsx    # YouTube controls (premium)
│   │
│   ├── blocked/                    # Blocked page UI
│   │   └── index.html                 # Shown when site is blocked
│   │
│   ├── content/                    # Content scripts
│   │   └── youtube.ts                 # YouTube distraction remover
│   │
│   ├── services/                   # Data services & repositories
│   │   ├── storage-service.ts         # Low-level Chrome storage API
│   │   ├── session-repository.ts      # Session CRUD operations
│   │   ├── analytics-repository.ts    # Analytics data management
│   │   ├── settings-repository.ts     # Settings management
│   │   ├── block-rule-repository.ts   # Block rules management
│   │   └── schedule-repository.ts     # Schedule management
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── index.ts                   # All data type interfaces
│   │   ├── messages.ts                # Message types for IPC
│   │   └── schemas.ts                 # Zod validation schemas
│   │
│   ├── utils/                      # Utility functions
│   │   ├── crypto.ts                  # HMAC-SHA256 cryptography
│   │   ├── data-export.ts             # CSV/JSON export functions
│   │   └── constants.ts               # App constants and defaults
│   │
│   └── hooks/                      # React hooks
│       └── useTimer.ts                # Timer state hook
│
├── public/                         # Static assets
│   ├── manifest.json                  # Chrome extension manifest v3
│   ├── blocked.html                   # Blocked page template
│   ├── blocked.js                     # Blocked page script
│   └── icons/                         # Extension icons (16, 32, 48, 128px)
│
├── tests/                          # Test files
│   ├── unit/                          # Unit tests (Vitest)
│   └── e2e/                           # End-to-end tests (Playwright)
│
├── types/                          # Additional type declarations
│   └── chrome.d.ts                    # Chrome API types
│
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── vitest.config.ts                # Vitest test configuration
├── playwright.config.ts            # Playwright E2E configuration
├── .eslintrc.cjs                   # ESLint configuration
└── package.json                    # Dependencies and scripts
```

### Data Flow

1. **User Action** -> Popup/Options UI
2. **Message** -> Chrome runtime messaging (`chrome.runtime.sendMessage`)
3. **Background Worker** -> Processes message, updates storage
4. **Storage Event** -> Triggers UI update via storage listeners
5. **UI Update** -> React re-renders with new state

### Message Types

The extension uses 40+ message types for communication:

**Timer Messages:**
- `TIMER_START`, `TIMER_PAUSE`, `TIMER_RESUME`, `TIMER_STOP`
- `TIMER_GET_STATUS`

**Nuclear Mode:**
- `NUCLEAR_MODE_ACTIVATE`, `NUCLEAR_MODE_DEACTIVATE`, `NUCLEAR_MODE_GET_STATUS`

**Analytics:**
- `ANALYTICS_GET`, `ANALYTICS_GET_FOCUS_SCORE`
- `ANALYTICS_GET_WEEKLY_SUMMARY`, `ANALYTICS_GET_MONTHLY_SUMMARY`

**Block Rules CRUD:**
- `BLOCKLIST_GET_ALL`, `BLOCKLIST_ADD`, `BLOCKLIST_UPDATE`, `BLOCKLIST_DELETE`

**Schedule CRUD:**
- `SCHEDULE_GET_ALL`, `SCHEDULE_ADD`, `SCHEDULE_UPDATE`, `SCHEDULE_DELETE`

**Settings:**
- `SETTINGS_GET`, `SETTINGS_UPDATE`

**Sessions:**
- `SESSION_GET_HISTORY`, `SESSION_GET_TODAY`

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run type-check       # Run TypeScript type checking
npm run lint             # Lint code (ESLint)
npm run lint:fix         # Auto-fix lint issues
npm run format           # Format code (Prettier)
npm run format:check     # Check code formatting

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
npm run e2e              # Run E2E tests
npm run e2e:ui           # Run E2E tests with UI

# Distribution
npm run zip              # Create distribution zip file
```

### Building for Production

```bash
# Clean build
rm -rf dist && npm run build

# Create distribution package
npm run zip
```

The built extension will be in the `dist/` folder.

### Build Configuration

The Vite config includes:
- Multi-entry build (popup, options, background, content scripts)
- Custom plugin to move HTML files to correct paths for Chrome extension
- Path aliases for clean imports (`@/components`, `@/services`, etc.)
- Source maps in development, minification in production

### Testing

```bash
# Run all unit tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run e2e
```

### Code Quality Standards

- **TypeScript strict mode** - Catch errors at compile time
- **ESLint** with React and TypeScript rules - Consistent code patterns
- **Prettier** - Consistent formatting
- **Zod validation** - Runtime type safety for all data
- **Comprehensive tests** - Unit + E2E coverage
- **Accessibility** - WCAG 2.1 AA compliance in UI components

## API Reference

### Storage Schema

**Session:**
```typescript
{
  id: string;                    // UUID v4
  type: 'work' | 'short-break' | 'long-break';
  duration: number;              // Planned duration in minutes
  actualDuration: number;        // Actual time spent
  startTime: string;             // ISO 8601
  endTime: string;               // ISO 8601
  taskName?: string;             // Optional task description
  category?: string;             // Optional category tag
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}
```

**Block Rule:**
```typescript
{
  id: string;
  name: string;                  // 1-100 characters
  pattern: string;               // 1-2048 characters
  patternType: 'domain' | 'url' | 'keyword';
  allowanceMinutes?: number;     // 1-1440 or null for full block
  enabled: boolean;
}
```

**Schedule:**
```typescript
{
  id: string;
  name: string;                  // 1-100 characters
  startTime: string;             // HH:MM format
  endTime: string;               // HH:MM format (must be after start)
  daysOfWeek: number[];          // 0=Sunday, 6=Saturday
  blockRuleIds: string[];        // Rules to activate
  exceptions: string[];          // ISO dates to skip
  timezone: string;              // IANA timezone
  enabled: boolean;
}
```

**Settings:**
```typescript
{
  workDuration: number;          // 1-60 minutes
  shortBreakDuration: number;    // 1-30 minutes
  longBreakDuration: number;     // 1-60 minutes
  sessionsUntilLongBreak: number; // 2-10
  autoStartNextSession: boolean;
  enableSounds: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  enableSync: boolean;
  premiumLicenseKey?: string;
}
```

## Security

### Implemented Security Features

- **HMAC-SHA256 signatures**: Nuclear mode uses cryptographic signatures to prevent tampering
- **Time manipulation detection**: Detects backward clock adjustments
- **Device-specific secrets**: Unique secret per browser profile (min 32 characters)
- **Input sanitization**: All user inputs sanitized, no HTML tags allowed
- **Zod validation**: Runtime type checking prevents prototype pollution
- **SSRF protection**: URL pattern validation prevents malicious patterns
- **Type-safe messaging**: All IPC messages validated with schemas
- **CSP headers**: Strict Content Security Policy in HTML pages

### Data Validation Constraints

- Rule names: 1-100 characters, no HTML
- URL patterns: 1-2048 characters, valid format
- Schedule times: Valid 24-hour format, end after start
- Timer durations: Within specified ranges
- Nuclear mode: 1-8 hours, 64 hex character signatures

## Permissions

Focus Flow requires the following Chrome permissions:

- **storage**: Save settings, block rules, sessions, and analytics data locally
- **alarms**: Power the Pomodoro timer with 1-second precision
- **notifications**: Desktop notifications for timer completion
- **tabs**: Detect current tab for blocking functionality
- **declarativeNetRequest**: Efficient website blocking using Chrome's modern API
- **declarativeNetRequestFeedback**: Track blocked requests for analytics
- **host_permissions** (`<all_urls>`): Required for website blocking on any domain

## Privacy

Focus Flow respects your privacy:

- **All data stored locally** in your browser (Chrome storage API)
- **No external servers** - no data sent anywhere
- **No tracking or analytics** collection by the extension
- **No third-party services** - completely self-contained
- **Open source** - audit the code yourself
- **Optional cloud sync** - Enable Chrome sync only if you want settings across devices
- **Data export** - Full control over your data with CSV/JSON export
- **90-day cleanup** - Old sessions automatically removed to save space

## Browser Compatibility

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | v88+ | Full support |
| Edge | v88+ | Full support (Chromium-based) |
| Brave | v1.20+ | Full support |
| Opera | v74+ | Should work (Chromium-based) |
| Firefox | - | Not supported (different extension API) |
| Safari | - | Not supported (different extension API) |

## Roadmap

### Planned Features

- [ ] Firefox extension support (Manifest V3)
- [ ] Safari extension support
- [ ] Focus mode playlists (ambient sounds, lo-fi music)
- [ ] Team/shared blocking rules for organizations
- [ ] Mobile companion app (React Native)
- [ ] Advanced analytics (weekly/monthly email reports)
- [ ] Integration with task management tools (Todoist, Notion, etc.)
- [ ] Custom achievement creation
- [ ] Pomodoro templates (different durations for different tasks)
- [ ] Break activity suggestions
- [ ] Focus session sharing (social accountability)
- [ ] API for third-party integrations
- [ ] Keyboard shortcuts for timer control
- [ ] Widget for desktop (Electron wrapper)

### Performance Targets

- Popup open: <100ms
- Timer tick: <10ms
- Block rule sync: <50ms
- Analytics calculation: <100ms
- YouTube controls: <50ms

## Contributing

Contributions are welcome! Please read our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types for new code
   - Use Zod schemas for data validation
4. **Add tests** for new functionality
   - Unit tests in `tests/unit/`
   - E2E tests in `tests/e2e/` for UI features
5. **Ensure all tests pass**
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```
6. **Format your code**
   ```bash
   npm run format
   ```
7. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
8. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
9. **Open a Pull Request**

### Contribution Guidelines

- Write clear, descriptive commit messages
- Keep PRs focused on a single feature/fix
- Update documentation for new features
- Add JSDoc comments for public functions
- Follow security best practices (input validation, etc.)
- Test across different screen sizes for UI changes
- Ensure accessibility compliance (WCAG 2.1 AA)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/RavindraDave/focus-flow-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RavindraDave/focus-flow-extension/discussions)
- **Documentation**: This README and inline code documentation

## Acknowledgments

- Built with [React](https://react.dev/) - A JavaScript library for building user interfaces
- Charts powered by [Chart.js](https://www.chartjs.org/) - Simple yet flexible JavaScript charting
- Icons from [Lucide React](https://lucide.dev/) - Beautiful & consistent icons
- State management by [Zustand](https://github.com/pmndrs/zustand) - Bear necessities for state management
- Validation by [Zod](https://zod.dev/) - TypeScript-first schema validation
- Date utilities from [date-fns](https://date-fns.org/) - Modern JavaScript date utility library
- Inspired by the Pomodoro Technique by Francesco Cirillo

---

**Focus Flow** - Take control of your time, eliminate distractions, and achieve deep focus.

*Made with focus and determination.*
