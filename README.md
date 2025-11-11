# Focus Flow

A powerful Chrome Extension for productivity and focus management with Pomodoro timer, website blocking, and advanced analytics.

## Features

### 🍅 Pomodoro Timer

- **Customizable sessions**: Configure work (default 25 min), short break (5 min), and long break (15 min) durations
- **Auto-start**: Automatically start next session after completion
- **Smart cycles**: Automatic long break after configurable number of work sessions (default: 4)
- **Quick stats**: View current streak, total focus time, and sessions at a glance
- **Notifications**: Desktop notifications and optional sound alerts when sessions complete

### 🚫 Website Blocking

- **Flexible blocking rules**: Block by domain, URL pattern, or keyword
- **Daily allowances**: Set time limits for specific sites (e.g., 30 min/day for social media)
- **Smart patterns**: Support for wildcards and multiple matching strategies
  - Domain: `youtube.com` blocks entire domain
  - Keyword: Blocks any URL containing the keyword
  - URL: Exact URL pattern matching with wildcards
- **Time tracking**: Monitor time spent on blocked sites
- **Enhanced blocked page**: Shows remaining time, streak info, and motivational content

### 📅 Scheduling

- **Automatic blocking**: Schedule rules to activate at specific times
- **Weekly patterns**: Set different schedules for different days
- **Timezone support**: Respects your local timezone
- **Exceptions**: Skip specific dates when needed
- **Multiple schedules**: Create unlimited schedules for different contexts (work hours, study time, etc.)

### 💪 Nuclear Mode

- **Commitment mechanism**: Lock yourself into focus mode for a set duration
- **Tamper-proof**: Uses cryptographic signatures to prevent easy disabling
- **Challenge system**: Solve challenges to cancel (with increasing difficulty)
- **Failed attempts tracking**: Monitors attempts to break out of nuclear mode
- **Visual feedback**: Clear indicators when nuclear mode is active

### 📊 Analytics Dashboard

- **Visual charts**: Interactive charts powered by Chart.js
  - Focus time trends over last 30 days
  - Session completion rates
  - Category breakdown
  - Productivity by hour of day
- **Key metrics**:
  - Total focus time
  - Completed vs abandoned sessions
  - Most productive hours
  - Session distribution by category
- **Historical data**: Track up to 90 days of history

### 🏆 Streak & Achievements

- **Daily streaks**: Track consecutive days with completed sessions
- **Streak protection**: Premium feature - freeze streak for missed days
- **Achievements system**: Unlock badges for milestones
  - First session completed
  - 7-day streak
  - 100+ total focus hours
  - Consistency awards
  - Special achievements
- **Motivation**: Visual progress indicators keep you motivated

### 📥 Data Export

- **Export formats**: CSV and JSON
- **Comprehensive data**: Export all sessions, analytics, and statistics
- **Data portability**: Take your data with you
- **Backup**: Create backups of your productivity history

### 🎬 YouTube Controls

- **Distraction reduction**: Hide YouTube distractions
  - Hide Shorts
  - Hide recommended videos sidebar
  - Hide comments section
  - Hide home feed/trending
- **Selective control**: Enable only the controls you need
- **Seamless integration**: Works automatically on YouTube

### 🎨 Customization

- **Theme support**: Light, dark, or system-synchronized themes
- **Custom categories**: Tag sessions with custom categories for better analytics
- **Flexible settings**: Customize all timer durations and behaviors
- **Task naming**: Add optional task names/descriptions to sessions

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
3. **Configure settings** by clicking "Settings" or right-click icon → Options

### Setting Up Website Blocking

1. Open **Options** (right-click extension icon → Options)
2. Navigate to **"Block Rules"** tab
3. Click **"Add Rule"**
4. Configure your rule:
   - **Name**: Descriptive name (e.g., "Social Media Block")
   - **Pattern**: URL/domain to block (e.g., `facebook.com`)
   - **Type**: Choose domain, keyword, or URL
   - **Allowance**: Optional daily time limit (leave empty for full block)
5. Click **"Save"**

### Creating Schedules

1. Open **Options** → **"Schedules"** tab
2. Click **"Add Schedule"**
3. Configure:
   - **Name**: Schedule name (e.g., "Work Hours")
   - **Days**: Select which days it applies
   - **Time range**: Set start and end times
   - **Block rules**: Select which rules to activate
4. Click **"Save"**

### Using Nuclear Mode

