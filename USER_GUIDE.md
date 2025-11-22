# Focus Flow - Complete User Guide

## Table of Contents
1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [Pomodoro Timer](#pomodoro-timer)
5. [Website Blocking](#website-blocking)
6. [Nuclear Mode](#nuclear-mode)
7. [Analytics & Tracking](#analytics--tracking)
8. [Scheduling](#scheduling)
9. [Settings & Customization](#settings--customization)
10. [Troubleshooting](#troubleshooting)
11. [Privacy & Data](#privacy--data)

---

## Installation

### For Chrome/Edge/Brave

1. **Build the extension** (first time only):
   ```bash
   npm install
   npm run build
   ```

2. **Load the extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

3. **Verify installation**:
   - You should see the Focus Flow icon in your browser toolbar
   - Click it to open the popup
   - The onboarding guide will automatically open in a new tab

### For Firefox

1. Build the extension as above
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in the `dist` folder

---

## Getting Started

### First Launch

When you first install Focus Flow, an **onboarding guide** will automatically open. This guide walks you through:
- How the Pomodoro technique works
- Setting up website blocking
- Understanding Nuclear Mode
- Tracking your progress
- Creating schedules

**Tip**: You can revisit the onboarding guide at any time by opening it from the extension's options page.

### Quick Start (5 minutes)

1. **Start your first Pomodoro session**:
   - Click the Focus Flow icon in your toolbar
   - Click "Start Work Session"
   - Work for 25 minutes without distractions

2. **Add your first blocked website**:
   - Click "Settings & Analytics" in the popup
   - Go to the "Blocking" tab
   - Add "youtube.com" or another distracting site
   - Enable the rule

3. **Complete a full Pomodoro cycle**:
   - Work session (25 min)
   - Short break (5 min)
   - Repeat 3 more times
   - Long break (15 min)

---

## Core Features

### Overview

Focus Flow is designed around three core productivity principles:

1. **Time Boxing**: Use the Pomodoro technique to break work into focused intervals
2. **Distraction Prevention**: Block websites during work sessions
3. **Progress Tracking**: Monitor your productivity and maintain streaks

---

## Pomodoro Timer

### What is the Pomodoro Technique?

The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.

### How to Use the Timer

#### Starting a Session

1. Click the Focus Flow icon
2. Click "Start Work Session"
3. (Optional) Add a task name to track what you're working on
4. Focus on your work until the timer completes

#### Session Types

| Session Type | Default Duration | Purpose |
|-------------|------------------|---------|
| Work Session | 25 minutes | Focused work time |
| Short Break | 5 minutes | Quick rest between work sessions |
| Long Break | 15 minutes | Extended rest after 4 work sessions |

#### Timer Controls

- **Pause**: Temporarily stop the timer (preserves remaining time)
- **Resume**: Continue from where you paused
- **Stop**: End the current session early (marks as incomplete)

### Timer States

- **Active**: Timer is running
- **Paused**: Timer is stopped but can be resumed
- **Completed**: Session finished successfully
- **Stopped**: Session ended early

### Auto-Start Next Session

Enable this in Settings to automatically start the next session when one completes:
- After work session → short break starts automatically
- After short break → work session starts automatically
- After 4th work session → long break starts automatically

---

## Website Blocking

### Overview

Block distracting websites during work sessions to maintain focus. Blocked sites are only inaccessible during active work sessions, not during breaks.

### Adding Block Rules

1. **Open Settings**:
   - Click Focus Flow icon
   - Click "Settings & Analytics"
   - Navigate to "Blocking" tab

2. **Add a Domain**:
   - Enter the domain (e.g., `youtube.com`, `reddit.com`)
   - Choose rule type:
     - **Domain**: Blocks entire domain and all subdomains
     - **URL**: Blocks specific page or path
     - **Keyword**: Blocks pages containing the keyword
   - Add category (optional): Social Media, News, Entertainment, etc.
   - Click "Add Rule"

3. **Enable/Disable Rules**:
   - Toggle the switch next to any rule
   - Disabled rules won't block the site but are saved

### Rule Types Explained

#### Domain Blocking
```
Pattern: youtube.com
Blocks:
  ✓ youtube.com
  ✓ www.youtube.com
  ✓ m.youtube.com
  ✓ youtube.com/watch?v=...
```

#### URL Blocking
```
Pattern: reddit.com/r/videos
Blocks:
  ✓ reddit.com/r/videos
  ✗ reddit.com/r/programming (not blocked)
```

#### Keyword Blocking
```
Pattern: "breaking news"
Blocks any page with "breaking news" in the URL
```

### Managing Rules

- **Edit**: Click the edit icon to modify a rule
- **Delete**: Click the trash icon to remove a rule
- **Bulk Actions**: Use category filters to manage multiple rules

### What Happens When a Site is Blocked?

When you try to visit a blocked website during a work session:
1. The page is immediately redirected to a block page
2. The block page shows:
   - Why the site is blocked
   - How much time remains in your session
   - A motivational message
3. The attempt is logged in your analytics

**Note**: Blocked sites are fully accessible during breaks and when no session is active.

---

## Nuclear Mode

### ⚠️ IMPORTANT WARNING

**Nuclear Mode CANNOT be deactivated once started.** Use this feature only when you need maximum focus and commitment.

### What is Nuclear Mode?

Nuclear Mode is an extreme focus mode that:
- Blocks ALL distracting websites (not just your block list)
- Remains active for 1-8 hours (you choose)
- **Cannot be disabled** until the time expires
- Works independently of Pomodoro sessions

### When to Use Nuclear Mode

Perfect for:
- Final exams/studying
- Important project deadlines
- Deep work sessions
- Breaking social media addiction
- "Last resort" focus needs

### Activating Nuclear Mode

1. Click the Focus Flow icon
2. Click "🚀 Activate Nuclear Mode"
3. **Read the warning carefully**
4. Choose duration (1-8 hours)
5. Confirm activation

### What Gets Blocked?

Nuclear Mode blocks common distracting categories:
- Social media (Facebook, Twitter, Instagram, TikTok, etc.)
- Video platforms (YouTube, Twitch, Netflix, etc.)
- News sites
- Shopping sites
- Gaming sites
- Reddit and forums

### Checking Nuclear Mode Status

- A red banner appears in the popup showing remaining time
- Blocked sites show the Nuclear Mode block page
- The extension icon may change color (browser dependent)

### Deactivating Early (Emergency Only)

The only ways to end Nuclear Mode early are:
1. Uninstall the extension (loses all data)
2. Wait for the timer to expire

This is intentional - Nuclear Mode is designed to be unbreakable.

---

## Analytics & Tracking

### Overview

Focus Flow tracks your productivity privately and locally. All data stays on your device.

### What's Tracked

#### Today's Stats (Popup)
- **Focus Time**: Total minutes in work sessions today
- **Pomodoros Completed**: Number of finished work sessions
- **Current Streak**: Consecutive days with at least one completed session
- **Longest Streak**: Your all-time best streak

#### Detailed Analytics (Settings Page)

Navigate to Settings → Analytics tab to view:

##### Daily Stats
- Sessions completed
- Focus time
- Break time
- Success rate
- Sites blocked

##### Weekly Summary
- Total focus time
- Average daily sessions
- Most productive day
- Blocked site attempts
- Week-over-week trends

##### Monthly Summary
- Total pomodoros
- Focus hours
- Streak maintenance
- Monthly trends

### Focus Score

Your Focus Score (0-100) is calculated based on:
- Session completion rate
- Consistency (streak days)
- Total focus time
- Blocked site resistance

A higher score indicates better focus habits.

### Viewing History

**Session History**:
- See all past sessions
- Filter by date range
- View task names
- Check completion status

**Block Attempts**:
- Sites you tried to visit during work
- Frequency of attempts
- Most blocked domains

### Exporting Data

1. Go to Settings → Data & Privacy
2. Click "Export Analytics"
3. Choose format (JSON or CSV)
4. Data includes:
   - All sessions
   - Analytics summaries
   - Block rules
   - Settings

---

## Scheduling

### Overview

Create schedules to automatically block websites at specific times, regardless of whether a Pomodoro session is active.

### Use Cases

- Block social media during work hours (9 AM - 5 PM)
- Prevent late-night browsing (11 PM - 7 AM)
- Study time blocks (specific days/times)
- Enforce break times

### Creating a Schedule

1. Go to Settings → Scheduling
2. Click "Add Schedule"
3. Configure:
   - **Name**: Identify the schedule (e.g., "Work Hours")
   - **Days**: Select days of the week
   - **Start Time**: When blocking begins
   - **End Time**: When blocking ends
   - **Block List**: Choose which rules to apply
4. Enable the schedule

### Schedule Types

#### Time-Based
```
Monday-Friday: 9:00 AM - 5:00 PM
Blocks: All sites in "Work" category
```

#### Day-Specific
```
Saturday: 8:00 PM - 11:59 PM
Blocks: Entertainment sites
```

#### Recurring Daily
```
Every day: 11:00 PM - 7:00 AM
Blocks: All sites (sleep protection)
```

### Managing Schedules

- **Active/Inactive**: Toggle to enable/disable
- **Edit**: Modify times or block lists
- **Delete**: Remove schedule permanently
- **Next Active**: See when the next schedule will activate

### How Schedules Work

- Schedules run independently of Pomodoro sessions
- Multiple schedules can overlap
- If a Pomodoro session AND schedule are both active, both block lists apply
- Schedules check every minute for activation

---

## Settings & Customization

### Timer Settings

**Session Durations**:
- Work Duration: 1-60 minutes (default: 25)
- Short Break: 1-30 minutes (default: 5)
- Long Break: 1-60 minutes (default: 15)
- Sessions until Long Break: 2-10 (default: 4)

**Behavior**:
- ✓ Auto-start next session
- ✓ Enable notifications
- ✓ Play sound on completion

### Appearance

**Theme**:
- Light mode
- Dark mode
- Auto (follows system)

**Accent Color**: Choose your preferred primary color

### Notifications

Configure what notifications you receive:
- Session complete
- Break complete
- Nuclear Mode active
- Streak milestones
- Daily reminders

### Data & Privacy

**Storage Used**: View how much storage the extension uses

**Clear Data**:
- Clear analytics (keeps settings)
- Clear all data (factory reset)
- Export before clearing (recommended)

**Data Sync**:
- All data is local (not synced to cloud)
- Export/import to transfer between devices

---

## Troubleshooting

### Extension Won't Load

**Symptoms**: Icon doesn't appear, or clicking it does nothing

**Solutions**:
1. Rebuild the extension:
   ```bash
   npm run build
   ```
2. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the refresh icon on Focus Flow
3. Check for errors in the console:
   - Right-click the extension icon
   - Select "Inspect popup"
   - Check Console tab for errors

### Timer Doesn't Start

**Symptoms**: Clicking "Start" does nothing

**Solutions**:
1. Check background service worker:
   - Go to `chrome://extensions/`
   - Click "service worker" under Focus Flow
   - Look for errors
2. Reset extension data:
   - Settings → Data & Privacy → Clear All Data
   - Reload extension

### Websites Not Being Blocked

**Symptoms**: Can still access blocked sites during work sessions

**Solutions**:
1. Verify session is active:
   - Open popup
   - Confirm timer is running
2. Check rule format:
   - Should be domain only: `youtube.com` not `https://youtube.com`
3. Verify rule is enabled:
   - Settings → Blocking
   - Check toggle is ON
4. Clear browser cache
5. Sync rules manually:
   - Settings → Blocking → "Sync Rules" button

### Onboarding Won't Open

**Symptoms**: No onboarding on first install

**Solutions**:
1. Manually open onboarding:
   - Navigate to: `chrome-extension://[EXTENSION_ID]/onboarding.html`
2. Reset first-install flag:
   - Open console in popup (Inspect popup)
   - Run: `chrome.storage.local.remove('onboardingCompleted')`
   - Reload extension

### Analytics Not Updating

**Symptoms**: Stats remain at 0 or don't change

**Solutions**:
1. Complete a full session (don't stop early)
2. Check storage permissions:
   - `chrome://extensions/`
   - Ensure "Storage" permission is granted
3. Check for quota errors:
   - Inspect background service worker
   - Look for "QUOTA_EXCEEDED" errors

### Nuclear Mode Won't Activate

**Symptoms**: Error when trying to activate Nuclear Mode

**Solutions**:
1. Check minimum duration: Must be 1-8 hours
2. Verify no existing Nuclear Mode session
3. Check background service worker for errors

---

## Privacy & Data

### What Data is Collected?

Focus Flow collects and stores **locally** on your device:

**Session Data**:
- Start/end times
- Session type (work/break)
- Task names (if provided)
- Completion status

**Analytics**:
- Daily/weekly/monthly aggregates
- Focus time totals
- Session counts
- Streak information

**Block Attempts**:
- Timestamp
- Domain accessed
- Whether blocked

**Settings**:
- Timer durations
- Enabled features
- Theme preferences

### What is NOT Collected?

- ❌ Browsing history (beyond block attempts)
- ❌ Personal information
- ❌ Account credentials
- ❌ Page content
- ❌ Other extensions' data

### Where is Data Stored?

All data is stored in `chrome.storage.local`:
- Remains on your device
- Never sent to external servers
- Not synced across devices (unless you export/import)
- Cleared when extension is uninstalled

### Data Security

**Encryption**:
- Settings and analytics are validated with Zod schemas
- Protected against injection attacks
- Prototype pollution prevention

**Permissions**:
Focus Flow requests only necessary permissions:
- `storage`: Save settings and analytics
- `alarms`: Timer functionality
- `notifications`: Session alerts
- `tabs`: Manage blocked pages
- `declarativeNetRequest`: Block websites

### Exporting Your Data

Export at any time:
1. Settings → Data & Privacy
2. Click "Export Analytics"
3. Receive JSON file with all your data

### Deleting Your Data

**Partial deletion**:
- Settings → Data & Privacy → Clear Analytics

**Complete deletion**:
- Settings → Data & Privacy → Clear All Data
- OR uninstall the extension

---

## Tips for Maximum Productivity

### Getting Started

1. **Start small**: Use default settings (25/5/15) for the first week
2. **Build the habit**: Do at least 2 pomodoros per day
3. **Track progress**: Check your streak daily
4. **Adjust gradually**: Modify durations after you understand your focus patterns

### Blocking Strategy

**Progressive blocking**:
1. Week 1: Block 2-3 most distracting sites
2. Week 2: Add social media
3. Week 3: Add news/entertainment
4. Week 4: Consider Nuclear Mode for important tasks

### Maintaining Streaks

- Set a daily reminder notification
- Do at least 1 pomodoro per day (even weekends)
- Use Nuclear Mode for "must focus" days
- Review weekly stats to identify patterns

### Advanced Tips

1. **Task Batching**: Group similar tasks in one pomodoro
2. **Time Blocking**: Use schedules for routine focus periods
3. **Break Activities**: Plan what to do during breaks (stretch, water, etc.)
4. **Nuclear Mode Days**: Pick one day per week for maximum focus
5. **Review & Adjust**: Check analytics monthly to optimize durations

---

## Keyboard Shortcuts

Currently, Focus Flow doesn't have default keyboard shortcuts, but you can add them:

1. Go to `chrome://extensions/shortcuts`
2. Find Focus Flow
3. Assign shortcuts for:
   - Open popup
   - Start session
   - Stop session

---

## FAQ

**Q: Can I use Focus Flow on multiple browsers?**
A: Yes, but you'll need to install separately on each browser. Data doesn't sync automatically (use export/import).

**Q: Does Focus Flow work in Incognito mode?**
A: Only if you enable "Allow in Incognito" in chrome://extensions/

**Q: Can I block sites permanently (not just during sessions)?**
A: Yes! Use Schedules with "All Day" (00:00 - 23:59) times.

**Q: What happens if I close my browser during a session?**
A: The session will continue in the background. The timer picks up where it left off when you reopen the browser.

**Q: Can I customize the blocked page?**
A: Not currently, but this is planned for a future version.

**Q: How do I backup my data?**
A: Settings → Data & Privacy → Export Analytics. Save the JSON file somewhere safe.

---

## Support & Contributing

### Getting Help

1. Check this guide first
2. Review [Troubleshooting](#troubleshooting)
3. Open an issue on GitHub: [github.com/RavindraDave/focus-flow-extension/issues](https://github.com/RavindraDave/focus-flow-extension/issues)

### Feature Requests

Have an idea? Open a feature request on GitHub with:
- Clear description of the feature
- Use case / why it's needed
- Any relevant mockups or examples

### Contributing

Contributions welcome! See the project README for development setup.

---

## Version History

### v1.0.0 (Current)
- Initial release
- Pomodoro timer
- Website blocking
- Nuclear Mode
- Analytics & streaks
- Scheduling
- Onboarding guide

---

## Credits

Focus Flow is built with:
- React + TypeScript
- Vite
- Tailwind CSS
- Chart.js
- Zod for validation

---

**Enjoy your focused, productive sessions with Focus Flow!** 🎯
