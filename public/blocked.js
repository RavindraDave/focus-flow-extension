/**
 * Blocked Page Script
 * Fetches timer, streak, and analytics data from background
 * Updates UI dynamically
 */

// State
let timerInterval = null;
let remainingSeconds = 0;
let totalSeconds = 0;

// Motivational quotes
const quotes = [
  "💪 'Success is the sum of small efforts repeated day in and day out.'",
  "🎯 'Focus is the key to achieving extraordinary results.'",
  "🔥 'Stay committed to your decisions, but stay flexible in your approach.'",
  "⭐ 'The secret of getting ahead is getting started.'",
  "🚀 'Your limitation—it's only your imagination.'",
  "💎 'Great things never come from comfort zones.'",
  "🌟 'Dream it. Wish it. Do it.'",
  "🏆 'Success doesn't just find you. You have to go out and get it.'",
];

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  if (seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format minutes into readable time
 */
function formatMinutes(minutes) {
  if (minutes === 0) return '0min';
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

/**
 * Get blocked site name from URL
 * SECURITY: Validates URL parameter to prevent XSS attacks
 */
function getBlockedSite() {
  const urlParams = new URLSearchParams(window.location.search);
  const url = urlParams.get('url');

  // Strict validation
  if (!url || typeof url !== 'string') {
    return 'this site';
  }

  // Only allow http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'this site';
  }

  try {
    const urlObj = new URL(url);
    // Additional validation - only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return 'this site';
    }
    return urlObj.hostname;
  } catch (e) {
    return 'this site';
  }
}

/**
 * Fetch timer status from background
 */
async function fetchTimerStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TIMER_GET_STATUS',
    });

    if (response.success && response.data) {
      const status = response.data;

      if (status.state === 'work' || status.state === 'paused') {
        remainingSeconds = status.remainingSeconds;
        totalSeconds = status.totalSeconds;

        // Update subtitle based on session type
        const subtitle = document.getElementById('subtitle');
        if (status.state === 'work') {
          subtitle.textContent = 'This website is blocked during your focus session';
        } else {
          subtitle.textContent = 'This website is blocked while timer is paused';
        }

        // Update timer display
        updateTimerDisplay();

        // Update progress bar
        updateProgress();

        return true;
      }
    }

    // No active work session
    const subtitle = document.getElementById('subtitle');
    subtitle.textContent = 'This website is blocked';
    document.getElementById('timer').textContent = 'Blocked';
    return false;
  } catch (error) {
    console.error('Failed to fetch timer status:', error);
    return false;
  }
}

/**
 * Fetch analytics data from background
 */
async function fetchAnalytics() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYTICS_GET',
    });

    if (response.success && response.data) {
      const analytics = response.data;

      // Update streak
      const streakEl = document.getElementById('streak');
      const streak = analytics.streak?.currentStreak || 0;
      streakEl.textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;

      // Update today's focus time
      const focusTimeEl = document.getElementById('focus-time');
      const todayStats = analytics.dailyStats?.find(s => {
        const date = new Date(s.date);
        const today = new Date();
        return date.toDateString() === today.toDateString();
      });
      const focusMinutes = todayStats?.focusTimeMinutes || 0;
      focusTimeEl.textContent = formatMinutes(focusMinutes);

      // Update pomodoros
      const pomodorosEl = document.getElementById('pomodoros');
      const pomodoros = todayStats?.completedSessions || 0;
      pomodorosEl.textContent = pomodoros;
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
  }
}

/**
 * Fetch block rule for current site to check allowance
 */
async function fetchBlockRuleInfo() {
  const hostname = getBlockedSite();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'BLOCKLIST_GET_ALL',
    });

    if (response.success && response.data) {
      const rules = response.data;

      // Find rule matching this hostname
      const matchingRule = rules.find(rule => {
        if (!rule.enabled) return false;

        if (rule.type === 'domain') {
          return hostname.includes(rule.pattern.replace('*.', ''));
        } else if (rule.type === 'url') {
          return window.location.href.includes(rule.pattern);
        } else if (rule.type === 'keyword') {
          return window.location.href.toLowerCase().includes(rule.pattern.toLowerCase());
        }
        return false;
      });

      if (matchingRule && matchingRule.allowance) {
        showAllowanceInfo(matchingRule);
      }
    }
  } catch (error) {
    console.error('Failed to fetch block rules:', error);
  }
}

/**
 * Show allowance information
 */
