# Product Requirements Document (PRD)
## Focus Mode & Pomodoro Timer Pro - Chrome Extension

**Version:** 1.0  
**Last Updated:** November 8, 2025  
**Product Owner:** TBD  
**Technical Lead:** TBD

---

## Executive Summary

### Product Vision
Build a privacy-first, local-first Chrome extension that combines intelligent website blocking, Pomodoro time management, and productivity analytics to help users maintain deep focus and build sustainable work habits.

### Market Opportunity
- **StayFocusd**: 8.4K ratings (4.5/5) - completely free (monetization gap)
- **Freedom**: 4.6/5 rating with successful paid subscription model
- **Market Demand**: 64% of employees work outside scheduled hours, requiring focus tools
- **Revenue Target**: $19,950/month from 5,000 premium users (2.5% conversion from 200K base)
- **Profit Margin**: 97% (low-cost, local-first architecture)

### Key Differentiators
1. **Hybrid Architecture**: Local-first with optional AI-powered insights
2. **Pomodoro Integration**: Built-in timer with context-aware task tracking
3. **Advanced Analytics**: Productivity insights without compromising privacy
4. **Gamification**: Streak tracking and achievement system
5. **YouTube Controls**: Shorts/recommendations/comments blocking
6. **Unbreakable Focus**: Nuclear option with challenge gates

---

## Product Goals & Success Metrics

### Primary Goals
1. Help users achieve 3+ hours of deep focus daily
2. Reduce context switching by 60%
3. Build sustainable focus habits (21+ day streaks)
4. Provide actionable productivity insights

### Success Metrics (KPIs)

#### User Engagement
- **Daily Active Users (DAU)**: Target 60% of installed base
- **Session Duration**: Average 4+ Pomodoro cycles per day
- **Streak Retention**: 40% of users maintain 7+ day streaks
- **Feature Adoption**: 70% use blocking + timer together

#### Business Metrics
- **Conversion Rate**: 2.5% free-to-premium
- **Monthly Recurring Revenue (MRR)**: $19,950 at 5,000 premium users
- **Churn Rate**: <5% monthly
- **Customer Acquisition Cost (CAC)**: <$10 via organic Chrome Web Store
- **Lifetime Value (LTV)**: $95.76 (24 months average subscription)

#### Technical Metrics
- **Extension Load Time**: <500ms
- **Memory Footprint**: <50MB
- **CPU Usage**: <2% during active blocking
- **Error Rate**: <0.1% of sessions
- **Code Coverage**: ≥80% for new code
- **Code Duplication**: ≤3% for new code
- **Cyclomatic Complexity**: ≤10 per function

---

## Target Audience

### Primary Personas

#### 1. The Knowledge Worker (60% of users)
- **Age**: 25-40
- **Occupation**: Software engineers, writers, designers, analysts
- **Pain Points**: 
  - Constant notifications and social media distractions
  - Difficulty entering deep work state
  - Works irregular hours, needs flexible scheduling
- **Goals**: 
  - Complete complex tasks requiring sustained focus
  - Track productivity patterns
  - Build consistent work habits

#### 2. The Student (25% of users)
- **Age**: 18-28
- **Occupation**: University/graduate students
- **Pain Points**:
  - YouTube and social media procrastination
  - Last-minute cramming habits
  - Lack of structured study time
- **Goals**:
  - Establish regular study routines
  - Avoid distractions during exam periods
  - Track study hours for accountability

#### 3. The Freelancer/Entrepreneur (15% of users)
- **Age**: 28-45
- **Occupation**: Self-employed, startup founders
- **Pain Points**:
  - No external accountability structures
  - Work-life boundary blur
  - Multiple client/project context switching
- **Goals**:
  - Maximize billable hours
  - Maintain consistent productivity
  - Prevent burnout with structured breaks

---

## Core Features & Requirements

### 1. Website Blocking System

#### 1.1 Block List Management
**Priority**: P0 (MVP Critical)

**User Stories**:
- As a user, I want to block specific websites by domain so that I cannot access them during focus time
- As a user, I want to block websites by keyword (e.g., "shop", "game") so I can block categories
- As a user, I want to create multiple block lists (work, study, nuclear) so I can apply different rules in different contexts