1. Click the **Nuclear Mode** button in the popup
2. Set your commitment duration (15 min to 8 hours)
3. **Confirm** - once activated, it cannot be easily disabled
4. To cancel early, you'll need to solve challenges (attempts are limited)

### Viewing Analytics

1. Open **Options** → **"Analytics"** tab
2. View your productivity trends:
   - Daily focus time chart
   - Session completion rates
   - Category breakdown
   - Hourly productivity patterns
3. **Export data** using the "Export" button (CSV or JSON format)

### Customizing Timer Settings

1. Open **Options** → **"Settings"** tab
2. Adjust timer durations:
   - Work session duration (default: 25 min)
   - Short break duration (default: 5 min)
   - Long break duration (default: 15 min)
   - Sessions until long break (default: 4)
3. Toggle features:
   - Auto-start next session
   - Sound notifications
   - Desktop notifications
4. Configure YouTube controls (if needed)

## Development

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Chart.js with react-chartjs-2
- **Validation**: Zod
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright

### Project Structure

```
focus-flow-extension/
├── src/
│   ├── background/          # Background service worker
│   │   ├── timer-engine.ts      # Pomodoro timer logic
│   │   ├── blocker-engine.ts    # Website blocking engine
│   │   ├── nuclear-mode-manager.ts  # Nuclear mode implementation
│   │   ├── analytics-tracker.ts # Analytics tracking
│   │   └── schedule-manager.ts  # Schedule automation
│   ├── popup/               # Extension popup UI
│   │   ├── components/
│   │   └── App.tsx
│   ├── options/             # Settings/options page
│   │   ├── components/
│   │   └── App.tsx
│   ├── blocked/             # Blocked page UI
│   ├── content/             # Content scripts (YouTube)
│   ├── features/            # Feature modules
│   │   ├── blocking/
│   │   └── analytics/
│   ├── services/            # Data services & repositories
│   ├── hooks/               # React hooks
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── public/                  # Static assets
│   └── manifest.json        # Chrome extension manifest
└── tests/                   # Test files
    ├── unit/
    └── e2e/
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run type-check      # Run TypeScript type checking
npm run lint            # Lint code (ESLint)
npm run lint:fix        # Auto-fix lint issues
npm run format          # Format code (Prettier)
npm run format:check    # Check code formatting

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Generate coverage report
npm run e2e             # Run E2E tests
npm run e2e:ui          # Run E2E tests with UI

# Distribution
npm run zip             # Create distribution zip file
```

### Building for Production

```bash
# Build the extension
npm run build

# Create distribution package
npm run zip
```

The built extension will be in the `dist/` folder, and the zip file in `dist/focus-flow-extension.zip`.

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

- **TypeScript strict mode** enabled
- **ESLint** with React and TypeScript rules
- **Prettier** for consistent formatting
- **Comprehensive test coverage** (unit + E2E)
- **Type-safe** data validation with Zod
- **Accessibility** considerations in all UI components

## Permissions

Focus Flow requires the following Chrome permissions:

- **storage**: Save settings, block rules, and analytics data
- **alarms**: Power the Pomodoro timer
- **notifications**: Desktop notifications for timer completion
- **tabs**: Detect and block websites according to your rules
- **declarativeNetRequest**: Block websites efficiently
- **host_permissions** (`<all_urls>`): Required for website blocking functionality

## Privacy

Focus Flow respects your privacy:

- **All data stored locally** in your browser (Chrome storage API)
- **No external servers** - no data sent anywhere
- **No tracking or analytics** collection
- **Open source** - verify the code yourself
- **Optional sync** - Enable Chrome sync if you want settings across devices

## Browser Compatibility

- **Chrome**: v88+ (full support)
- **Edge**: v88+ (Chromium-based, full support)
- **Brave**: v1.20+ (full support)
- **Opera**: v74+ (Chromium-based, should work)

## Roadmap

- [ ] Firefox extension support
- [ ] Safari extension support
- [ ] Focus mode playlists (ambient sounds)
- [ ] Team/shared blocking rules
- [ ] Mobile companion app
- [ ] Advanced analytics (weekly/monthly reports)
- [ ] Integration with task management tools
- [ ] Custom achievement creation

## Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test`)
6. Run linting (`npm run lint:fix`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/RavindraDave/focus-flow-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RavindraDave/focus-flow-extension/discussions)

## Acknowledgments

- Built with [React](https://react.dev/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons from [Lucide React](https://lucide.dev/)
- Inspired by the Pomodoro Technique® by Francesco Cirillo

---

**Focus Flow** - Take control of your time, eliminate distractions, and achieve deep focus.