function showAllowanceInfo(rule) {
  const section = document.getElementById('allowance-section');
  const fill = document.getElementById('allowance-fill');
  const text = document.getElementById('allowance-text');
  const message = document.getElementById('allowance-message');
  const btn = document.getElementById('use-allowance-btn');

  section.style.display = 'block';

  const used = rule.timeUsedToday || 0;
  const total = rule.allowance;
  const percentage = (used / total) * 100;

  fill.style.width = `${Math.min(percentage, 100)}%`;
  text.textContent = `${used} / ${total} min`;

  if (used >= total) {
    message.textContent = "You've used your daily allowance for this site. Come back tomorrow!";
    btn.style.display = 'none';
  } else {
    const remaining = total - used;
    message.textContent = `You have ${remaining} minutes remaining today for this site.`;

    // Show button to use allowance
    btn.style.display = 'block';
    btn.textContent = `Use ${remaining} Min${remaining === 1 ? '' : 's'}`;

    // Set up click handler (remove previous listeners)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async () => {
      await handleUseAllowance(rule.pattern, remaining);
    });
  }
}

/**
 * Handle use allowance button click
 */
async function handleUseAllowance(domain, durationMinutes) {
  const btn = document.getElementById('use-allowance-btn');
  const message = document.getElementById('allowance-message');

  try {
    btn.disabled = true;
    btn.textContent = 'Granting access...';

    const response = await chrome.runtime.sendMessage({
      type: 'BLOCKER_GRANT_ACCESS',
      domain: domain,
      durationMinutes: durationMinutes
    });

    if (response.success && response.data.success) {
      message.textContent = `Access granted for ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'}! Redirecting...`;

      // Wait a moment then redirect
      setTimeout(() => {
        // Redirect to the original URL with security validation
        const urlParams = new URLSearchParams(window.location.search);
        const originalUrl = urlParams.get('url');

        // SECURITY: Validate URL before redirect to prevent open redirect attacks
        if (originalUrl) {
          try {
            const url = new URL(originalUrl);
            // Only allow http/https protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
              console.error('Invalid URL protocol for redirect');
              window.location.href = `https://${domain}`;
              return;
            }
            // Block redirects to private/internal IPs
            const hostname = url.hostname.toLowerCase();
            const privatePatterns = [
              /^localhost$/,
              /^127\./,
              /^192\.168\./,
              /^10\./,
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
              /^0\./,
              /^\[::1\]$/,
            ];
            if (privatePatterns.some(p => p.test(hostname))) {
              console.error('Redirect to private IP blocked');
              window.location.href = `https://${domain}`;
              return;
            }
            window.location.href = url.toString();
          } catch (e) {
            console.error('Invalid URL for redirect:', e);
            window.location.href = `https://${domain}`;
          }
        } else {
          // If no URL param, try to construct from domain
          window.location.href = `https://${domain}`;
        }
      }, 1000);
    } else {
      message.textContent = response.data.error || 'Failed to grant access. Please try again.';
      btn.disabled = false;
      btn.textContent = `Use ${durationMinutes} Min${durationMinutes === 1 ? '' : 's'}`;
    }
  } catch (error) {
    console.error('Failed to grant access:', error);
    message.textContent = 'Failed to grant access. Please try again.';
    btn.disabled = false;
    btn.textContent = `Use ${durationMinutes} Min${durationMinutes === 1 ? '' : 's'}`;
  }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
  const timerEl = document.getElementById('timer');
  timerEl.textContent = formatTime(remainingSeconds);

  // Change color if on break
  if (remainingSeconds <= 0) {
    timerEl.classList.add('break');
    const messageEl = document.getElementById('message');
    messageEl.textContent = 'Focus session complete! Take a well-deserved break.';
  }
}

/**
 * Update progress bar
 */
function updateProgress() {
  const progressEl = document.getElementById('progress');

  if (totalSeconds > 0) {
    const percentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    progressEl.style.width = `${Math.min(percentage, 100)}%`;
  }
}

/**
 * Start countdown timer
 */
function startCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
      updateProgress();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;

      // Fetch fresh status
      setTimeout(fetchTimerStatus, 1000);
    }
  }, 1000);
}

/**
 * Initialize the blocked page
 */
async function initialize() {
  // Show blocked site name
  const siteNameEl = document.getElementById('site-name');
  siteNameEl.textContent = getBlockedSite();

  // Show random motivational quote
  const motivationEl = document.getElementById('motivation');
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  motivationEl.textContent = randomQuote;

  // Fetch all data
  const hasTimer = await fetchTimerStatus();
  await fetchAnalytics();
  await fetchBlockRuleInfo();

  // Start countdown if timer is active
  if (hasTimer && remainingSeconds > 0) {
    startCountdown();
  }

  // Show content
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';

  // Refresh data every 30 seconds
  setInterval(async () => {
    await fetchTimerStatus();
    await fetchAnalytics();
  }, 30000);
}

// Fix URLSearchParams typo and initialize
class URLParams extends URLSearchParams {}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