**Functional Requirements**:
- **FR-BL-001**: Support adding websites via:
  - Full URL (https://www.youtube.com/shorts)
  - Domain (youtube.com, *.youtube.com)
  - Keyword matching (any URL containing "shop")
- **FR-BL-002**: Support wildcard patterns (*.reddit.com blocks all Reddit subdomains)
- **FR-BL-003**: Allow quick-add from current tab via context menu
- **FR-BL-004**: Provide import/export functionality (JSON format)
- **FR-BL-005**: Free tier: maximum 5 blocked sites
- **FR-BL-006**: Premium tier: unlimited blocked sites

**Technical Requirements**:
- **TR-BL-001**: Use `chrome.declarativeNetRequest` API (Manifest V3 compliant)
- **TR-BL-002**: Store block lists in `chrome.storage.local` (unlimited storage)
- **TR-BL-003**: Update blocking rules within 100ms of user change
- **TR-BL-004**: Support up to 5,000 dynamic rules (Chrome limit: 5,000)

**Security Requirements** (OWASP ASVS Level 2):
- **SR-BL-001**: Validate all URL inputs against SSRF attacks (V5.2.6)
- **SR-BL-002**: Sanitize all user-provided patterns before regex compilation (V5.3.3)
- **SR-BL-003**: Rate-limit block list updates to prevent storage exhaustion (V11.1.3)

**Acceptance Criteria**:
```gherkin
Given I am on the settings page
When I add "youtube.com" to my block list
And I activate focus mode
Then I should be redirected when trying to access youtube.com
And I should see a focus reminder page with my current streak
```

#### 1.2 Scheduled Blocking
**Priority**: P0 (MVP Critical)

**User Stories**:
- As a user, I want to schedule blocking for specific hours (e.g., 9 AM - 5 PM weekdays) so blocking is automatic
- As a user, I want different schedules for weekdays/weekends so I have flexibility
- As a user, I want to see upcoming scheduled blocks so I can plan my day

**Functional Requirements**:
- **FR-SB-001**: Create recurring schedules (daily, weekdays, weekends, custom)
- **FR-SB-002**: Set start/end times with timezone awareness
- **FR-SB-003**: Allow schedule exceptions (skip specific dates)
- **FR-SB-004**: Show countdown to next scheduled block in popup
- **FR-SB-005**: Premium feature: unlimited schedules (free tier: 1 schedule)

**Technical Requirements**:
- **TR-SB-001**: Use `chrome.alarms` API for schedule triggers
- **TR-SB-002**: Store schedules in `chrome.storage.local` with cron-like syntax
- **TR-SB-003**: Background service worker checks schedule every 60 seconds
- **TR-SB-004**: Support timezone detection via `Intl.DateTimeFormat().resolvedOptions().timeZone`

**Acceptance Criteria**:
```gherkin
Given I have set a schedule for 9 AM - 5 PM weekdays
When the clock reaches 9:00 AM on Monday
Then blocking should automatically activate
And I should receive a browser notification
And the popup should show "Focus Mode Active Until 5:00 PM"
```

#### 1.3 Nuclear Option (Unbreakable Block)
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to activate an unbreakable block for X hours so I cannot disable it even if I want to
- As a user, I want to complete a challenge (typing paragraph, math problems) to activate nuclear mode so I make a conscious commitment

**Functional Requirements**:
- **FR-NO-001**: Set nuclear block duration (1-8 hours)
- **FR-NO-002**: Require challenge completion to activate:
  - Type a 100-word commitment paragraph (no copy-paste)
  - Solve 5 math problems correctly
  - Wait 30-second "cooling off" period
- **FR-NO-003**: Display remaining time prominently in all UI
- **FR-NO-004**: Block settings access during nuclear mode
- **FR-NO-005**: Allow emergency override only via uninstalling extension

**Technical Requirements**:
- **TR-NO-001**: Store nuclear mode state in `chrome.storage.local` with encrypted timestamp
- **TR-NO-002**: Disable all settings UI during nuclear mode (DOM manipulation prevention)
- **TR-NO-003**: Verify challenge completion server-side (prevent client-side bypass)
- **TR-NO-004**: Log nuclear mode activations for analytics

**Security Requirements**:
- **SR-NO-001**: Use HMAC-SHA256 to sign nuclear mode activation timestamp (prevent tampering) (V6.2.1)
- **SR-NO-002**: Detect and prevent system time manipulation (V8.2.3)
- **SR-NO-003**: Implement challenge rate-limiting (max 3 attempts per hour) (V2.2.1)

**Acceptance Criteria**:
```gherkin
Given I want to activate nuclear mode for 4 hours
When I click "Nuclear Mode"
Then I must type a 100-word paragraph without copy-paste
And I must solve 5 math problems correctly
And I must wait 30 seconds
When all challenges are completed
Then nuclear mode activates and settings become locked
And I cannot modify block lists or disable blocking for 4 hours
```

#### 1.4 Daily Time Allowances
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to set a daily time limit for specific sites (e.g., 30 min Reddit) so I can use them moderately
- As a user, I want to see remaining time before accessing a site so I can make informed choices

**Functional Requirements**:
- **FR-TA-001**: Set per-site daily allowances (5-120 minutes)
- **FR-TA-002**: Display remaining time in redirect page
- **FR-TA-003**: Reset allowances at midnight (user's local timezone)
- **FR-TA-004**: Show warnings at 5 min, 1 min remaining
- **FR-TA-005**: Hard block when allowance exhausted

**Technical Requirements**:
- **TR-TA-001**: Track time using `chrome.tabs.onUpdated` and `chrome.tabs.onActivated`
- **TR-TA-002**: Store daily usage in `chrome.storage.local` with date key
- **TR-TA-003**: Use `setInterval` for active tab time tracking (1-second granularity)
- **TR-TA-004**: Clean up old usage data (>30 days) weekly

**Acceptance Criteria**:
```gherkin
Given I set a 30-minute daily allowance for reddit.com
When I visit reddit.com
Then I should see "29:45 remaining today" in the popup
When my allowance reaches 0
Then I should be redirected to a blocked page
And reddit.com should be inaccessible until midnight
```

### 2. Pomodoro Timer System

#### 2.1 Core Timer Functionality
**Priority**: P0 (MVP Critical)

**User Stories**:
- As a user, I want to start a 25-minute focus session with automatic breaks so I maintain sustainable productivity
- As a user, I want to customize work/break durations so I can adapt to my focus capacity
- As a user, I want audio/visual notifications when sessions end so I don't have to watch the timer

**Functional Requirements**:
- **FR-PT-001**: Default timer settings:
  - Work session: 25 minutes
  - Short break: 5 minutes
  - Long break: 15 minutes (after 4 work sessions)
- **FR-PT-002**: Customizable durations (work: 15-60 min, short break: 3-15 min, long break: 15-30 min)
- **FR-PT-003**: Display timer in:
  - Browser extension popup
  - Badge counter (minutes remaining)
  - Optional desktop notification
- **FR-PT-004**: Notification types:
  - Browser notification with sound
  - Badge color change (red = work, green = break)
  - Optional tab title update
- **FR-PT-005**: Timer controls: Start, Pause, Skip, Reset
- **FR-PT-006**: Auto-start next session option (work → break → work)

**Technical Requirements**:
- **TR-PT-001**: Use `chrome.alarms` API for precise timing (not `setTimeout` - survives suspension)
- **TR-PT-002**: Store timer state in `chrome.storage.local` (survives browser restart)
- **TR-PT-003**: Use `chrome.action.setBadgeText` for live countdown
- **TR-PT-004**: Audio notifications using Web Audio API (no external files)
- **TR-PT-005**: Timer accuracy: ±1 second over 25 minutes

**UI/UX Requirements**:
- **UX-PT-001**: Large, readable timer display (min 32px font)
- **UX-PT-002**: Color-coded states (red for work, green for break, gray for paused)
- **UX-PT-003**: Single-click start/pause (no confirmation dialogs)
- **UX-PT-004**: Progress ring animation showing time remaining
- **UX-PT-005**: Accessibility: ARIA labels, keyboard shortcuts (Space = start/pause)

**Acceptance Criteria**:
```gherkin
Given the timer is not running
When I click "Start Pomodoro"
Then the timer should start counting down from 25:00
And the badge should show "25" in red
And I should see a progress ring animation
When the timer reaches 0:00
Then I should receive a browser notification
And the timer should auto-switch to 5-minute break
And the badge should show "5" in green
```

#### 2.2 Task Context Tracking
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to label each Pomodoro session with a task so I can track what I worked on
- As a user, I want to see task-based productivity analytics so I know where my time goes
- As a user, I want AI-powered task categorization (optional) so I get automatic insights

**Functional Requirements**:
- **FR-TC-001**: Before starting a Pomodoro, optionally enter task name (max 100 chars)
- **FR-TC-002**: Auto-detect task from:
  - Active tab title
  - Active window title
  - Previous session task (suggest continuation)
- **FR-TC-003**: Task categorization:
  - **Option A (Free)**: Manual categories (Work, Study, Personal, Other)
  - **Option B (Premium)**: AI-powered auto-categorization using local ML (TensorFlow.js)
  - **Option C (Premium+)**: AI-powered insights via OpenAI GPT-4o Mini API
- **FR-TC-004**: Track per-task metrics:
  - Total Pomodoros completed
  - Total focus time
  - Success rate (completed vs abandoned)
  - Most productive time of day

**Technical Requirements**:
- **TR-TC-001**: Store task history in `chrome.storage.local` (max 1,000 recent tasks)
- **TR-TC-002**: Option B: Use TensorFlow.js text classification model (<5MB)
  - Pre-trained model: Universal Sentence Encoder
  - Categories: Development, Writing, Communication, Learning, Creative, Administrative
  - Inference time: <200ms
- **TR-TC-003**: Option C: OpenAI API integration
  - Model: gpt-4o-mini (cheap, fast)
  - Max tokens: 100 per request
  - Rate limit: 60 requests/hour per user
  - Cost: ~$3/month for 500K tokens
- **TR-TC-004**: Use `chrome.tabs.query` and `chrome.windows.getAll` for context detection

**Privacy Requirements**:
- **PR-TC-001**: All task data stored locally (never sent to servers unless AI option enabled)
- **PR-TC-002**: AI requests include only task text, no URLs or personal data
- **PR-TC-003**: User consent required before enabling AI features
- **PR-TC-004**: Option to exclude specific apps/sites from context detection

**Acceptance Criteria**:
```gherkin
Given I start a new Pomodoro session
When I am on a tab titled "React Component Design - Figma"
Then the extension should suggest "React Component Design" as the task
And I can edit or accept the suggestion
When I complete the session
Then the task should be logged with timestamp and duration
And analytics should update task-specific metrics
```

#### 2.3 Break Enforcement & Reminders
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want gentle reminders to take breaks so I avoid burnout
- As a user, I want blocked websites to auto-unblock during breaks so I can relax guilt-free
- As a user, I want skip-break option for urgent work so I have flexibility

**Functional Requirements**:
- **FR-BE-001**: During breaks:
  - Temporarily unblock all websites
  - Show "Break Active" overlay in popup
  - Optional: Open break suggestion (stretch video, meditation, walk timer)
- **FR-BE-002**: Break reminders:
  - 3-minute warning: "Break in 3 minutes"
  - End-of-break: "Break ending in 30 seconds"
  - Overdue break: "You've worked 75 minutes without a break"
- **FR-BE-003**: Skip break option with confirmation:
  - "Are you sure? Breaks improve focus and health."
  - Show streak risk: "Skipping breaks reduces streak score"
- **FR-BE-004**: Break tracking:
  - Breaks taken vs skipped ratio
  - Average break duration
  - Longest work streak without break

**Technical Requirements**:
- **TR-BE-001**: Use `chrome.declarativeNetRequest` to dynamically enable/disable rules
- **TR-BE-002**: Schedule reminders using `chrome.alarms` API
- **TR-BE-003**: Track break compliance in daily analytics

**Acceptance Criteria**:
```gherkin
Given I complete a 25-minute work session
When the break starts
Then all blocked websites should become accessible
And I should see "5-minute break - Relax!" notification
And the popup should suggest break activities
When the break ends
Then blocked websites should re-activate
And I should receive "Break over - Ready to focus?" notification
```

### 3. Productivity Analytics Dashboard

#### 3.1 Daily/Weekly/Monthly Views
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to see daily focus time so I can track progress
- As a user, I want weekly trends to identify productive days
- As a user, I want to compare this week vs last week to measure improvement

**Functional Requirements**:
- **FR-AN-001**: Dashboard sections:
  - **Today**: Total focus time, Pomodoros completed, current streak, top blocked sites
  - **This Week**: Daily breakdown chart, total hours, most productive day, focus score (0-100)
  - **This Month**: Calendar heatmap, total Pomodoros, longest streak, top tasks
- **FR-AN-002**: Visualizations:
  - Bar chart: Focus hours per day (last 7/30 days)
  - Line chart: Daily Pomodoro count trend
  - Pie chart: Time distribution by task category
  - Heatmap: Productivity by hour of day (discover peak focus times)
- **FR-AN-003**: Key metrics:
  - **Focus Score**: (Pomodoros completed / Pomodoros started) × 100
  - **Consistency Score**: Streak length × average daily Pomodoros
  - **Block Effectiveness**: (Blocked site access attempts / total site visits) × 100
- **FR-AN-004**: Export data:
  - CSV export (all sessions with timestamps, task, duration)
  - JSON export (for third-party analytics tools)

**Technical Requirements**:
- **TR-AN-001**: Use Chart.js for all visualizations (lightweight, accessible)
- **TR-AN-002**: Store analytics in `chrome.storage.local` with daily/weekly/monthly aggregates
- **TR-AN-003**: Data retention: 90 days detailed, 1 year aggregated
- **TR-AN-004**: Dashboard load time: <1 second for 90 days of data
- **TR-AN-005**: Use Web Workers for heavy calculations (prevent UI freeze)

**UI/UX Requirements**:
- **UX-AN-001**: Dashboard accessible via dedicated tab in popup
- **UX-AN-002**: Responsive design (works in popup and full-page view)
- **UX-AN-003**: Color-blind friendly palette (use patterns + colors)
- **UX-AN-004**: Loading skeletons for async data fetching
- **UX-AN-005**: Empty states with actionable guidance ("Complete your first Pomodoro to see stats!")

**Acceptance Criteria**:
```gherkin
Given I have completed 15 Pomodoros this week
When I open the analytics dashboard
Then I should see a bar chart showing focus hours per day
And I should see my focus score (e.g., "87% - Great job!")
And I should see my current 5-day streak
When I click "Export Data"
Then I should download a CSV with all session details
```

#### 3.2 Insights & Recommendations (Premium)
**Priority**: P2 (Nice to Have)

**User Stories**:
- As a premium user, I want AI-powered insights so I optimize my focus habits
- As a premium user, I want personalized recommendations so I improve productivity

**Functional Requirements**:
- **FR-IN-001**: Weekly insights (generated every Monday):
  - "You're most productive between 9-11 AM. Schedule deep work then."
  - "Your focus score dropped 15% this week. Try shorter Pomodoros (20 min)."
  - "You skip breaks 60% of the time. This may harm long-term productivity."
- **FR-IN-002**: Anomaly detection:
  - Unusual productivity drops (alert: "Focus time down 40% vs last week")
  - Streak breaks (encourage: "You broke your 14-day streak. Start fresh today!")
- **FR-IN-003**: Personalized recommendations:
  - Optimal Pomodoro duration (based on completion rate)
  - Best time to schedule nuclear mode (based on distraction patterns)
  - Task categories needing more time

**Technical Requirements**:
- **TR-IN-001**: Option A (Local ML): TensorFlow.js anomaly detection model
- **TR-IN-002**: Option B (Cloud AI): OpenAI GPT-4o Mini for natural language insights
  - Input: Weekly summary stats (JSON, ~500 tokens)
  - Output: 3-5 actionable insights (~200 tokens)
  - Cost: ~$0.003 per user per week
- **TR-IN-003**: Cache insights for 7 days (avoid redundant API calls)

**Acceptance Criteria**:
```gherkin
Given I am a premium user with 4+ weeks of data
When I open the insights tab on Monday
Then I should see 3-5 personalized insights
And each insight should include a specific action
And I can mark insights as "Helpful" or "Not helpful" (feedback loop)
```

### 4. Gamification & Motivation

#### 4.1 Streak Tracking
**Priority**: P0 (MVP Critical)

**User Stories**:
- As a user, I want to maintain a daily focus streak so I build consistent habits
- As a user, I want streak freeze power-ups so I don't lose progress on sick days

**Functional Requirements**:
- **FR-ST-001**: Track consecutive days with at least 1 completed Pomodoro
- **FR-ST-002**: Display current streak prominently in popup
- **FR-ST-003**: Show personal best streak
- **FR-ST-004**: Streak freeze (premium):
  - Earn 1 freeze per 7-day streak
  - Use freeze to skip a day without breaking streak
  - Max 3 freezes stored
- **FR-ST-005**: Streak milestones:
  - 3 days: "Building momentum!"
  - 7 days: "One week strong!" 🏆
  - 30 days: "Focus Master!" 🔥
  - 100 days: "Century Club!" 💯

**Technical Requirements**:
- **TR-ST-001**: Store streak data in `chrome.storage.local` with daily check-in timestamp
- **TR-ST-002**: Check streak at midnight using `chrome.alarms` API
- **TR-ST-003**: Reset streak if no Pomodoros completed in 24 hours (excluding freezes)

**Acceptance Criteria**:
```gherkin
Given I have a 5-day streak
When I complete at least 1 Pomodoro today
Then my streak should increment to 6 days
And I should see "🔥 6 Day Streak!" in the popup
When I miss a day without using a freeze
Then my streak should reset to 0
And I should see "Streak broken. Start fresh today!"
```

#### 4.2 Achievements & Badges
**Priority**: P2 (Nice to Have)

**User Stories**:
- As a user, I want to unlock achievements so I feel rewarded for milestones
- As a user, I want to share achievements on social media so I celebrate progress

**Functional Requirements**:
- **FR-AC-001**: Achievement categories:
  - **Consistency**: "Early Bird" (5 AM start), "Night Owl" (11 PM start), "Weekday Warrior" (5 days straight)
  - **Volume**: "Century" (100 Pomodoros), "Marathon" (8 hours in one day)
  - **Discipline**: "Unbreakable" (Complete nuclear mode), "Break Master" (0 skipped breaks for 7 days)
  - **Variety**: "Multitasker" (5+ different task categories in a week)
- **FR-AC-002**: Badge display in profile page
- **FR-AC-003**: Share to Twitter/LinkedIn with custom graphic

**UI/UX Requirements**:
- **UX-AC-001**: Achievement unlock animation (confetti + sound)
- **UX-AC-002**: Badge icons designed with Heroicons or Lucide
- **UX-AC-003**: Achievement progress bars (e.g., "73/100 Pomodoros to Century")

**Acceptance Criteria**:
```gherkin
Given I complete my 100th Pomodoro
When the session ends
Then I should see a "🏆 Century Club!" achievement unlock animation
And the badge should appear in my profile
And I should have a "Share" button to post to social media
```

### 5. YouTube-Specific Controls (Premium)

#### 5.1 Shorts & Recommendations Blocking
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to block YouTube Shorts so I avoid the infinite scroll trap
- As a user, I want to hide recommendations so I only watch intended videos
- As a user, I want to hide comments so I don't get pulled into arguments

**Functional Requirements**:
- **FR-YT-001**: Blocking options:
  - Hide YouTube Shorts (homepage + shelf)
  - Hide recommended videos sidebar
  - Hide homepage recommendations (show only subscriptions)
  - Hide comments section
  - Hide video end screen suggestions
- **FR-YT-002**: Allow whitelist for specific channels (never block their content)
- **FR-YT-003**: Schedule-based YouTube blocking (e.g., block during work hours, allow evenings)

**Technical Requirements**:
- **TR-YT-001**: Use content script with MutationObserver to detect and hide elements
- **TR-YT-002**: CSS injection for hiding (`.ytd-shorts`, `.ytp-suggested-action`, etc.)
- **TR-YT-003**: Store YouTube settings in `chrome.storage.sync` (cross-device sync)
- **TR-YT-004**: Performance: Script execution <50ms on page load

**Security Requirements**:
- **SR-YT-001**: Use CSP to prevent inline script injection (V14.2.1)
- **SR-YT-002**: Validate all DOM queries to prevent XSS (V14.3.1)

**Acceptance Criteria**:
```gherkin
Given I enable "Hide YouTube Shorts"
When I visit youtube.com
Then the Shorts shelf should not be visible
And the #shorts tab should be hidden
When I visit a video page
Then recommended videos should not appear in the sidebar
And comments should be hidden
```

### 6. Settings & Configuration

#### 6.1 Challenge Gates (Prevent Impulsive Changes)
**Priority**: P1 (High Priority)

**User Stories**:
- As a user, I want to require a challenge to modify settings so I don't disable blocking impulsively
- As a user, I want different challenge difficulties so I match my self-control needs

**Functional Requirements**:
- **FR-CG-001**: Challenge types:
  - **Level 1 (Default)**: Type a 50-word commitment statement
  - **Level 2**: Solve 3 math problems (addition, subtraction, multiplication)
  - **Level 3**: Wait 60 seconds + type commitment + solve math
- **FR-CG-002**: Require challenge for:
  - Modifying block lists during active session
  - Disabling nuclear mode (impossible)
  - Changing Pomodoro settings mid-session
- **FR-CG-003**: Allow immediate changes outside focus sessions

**Technical Requirements**:
- **TR-CG-001**: Generate random math problems (avoid caching answers)
- **TR-CG-002**: Disable paste events in text input (prevent copy-paste cheating)
- **TR-CG-003**: Validate word count client-side (real-time feedback)

**Acceptance Criteria**:
```gherkin
Given I have Level 2 challenge enabled
When I try to remove youtube.com from my block list during a Pomodoro
Then I must solve 3 math problems correctly
And I cannot skip the challenge
When all problems are solved
Then the settings change is allowed
```

### 7. Data Privacy & Security

#### 7.1 Local-First Architecture
**Priority**: P0 (MVP Critical)

**Privacy Requirements**:
- **PR-PR-001**: All user data stored in `chrome.storage.local` (never cloud by default)
- **PR-PR-002**: No analytics tracking (no Google Analytics, no third-party cookies)
- **PR-PR-003**: Optional cloud sync uses end-to-end encryption (AES-256-GCM)
- **PR-PR-004**: AI features opt-in only (explicit user consent)
- **PR-PR-005**: No website URL logging (only domain-level for block lists)

**Security Requirements** (OWASP ASVS Level 2):
- **SR-PR-001**: All storage operations use transaction locks (prevent race conditions) (V8.3.4)
- **SR-PR-002**: Sensitive data (nuclear mode timestamps) use HMAC-SHA256 integrity checks (V6.2.1)
- **SR-PR-003**: Input validation on all user settings (max lengths, allowed characters) (V5.1.1)
- **SR-PR-004**: CSP headers for all extension pages (prevent XSS) (V14.4.3)
- **SR-PR-005**: Regular security audits of dependencies (npm audit) (V14.2.1)

**Compliance Requirements**:
- **CR-PR-001**: GDPR-compliant privacy policy (EU users)
- **CR-PR-002**: CCPA-compliant data deletion (California users)
- **CR-PR-003**: Data export in standard format (JSON)

#### 7.2 Data Retention & Deletion
**Priority**: P1 (High Priority)

**Functional Requirements**:
- **FR-DR-001**: Automatic data cleanup:
  - Detailed session logs: 90 days
  - Aggregated analytics: 1 year
  - Block list history: Forever (or until user deletes)
- **FR-DR-002**: Manual data deletion:
  - Clear all analytics data
  - Clear specific date ranges
  - Factory reset (delete everything)
- **FR-DR-003**: Export before delete (offer backup)

**Acceptance Criteria**:
```gherkin
Given I want to delete all my data
When I click "Delete All Data" in settings
Then I should see a confirmation dialog
And I should be offered to export data first
When I confirm deletion
Then all chrome.storage.local data should be cleared
And I should see "All data deleted. Extension reset to defaults."
```

---

## Technical Architecture

### Technology Stack

#### Core Technologies
- **Language**: TypeScript 5.3+ (strict mode)
- **Framework**: React 18.2+ (popup UI)
- **Build Tool**: Vite 5.0+ (fast HMR, optimized builds)
- **Manifest**: Chrome Extension Manifest V3
- **UI Library**: Tailwind CSS 3.4+
- **Charts**: Chart.js 4.4+ (analytics visualizations)
- **Icons**: Lucide React 0.263+
- **State Management**: Zustand 4.4+ (lightweight, TypeScript-first)

#### APIs Used
- `chrome.declarativeNetRequest` - Website blocking
- `chrome.storage.local` - Data persistence
- `chrome.storage.sync` - Settings sync (optional)
- `chrome.alarms` - Scheduled tasks and timers
- `chrome.tabs` - Tab tracking and context detection
- `chrome.action` - Badge updates
- `chrome.notifications` - Desktop notifications

#### Optional Dependencies
- **Local ML**: TensorFlow.js 4.11+ (task categorization)
- **Cloud AI**: OpenAI API (gpt-4o-mini) via fetch
- **Testing**: Vitest 1.0+ (unit tests), Playwright 1.40+ (E2E)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Popup UI    │◄────►│   Options    │                   │
│  │  (React)     │      │   Page       │                   │
│  └──────┬───────┘      └──────────────┘                   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────┐          │
│  │      Background Service Worker              │          │
│  │  ┌────────────┐  ┌────────────┐            │          │
│  │  │  Timer     │  │  Blocker   │            │          │
│  │  │  Engine    │  │  Engine    │            │          │
│  │  └─────┬──────┘  └─────┬──────┘            │          │
│  │        │               │                    │          │
│  │        ▼               ▼                    │          │
│  │  ┌────────────────────────────┐            │          │
│  │  │   Storage Manager          │            │          │
│  │  │  (chrome.storage.local)    │            │          │
│  │  └────────────────────────────┘            │          │
│  └─────────────────────────────────────────────┘          │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │   Content    │  (Injected into web pages)              │
│  │   Scripts    │  - YouTube controls                      │
│  └──────────────┘  - Block page overlay                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional External Services                      │
├─────────────────────────────────────────────────────────────┤
│  • TensorFlow.js (local, in-browser ML)                    │
│  • OpenAI API (cloud AI insights) - Premium only           │
│  • Firebase (optional cloud sync) - Free tier              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Pomodoro Session Start
```
User clicks "Start" 
  → Popup UI dispatches action
  → Background worker updates state
  → chrome.alarms sets 25-min timer
  → chrome.storage.local saves session
  → chrome.action.setBadgeText updates badge
  → chrome.declarativeNetRequest enables blocking rules
```

#### Website Access Attempt During Block
```
User navigates to blocked site
  → chrome.declarativeNetRequest intercepts request
  → Redirect to block page (chrome-extension://[id]/blocked.html)
  → Block page fetches stats from storage
  → Display streak, remaining time, motivational quote
```

#### Analytics Calculation (Daily Summary)
```
chrome.alarms triggers at midnight
  → Background worker queries chrome.storage.local
  → Aggregate today's sessions
  → Calculate metrics (focus score, Pomodoros completed)
  → Update weekly/monthly aggregates
  → Clean up old detailed data (>90 days)
  → (Optional) Generate AI insights if premium + enabled
```

---

## Code Quality Standards

### Quality Gates (Enforced in CI/CD)

#### Code Coverage
- **New Code**: ≥80% line coverage (SonarQube default)
- **Branch Coverage**: ≥70% for core modules (timer, blocker)
- **Overall Coverage**: Gradually increase to 70%+ (legacy code allowed lower)
- **Excluded**: Type definitions, config files, auto-generated code

#### Code Duplication
- **New Code**: ≤3% duplication (strict)
- **Overall**: Drive toward ≤5-8% via continuous refactoring
- **Detection**: SonarQube with default settings

#### Cyclomatic Complexity
- **Normal Functions**: ≤10 (SonarQube default)
- **Security-Critical**: ≤5-7 (e.g., nuclear mode validation, challenge verification)
- **Flagged for Refactor**: >15
- **Rationale**: ISO/IEC 25010 maintainability standards

#### Function Size
- **Heuristic**: <50 lines for most functions
- **Exceptions**: Data mappers, config objects (simple, linear code)
- **Enforcement**: ESLint rule `max-lines-per-function`

#### Security Standards (OWASP ASVS Level 2)
- **SAST**: SonarQube security rules enabled
- **DAST**: Manual penetration testing for chrome.storage tampering
- **Dependency Scanning**: npm audit in CI pipeline (fail on high/critical)
- **Manual Reviews**: All PR security hotspots reviewed before merge

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### ESLint Rules

**Key Rules**:
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/explicit-function-return-type`: warn
- `max-lines-per-function`: [error, 50]
- `complexity`: [error, 10]
- `max-depth`: [error, 3]
- `sonarjs/cognitive-complexity`: [error, 15]

### Testing Strategy

#### Unit Tests (Vitest)
- **Target**: All business logic functions
- **Coverage**: ≥80% for new code
- **Mocking**: Chrome APIs mocked using `vitest-chrome`
- **Examples**:
  - Timer state transitions
  - Block list validation
  - Analytics calculations
  - Challenge verification

#### Integration Tests
- **Target**: Component interactions
- **Examples**:
  - Popup UI + background worker communication
  - Storage operations + state updates
  - Timer + blocker coordination

#### End-to-End Tests (Playwright)
- **Target**: Critical user flows
- **Examples**:
  - Complete Pomodoro cycle (start → work → break → end)
  - Block list CRUD + website blocking
  - Nuclear mode activation + enforcement
  - Analytics dashboard rendering

#### Security Tests
- **SAST**: SonarQube in CI pipeline
- **Manual**: Penetration testing for:
  - `chrome.storage.local` tampering
  - Challenge bypass attempts
  - XSS in user-provided text
  - SSRF in URL validation

---

## UI/UX Design Standards

### Design Principles

1. **Clarity Over Cleverness**: Every UI element has one clear purpose
2. **Respect User Time**: No unnecessary clicks or confirmations
3. **Progressive Disclosure**: Advanced features hidden until needed
4. **Consistency**: Same patterns throughout (buttons, colors, spacing)
5. **Accessibility First**: WCAG 2.1 AA compliance mandatory

### Visual Design System

#### Color Palette
```css
/* Primary - Focus Red */
--color-primary-50: #fef2f2;
--color-primary-500: #ef4444;  /* Active work session */
--color-primary-600: #dc2626;  /* Hover states */

/* Success - Break Green */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;  /* Active break */

/* Neutral - UI Base */
--color-neutral-50: #fafafa;
--color-neutral-900: #171717;

/* Warning - Time Running Out */
--color-warning-500: #f59e0b;
```

#### Typography
- **Font Family**: System UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`)
- **Popup Heading**: 24px, 600 weight
- **Timer Display**: 48px, 700 weight, tabular-nums
- **Body Text**: 14px, 400 weight
- **Small Text**: 12px, 400 weight

#### Spacing Scale (Tailwind)
- `space-1`: 4px (tight spacing)
- `space-4`: 16px (default spacing)
- `space-6`: 24px (section spacing)
- `space-8`: 32px (large gaps)

### Component Standards

#### Buttons
```tsx
// Primary action (start timer)
<button className="bg-primary-500 text-white px-6 py-3 rounded-lg 
                   hover:bg-primary-600 active:scale-95 
                   transition-all duration-150">
  Start Pomodoro
</button>

// Secondary action
<button className="bg-neutral-100 text-neutral-900 px-4 py-2 rounded-md 
                   hover:bg-neutral-200">
  Skip
</button>

// Destructive action
<button className="bg-red-500 text-white px-4 py-2 rounded-md 
                   hover:bg-red-600">
  Delete Streak
</button>
```

#### Input Fields
```tsx
<input 
  type="text"
  className="w-full px-4 py-2 border border-neutral-300 rounded-md
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500
             transition-all"
  placeholder="Enter task name..."
/>
```

#### Loading States
```tsx
// Skeleton loader for analytics
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
  <div className="h-32 bg-neutral-200 rounded"></div>
</div>
```

### Accessibility Requirements

#### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via Tab/Enter
- **Screen Reader**: ARIA labels for all icons and dynamic content
- **Focus Indicators**: Visible focus ring (2px solid, primary color)

#### ARIA Labels
```tsx
<button aria-label="Start 25-minute focus session">
  <PlayIcon className="w-6 h-6" />
</button>

<div role="timer" aria-live="polite" aria-atomic="true">
  {formatTime(remainingSeconds)}
</div>
```

#### Keyboard Shortcuts
- `Space`: Start/pause timer
- `Escape`: Close modal/popup
- `Tab`: Navigate between elements
- `Enter`: Activate focused button

### Animation Guidelines

#### Transitions
- **Duration**: 150ms for micro-interactions, 300ms for layout changes
- **Easing**: `ease-out` for entrances, `ease-in` for exits
- **Properties**: Transform and opacity only (GPU-accelerated)

#### Examples
```css
/* Button press */
.button:active {
  transform: scale(0.95);
  transition: transform 150ms ease-out;
}

/* Modal entrance */
.modal {
  animation: slideUp 300ms ease-out;
}

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
```

### Responsive Design

#### Popup Dimensions
- **Default**: 400px × 600px
- **Minimum**: 320px × 480px (never smaller)
- **Full-page**: Responsive grid (analytics dashboard)

#### Breakpoints
```css
/* Popup view (default) */
@media (max-width: 400px) { ... }

/* Full-page view */
@media (min-width: 768px) { ... }
@media (min-width: 1024px) { ... }
```

---

## Monetization Strategy

### Pricing Tiers

#### Free Tier
**Target**: 95% of users (retention focus)

**Features**:
- 5 blocked websites
- Basic Pomodoro timer (25/5/15 defaults)
- Basic analytics (today + this week)
- Streak tracking
- 1 scheduled block

**Limitations**:
- No AI insights
- No YouTube controls
- No nuclear mode
- No task categorization

#### Premium Tier: $3.99/month or $34.99/year
**Target**: 2.5% conversion (5,000 users at 200K install base)

**Features**:
- Unlimited blocked websites
- Advanced scheduling (multiple schedules)
- Full analytics (90 days detailed, 1 year aggregated)
- YouTube-specific controls
- Nuclear mode
- Task categorization (manual or local ML)
- Streak freezes
- Export data (CSV/JSON)
- Priority support

#### Premium+ Tier: $7.99/month or $69.99/year (Optional)
**Target**: Power users, 0.5% conversion (1,000 users)

**Features**:
- Everything in Premium
- AI-powered insights (OpenAI GPT-4o Mini)
- Advanced task auto-categorization
- Personalized recommendations
- Custom CSS themes
- API access (for third-party integrations)

### Revenue Projections

#### Conservative Scenario (Year 1)
- **Installs**: 50,000
- **Premium Conversion**: 2% = 1,000 users
- **MRR**: 1,000 × $3.99 = $3,990
- **Annual Revenue**: $47,880
- **Costs**: $600/month × 12 = $7,200
- **Net Profit**: $40,680 (85% margin)

#### Target Scenario (Year 2)
- **Installs**: 200,000
- **Premium Conversion**: 2.5% = 5,000 users
- **MRR**: 5,000 × $3.99 = $19,950
- **Annual Revenue**: $239,400
- **Costs**: $600/month × 12 = $7,200
- **Net Profit**: $232,200 (97% margin)

#### Optimistic Scenario (Year 3)
- **Installs**: 500,000
- **Premium Conversion**: 3% = 15,000 users
- **Premium+**: 0.5% = 2,500 users
- **MRR**: (15,000 × $3.99) + (2,500 × $7.99) = $79,825
- **Annual Revenue**: $957,900
- **Costs**: $1,500/month × 12 = $18,000 (scaled infrastructure)
- **Net Profit**: $939,900 (98% margin)

### Payment Processing

#### Stripe Integration
- **Subscription Management**: Stripe Billing
- **Webhook Events**: 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- **Security**: Stripe Checkout (PCI-compliant, no card data stored)

#### License Validation
- User pays via Stripe Checkout → receives license key via email
- User enters license key in extension settings
- Extension validates key via serverless function (Cloudflare Workers)
- License key stored in `chrome.storage.sync` (cross-device)

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-4)
**Goal**: Launch functional extension with core features

