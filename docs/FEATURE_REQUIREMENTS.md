# Feature Requirement Document: User-Selectable Themes ("Modes")

## 1. Overview
**Goal**: Implement a robust theming system allowing users to switch between three distinct visual modes: **Modern Pro** (Default), **Zen Mode**, and **Cyber Focus**.
**Target Audience**: AI Agent / Developer.
**Scope**: Popup, Options Page, and Content Scripts (Blocking Page).

## 2. Core Requirements

### 2.1. Visual Themes
The system must support the following themes, defined by specific color palettes and font stacks.

| Theme | Key Characteristics | Font Stack | Primary Colors | Reference Mockups |
| :--- | :--- | :--- | :--- | :--- |
| **Modern Pro** | Clean, Minimal, SaaS-like | Inter / Sans-serif | Slate-900, Indigo-600, White | [Popup](mockups/popup_mockup.html), [Blocked](mockups/blocked_mockup.html), [Options](mockups/options_mockup.html) |
| **Zen Mode** | Organic, Soft, Calming | Lato + Merriweather | Sand (#F4EBD0), Sage (#5F8D4E), Charcoal | [Popup](mockups/zen_popup.html), [Blocked](mockups/zen_blocked.html), [Options](mockups/zen_options.html) |
| **Cyber Focus** | High-contrast, Neon, Terminal | JetBrains Mono | Black (#050505), Neon Cyan (#00F0FF), Pink | [Popup](mockups/cyber_popup.html), [Blocked](mockups/cyber_blocked.html), [Options](mockups/cyber_options.html) |

> **Note**: These HTML mockups are located in the `mockups/` directory and serve as the "Source of Truth" for the visual implementation. The AI Agent should inspect these files to extract exact CSS values (gradients, shadows, spacing).

### 2.2. Persistence
- The selected theme must be stored in `chrome.storage.sync` to persist across browser sessions and sync across devices.
- Default theme upon installation must be **Modern Pro**.

### 2.3. Real-time Updates
- Changing the theme in the Options page must immediately reflect in the Popup and any open Blocking pages without requiring a reload.

## 3. Technical Architecture

### 3.1. CSS Architecture (Crucial)
**Constraint**: Do NOT use inline styles for theming. Use **CSS Custom Properties (Variables)**.

**Implementation Strategy**:
1.  Define a global `themes.css` file.
2.  Use a data attribute on the `<html>` or `<body>` tag to switch themes (e.g., `<body data-theme="cyber">`).
3.  Define semantic variable names that map to specific values for each theme.

```css
/* Example Structure */
:root, [data-theme="modern"] {
  --bg-primary: #ffffff;
  --text-primary: #0f172a;
  --accent-color: #4f46e5;
  --font-body: 'Inter', sans-serif;
}

[data-theme="zen"] {
  --bg-primary: #F4EBD0;
  --text-primary: #2C3333;
  --accent-color: #5F8D4E;
  --font-body: 'Lato', sans-serif;
}

[data-theme="cyber"] {
  --bg-primary: #050505;
  --text-primary: #00F0FF;
  --accent-color: #FF0099;
  --font-body: 'JetBrains Mono', monospace;
}
```

### 3.2. React Implementation
- Create a `ThemeContext` provider that:
    1.  Loads the saved theme from `chrome.storage.sync` on mount.
    2.  Listens for storage changes (`chrome.storage.onChanged`) to update state if changed elsewhere.
    3.  Applies the `data-theme` attribute to the document root.
- **Tailwind Configuration**: Extend `tailwind.config.js` to use these CSS variables instead of hardcoded hex values.
    - Example: `colors: { primary: 'var(--bg-primary)' }`

### 3.3. Content Scripts (Blocking Page)
- The Blocking Page is an HTML file injected or displayed by the extension.
- It must also load the `themes.css` and subscribe to the storage settings to apply the correct `data-theme` attribute.

## 4. Security & Best Practices (Manifest V3)

### 4.1. Remote Code Execution (RCE)
- **Strict Prohibition**: Do NOT fetch CSS or JS from remote servers (CDNs) at runtime.
- **Fonts**: All font files (Inter, Lato, Merriweather, JetBrains Mono) must be bundled locally within the extension's `assets/fonts/` directory.
- **Manifest**: Ensure `web_accessible_resources` includes the font files if they are needed by content scripts.

### 4.2. Content Security Policy (CSP)
- Ensure the CSP allows loading local fonts and styles.
- Avoid `unsafe-inline` for scripts. Inline styles are permitted but discouraged for maintainability; use classes.

### 4.3. Performance
- Theme switching should be instant (paint-only update).
- Avoid heavy re-renders in React; modifying the root DOM attribute is sufficient for CSS variables to cascade.

## 5. Implementation Steps for AI Agent

1.  **Asset Preparation**: Download and bundle all required Google Fonts locally.
2.  **CSS Refactoring**:
    - Create `src/styles/themes.css`.
    - Define the variable maps for all 3 modes.
    - Update `tailwind.config.js` to reference these variables.
3.  **State Management**:
    - Implement `useTheme` hook and `ThemeContext`.
    - Wire up `chrome.storage.sync`.
4.  **Component Updates**:
    - Refactor Popup and Options components to use semantic Tailwind classes (e.g., `bg-primary` instead of `bg-slate-900`).
5.  **Options Page UI**:
    - Add a "Theme Selector" section (as designed in the mockups) to the Settings tab.
6.  **Verification**:
    - Test switching themes in Options and verify Popup updates immediately.
    - Verify Blocking Page respects the chosen theme.

## 6. Options Page Detailed Requirements

### 6.1. Navigation Structure
The Options page must use a **Sidebar Navigation** layout (fixed left, scrollable right).
- **Tabs**: Dashboard, Timer Settings, Blocking Rules, Integrations, Gamification, Data & Config.
- **Footer**: Link to "Pro Plan" (upsell) and Version info.

### 6.2. Tab 1: Dashboard (Home)
**Goal**: At-a-glance overview of productivity.
- **Visuals**: Card-based layout.
- **Components**:
    1.  **Focus Score**: A circular percentage chart (0-100%) based on (Focus Time / Total Available Time).
    2.  **Stats Cards**: "Today's Focus" (HH:MM), "Distractions Blocked" (Count), "Current Streak" (Days).
    3.  **Quick Toggles**:
        - "Nuclear Mode" (Toggle): Instantly blocks ALL sites except whitelist.
        - "Strict Blocking" (Toggle): Prevents "Emergency Access" on blocked pages.
    4.  **Activity Chart**: A bar chart showing focus minutes for the last 7 days.

### 6.3. Tab 2: Timer Settings
**Goal**: Configure the Pomodoro behavior.
- **Components**:
    1.  **Durations**: Inputs for Focus (default 25m), Short Break (5m), Long Break (15m).
    2.  **Auto-Start**: Checkboxes for "Auto-start Breaks" and "Auto-start Pomodoros".
    3.  **Sound**: Dropdown for notification sounds.
        - *Thematic Requirement*:
            - **Modern**: Digital "Ping".
            - **Zen**: Tibetan Bowl / Gong.
            - **Cyber**: Sci-fi "System Ready" chime.

### 6.4. Tab 3: Blocking Rules
**Goal**: Manage what gets blocked and when.
- **Components**:
    1.  **Blocklist Management**:
        - Input field to add domain (e.g., `facebook.com`).
        - List of active blocks with "Delete" and "Edit" actions.
        - *Validation*: Auto-format URLs to domains.
    2.  **Schedules**:
        - "Work Hours": Set Start/End time (e.g., 09:00 - 17:00) and Days (Mon-Fri).
        - During these hours, blocking is active automatically.

### 6.5. Tab 4: Integrations (External Connections)
**Goal**: Connect focus state to external apps.
- **Components**:
    1.  **Slack / Teams Status**:
        - *Action*: "Connect Account" (OAuth).
        - *Behavior*: When Timer starts, set status to "⛔ Focusing". When Timer ends, clear status.
    2.  **Spotify / Music**:
        - *Action*: Input "Playlist URL".
        - *Behavior*: Auto-open this URL in a background tab when Focus starts.
    3.  **Calendar Sync**:
        - *Action*: "Read Calendar".
        - *Behavior*: If a calendar event is named "Focus", auto-start the timer.

### 6.6. Tab 5: Gamification (Thematic Progression)
**Goal**: Visualize progress in a theme-consistent way.
- **Core Mechanic**: Earn "XP" (Experience Points) for every minute of focus.
- **Thematic Visualization**:
    - **Modern Pro**: **"Streak Heatmap"**. GitHub-style contribution graph showing consistency.
    - **Zen Mode**: **"The Garden"**.
        - *Visual*: A virtual garden grid.
        - *Logic*: Every 25m session plants a tree. Breaking a session early kills the tree (withered stump).
        - *Unlock*: Rare flowers for 4h+ streaks.
    - **Cyber Focus**: **"The Mainframe"**.
        - *Visual*: A hexagonal skill tree or server rack.
        - *Logic*: XP decrypts "Data Nodes".
        - *Ranks*: Script Kiddie -> White Hat -> Netrunner -> 10x Engineer.

### 6.7. Tab 6: Data & Config
**Goal**: User ownership and portability.
- **Components**:
    1.  **Export Configuration**: Download `focus-flow-config.json` (includes blocklist, settings, theme).
    2.  **Import Configuration**: Upload a JSON file to restore settings.
    3.  **Export History**: Download `focus-history.csv` (Date, Duration, Task Name).
    4.  **Danger Zone**: "Reset All Data" (Red button, requires confirmation).

## 7. UI/UX/CX & Security Standards

### 7.1. Accessibility (WCAG 2.1 AA)
**Constraint**: All UI components must be accessible.
- **Contrast**: Ensure text contrast ratio is at least 4.5:1 (especially for the "Zen" and "Cyber" themes).
- **Keyboard Nav**: All interactive elements (toggles, buttons, inputs) must be focusable and operable via keyboard (Tab/Enter/Space).
- **Screen Readers**: Use semantic HTML (`<button>`, `<nav>`, `<main>`) and ARIA labels where visual context is missing (e.g., icon-only buttons).
- **Reduced Motion**: Respect `prefers-reduced-motion` media query (disable "Cyber" animations if set).

### 7.2. Responsive Design
**Constraint**: The Options page must be responsive.
- **Mobile/Narrow View**: Sidebar should collapse into a hamburger menu or bottom nav on screens < 768px.
- **Popup**: Fixed width (approx 350px-400px) but must handle font scaling gracefully.

### 7.3. Customer Experience (CX)
- **Onboarding**:
    - First-run experience must detect the user's OS theme preference (Dark/Light) and suggest a matching theme.
    - "Quick Tour" tooltip overlay on the Dashboard to explain key features.
- **Feedback Loop**:
    - "Send Feedback" link in the footer.
    - **Error Handling**: Never show raw stack traces. Use friendly error messages (e.g., "We couldn't save that rule. Try again?" instead of "Error 500").
- **Performance**:
    - **Optimistic UI**: Toggle switches should update visually *immediately*, then sync to storage in the background. Revert only if save fails.

### 7.4. Data Privacy & Permissions
**Constraint**: Least Privilege Principle.
- **Local First**: All analytics and history data must be stored locally (`chrome.storage.local`) by default.
- **Optional Permissions**: Do NOT request `identity` or `calendar` permissions until the user explicitly tries to enable those integrations.
- **Transparency**: The "Data & Config" tab must clearly show what data is stored and allow full deletion.
