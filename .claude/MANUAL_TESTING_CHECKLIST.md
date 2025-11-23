# Manual Testing Checklist - Focus Flow Extension

**Purpose**: Catch critical bugs before claiming "production ready"
**When to use**: Before every release, after major features, before marking tasks complete

---

## 🔴 Critical Path Tests (MUST pass before release)

These tests verify core functionality that MUST work correctly. If any fail, the extension is NOT production ready.

### 1. Timer + Blocking Integration

**Why critical**: This was the source of the recent blocker bug

- [ ] **Start work session**
  - Click "Start Work" in popup
  - ✅ Expected: Badge shows countdown, blocked sites are inaccessible
  - ❌ Bug if: Sites are still accessible during work session

- [ ] **Stop work session**
  - Start work session
  - Click "Stop" before completion
  - ✅ Expected: Badge clears, ALL blocked sites become accessible immediately
  - ❌ Bug if: Sites remain blocked after stopping (THIS WAS THE BUG)

- [ ] **Complete work session**
  - Start work session
  - Wait for completion (or manually trigger)
  - ✅ Expected: Notification appears, break auto-starts (if enabled), sites unblocked
  - ❌ Bug if: Sites remain blocked during break

- [ ] **Start break**
  - Click "Start Break"
  - ✅ Expected: Badge shows countdown, all sites are accessible
  - ❌ Bug if: Sites are blocked during break

- [ ] **Pause and resume**
  - Start work session
  - Click "Pause"
  - Open blocked site (should still be blocked)
  - Click "Resume"
  - ✅ Expected: Blocking continues after resume
  - ❌ Bug if: Sites become accessible after pause

### 2. Website Blocking

**Why critical**: Core feature - must work reliably

- [ ] **Add individual site**
  - Go to Settings > Website Blocking
  - Add "youtube.com" to block list
  - Start work session
  - Try to access youtube.com
  - ✅ Expected: Blocked page appears
  - ❌ Bug if: Site loads normally

- [ ] **Quick Add feature**
  - Go to Settings > Website Blocking
  - Expand "Social Media" category in Quick Add
  - Click "+ Add" on Facebook
  - ✅ Expected: Facebook appears in block list with "✓ Added" badge
  - ❌ Bug if: Nothing happens or error occurs

- [ ] **Add All category**
  - Expand "Video & Entertainment" category
  - Click "+ Add All (X)" button
  - ✅ Expected: All sites added quickly (1-2 seconds), counts update
  - ❌ Bug if: Takes >5 seconds or sites added one-by-one visibly

- [ ] **Disable rule**
  - Add a blocking rule
  - Toggle it off
  - Start work session
  - ✅ Expected: Disabled site is accessible during work
  - ❌ Bug if: Site is still blocked

- [ ] **Delete rule**
  - Add a blocking rule
  - Delete it
  - ✅ Expected: Rule disappears from list
  - ❌ Bug if: Rule remains or returns after refresh

### 3. Onboarding Experience

**Why critical**: First impression for new users

- [ ] **First installation**
  - Install extension fresh (or clear all data)
  - ✅ Expected: Onboarding tab opens automatically
  - ❌ Bug if: Nothing happens

- [ ] **Onboarding navigation**
  - Navigate through all 6 steps
  - ✅ Expected: Can move forward/back, progress indicator updates
  - ❌ Bug if: Buttons don't work or steps are blank

- [ ] **Onboarding completion**
  - Complete all steps
  - Click "Get Started"
  - ✅ Expected: Tab closes, onboarding doesn't show again
  - ❌ Bug if: Onboarding repeats on next install

### 4. Settings Persistence

**Why critical**: Users expect settings to survive browser restart

- [ ] **Timer settings**
  - Change work duration to 30 minutes
  - Save settings
  - Restart browser
  - ✅ Expected: Settings remain at 30 minutes
  - ❌ Bug if: Settings reset to defaults

- [ ] **Block list persistence**
  - Add 5 sites to block list
  - Restart browser
  - ✅ Expected: All 5 sites still in list
  - ❌ Bug if: List is empty or incomplete

---

## 🟡 Important Tests (Should pass, but not blockers)

### 5. Popup UI

- [ ] Current timer status displays correctly
- [ ] Can start/pause/stop from popup
- [ ] Statistics show reasonable values
- [ ] UI is responsive and doesn't lag

### 6. Analytics

- [ ] Session history shows completed sessions
- [ ] Focus score updates after completing work
- [ ] Streak increments daily (requires testing across days)
- [ ] Charts display without errors

### 7. YouTube Controls (if implemented)

- [ ] Can block YouTube Shorts
- [ ] Can block recommendations
- [ ] Settings toggle correctly

---

## 🟢 Edge Cases (Test if time permits)

### 8. Boundary Conditions

- [ ] Add 100+ sites to block list (performance)
- [ ] Start session with 1-minute duration (minimum)
- [ ] Start session with 180-minute duration (maximum)
- [ ] Add site with very long domain name
- [ ] Add site with special characters in name

### 9. Error Recovery

- [ ] Network offline during operation
- [ ] Browser closes mid-session (state restoration)
- [ ] Chrome storage quota exceeded (graceful degradation)
- [ ] Invalid regex pattern in block rule

---

## 📋 Testing Workflow

**Before marking feature as "done"**:
1. Run automated tests: `npm test`
2. Run this manual checklist (at least Critical Path)
3. Document any failures
4. Fix failures before claiming "production ready"

**Before each release**:
1. Full automated test suite
2. Complete manual checklist (all sections)
3. Test on clean Chrome profile
4. Test on different OS if possible

---

## 🐛 Bug Reporting Template

When you find a bug during manual testing:

```
**Bug**: [Short description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Test**: [Which test from this checklist revealed it]
```

---

## ✅ Sign-Off

**Tested by**: _______________
**Date**: _______________
**Branch**: _______________
**Build**: _______________

**Results**:
- Critical Path: ___/6 passed
- Important Tests: ___/4 passed
- Edge Cases: ___/9 passed

**Ready for Release?**: YES / NO

**Notes**:
```
[Any observations, concerns, or issues found]
```

---

## 📖 Why This Matters

**The blocker bug** (sites staying blocked after stopping session) was a CRITICAL issue that:
- Made the extension unusable
- Should have been caught before reaching you
- Would have been caught by "Stop work session" test above

**This checklist ensures**:
- Core functionality works in real Chrome environment
- Integration between components (timer + blocker) works correctly
- User flows are tested end-to-end
- Bugs are caught BEFORE claiming "production ready"

**Remember**:
- ✅ Code that passes tests != Production ready
- ✅ Code that passes THIS checklist = Actually production ready