**Week 1-2: Foundation**
- ✅ Project setup (Vite, TypeScript, React)
- ✅ Chrome Extension boilerplate (Manifest V3)
- ✅ Background service worker + popup UI
- ✅ Storage manager (chrome.storage.local wrapper)
- ✅ Basic UI components (buttons, inputs, timer display)

**Week 3-4: Core Features**
- ✅ Website blocking (declarativeNetRequest)
- ✅ Block list CRUD operations
- ✅ Pomodoro timer (work/break cycles)
- ✅ Streak tracking (daily check-in)
- ✅ Basic analytics (today's stats)
- ✅ Settings page

**Deliverables**:
- Functional extension installable via `chrome://extensions`
- 5 blocked sites limit (free tier)
- Basic Pomodoro (25/5/15 defaults)
- No AI features yet

### Phase 2: Premium Features (Weeks 5-6)
**Goal**: Add monetization and advanced features

**Week 5: Advanced Blocking**
- ✅ Scheduled blocking (chrome.alarms)
- ✅ Nuclear mode (with challenges)
- ✅ Daily time allowances
- ✅ YouTube-specific controls (content script)

**Week 6: Analytics & Gamification**
- ✅ Full analytics dashboard (Chart.js)
- ✅ Weekly/monthly views
- ✅ Achievements system
- ✅ Data export (CSV/JSON)

**Deliverables**:
- Premium tier features complete
- Stripe payment integration
- License key validation

### Phase 3: Polish & Testing (Weeks 7-8)
**Goal**: Quality assurance and Chrome Web Store submission

**Week 7: Testing**
- ✅ Unit tests (≥80% coverage)
- ✅ E2E tests (critical flows)
- ✅ Security audit (OWASP ASVS)
- ✅ Performance testing (memory, CPU)
- ✅ Cross-browser testing (Chrome, Edge, Brave)

**Week 8: Launch Prep**
- ✅ Chrome Web Store assets (screenshots, promo video)
- ✅ Privacy policy + terms of service
- ✅ Documentation (user guide, FAQ)
- ✅ Landing page (optional)
- ✅ Submit to Chrome Web Store

**Deliverables**:
- Extension live on Chrome Web Store
- Complete documentation
- Marketing materials

### Phase 4: Post-Launch Iteration (Ongoing)
**Goal**: User feedback → feature refinement

**Month 2-3**:
- Monitor crash reports (Chrome Error Reporting)
- Analyze user feedback (reviews, support tickets)
- A/B test pricing ($3.99 vs $4.99)
- Add most-requested features

**Month 4-6**:
- Launch Premium+ tier (AI insights)
- Expand to Firefox (if demand exists)
- Build community (Discord, subreddit)

---

## Risk Assessment & Mitigation

### Technical Risks

#### Risk 1: Chrome API Changes (Manifest V3 Deprecations)
- **Likelihood**: Medium (Chrome updates quarterly)
- **Impact**: High (extension could break)
- **Mitigation**:
  - Subscribe to Chromium-extensions mailing list
  - Use only stable APIs (avoid experimental)
  - Maintain compatibility layer for API migrations
  - Monthly dependency updates

#### Risk 2: Performance Degradation (Memory Leaks)
- **Likelihood**: Medium (service workers can leak)
- **Impact**: Medium (poor user experience)
- **Mitigation**:
  - Use WeakMap for event listeners
  - Clear intervals/alarms on cleanup
  - Periodic memory profiling (Chrome DevTools)
  - Automated performance tests in CI

#### Risk 3: Data Loss (Storage Corruption)
- **Likelihood**: Low (chrome.storage is stable)
- **Impact**: High (user loses streak/analytics)
- **Mitigation**:
  - Implement storage versioning (migrate old data)
  - Daily backup to chrome.storage.sync (if enabled)
  - Export data feature (manual backup)
  - Transaction locks for concurrent writes

### Security Risks

#### Risk 4: Challenge Bypass (Nuclear Mode Tampering)
- **Likelihood**: High (users will try)
- **Impact**: Medium (reduces effectiveness)
- **Mitigation**:
  - HMAC-signed timestamps (prevent client-side modification)
  - Obfuscate code (prevent easy reverse engineering)
  - Detect system time manipulation
  - Log tampering attempts

#### Risk 5: XSS via User Input
- **Likelihood**: Low (limited user input)
- **Impact**: High (could steal license keys)
- **Mitigation**:
  - Strict CSP headers (no inline scripts)
  - DOMPurify for all user-generated content
  - TypeScript strict mode (catch type issues)
  - SAST scanning in CI (SonarQube)

### Business Risks

#### Risk 6: Low Conversion Rate (<2%)
- **Likelihood**: Medium (free alternatives exist)
- **Impact**: High (revenue below projections)
- **Mitigation**:
  - Freemium trial (14-day premium unlock)
  - In-app upsell messaging (highlight premium benefits)
  - Testimonials from power users
  - Referral program (1 month free per referral)

#### Risk 7: Chrome Web Store Rejection
- **Likelihood**: Low (if guidelines followed)
- **Impact**: High (delayed launch)
- **Mitigation**:
  - Review Chrome Web Store policies before submission
  - Pre-submission checklist (privacy policy, permissions justification)
  - Beta testing with 50+ users before public launch
  - Have legal review privacy policy

---

## Success Criteria

### Launch Success (Month 1)
- ✅ 5,000+ installs
- ✅ 4.0+ star rating (50+ reviews)
- ✅ <5% crash rate
- ✅ 50+ premium conversions ($200 MRR)

### Growth Success (Month 6)
- ✅ 50,000+ installs
- ✅ 4.3+ star rating (500+ reviews)
- ✅ 2.5% conversion rate
- ✅ $5,000 MRR
- ✅ <3% monthly churn

### Maturity Success (Month 12)
- ✅ 200,000+ installs
- ✅ 4.5+ star rating (2,000+ reviews)
- ✅ $19,950 MRR (5,000 premium users)
- ✅ Featured in Chrome Web Store "Productivity" category
- ✅ Profitability: $230K+ annual net profit

---

## Appendix

### A. Chrome Extension Permissions Justification

**Required Permissions**:
- `declarativeNetRequest`: Block websites based on user-defined rules
- `storage`: Persist user settings, analytics, and timer state
- `alarms`: Schedule Pomodoro timers and daily resets
- `tabs`: Track active tab for context detection (task auto-fill)
- `notifications`: Alert user when Pomodoro sessions end

**Optional Permissions**:
- `storage.sync`: Cross-device settings sync (user-initiated)

### B. Competitive Analysis

| Feature | Our Extension | StayFocusd | Freedom | Forest |
|---------|--------------|------------|---------|--------|
| Website Blocking | ✅ | ✅ | ✅ | ❌ |
| Pomodoro Timer | ✅ | ❌ | ❌ | ✅ |
| Analytics | ✅ Advanced | ❌ | ✅ Basic | ✅ Basic |
| Nuclear Mode | ✅ | ✅ | ❌ | ❌ |
| YouTube Controls | ✅ | ❌ | ❌ | ❌ |
| Pricing | $3.99/mo | Free | $6.99/mo | $1.99/mo |
| AI Insights | ✅ (Premium+) | ❌ | ❌ | ❌ |

### C. User Quotes (Validation)

> "I love StayFocusd, especially the 'nuclear' option. It's the only thing that keeps me off Reddit during work hours."  
> — StayFocusd user review (8.4K ratings)

> "Freedom is worth every penny. I've doubled my productive hours."  
> — Freedom user review (4.6/5 rating)

> "I wish there was a Pomodoro timer built into my blocker. Switching between apps is distracting."  
> — Reddit r/productivity user

### D. Technical Glossary

- **Manifest V3**: Latest Chrome Extension platform (required for new extensions since 2023)
- **Service Worker**: Background script that runs independently of web pages
- **declarativeNetRequest**: Chrome API for blocking network requests (replaces webRequest in MV3)
- **chrome.storage.local**: Local storage API (unlimited quota, survives uninstall if synced)
- **Cyclomatic Complexity**: Metric measuring code complexity (number of independent paths)
- **OWASP ASVS**: Application Security Verification Standard (security checklist)

### E. References

1. Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
2. OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
3. SonarQube Quality Gates: https://docs.sonarqube.org/latest/user-guide/quality-gates/
4. TensorFlow.js: https://www.tensorflow.org/js
5. Chart.js Docs: https://www.chartjs.org/docs/

---

**Document End**  
**Next Steps**: Review with stakeholders → Create `.claude` configuration files → Generate master prompt for Claude Code
