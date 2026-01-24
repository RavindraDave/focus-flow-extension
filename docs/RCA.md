# Root Cause Analysis (RCA) Log

This document maintains a record of issues, their root causes, and resolutions to assist future debugging and development.

## 2026-01-24: Site Blocking Not Working for Root Domains

### Issue Description
Users reported that adding a domain (e.g., "youtube.com") to the block list did not effectively block the site. Access was still possible while the focus timer was running.

### Impact
- Core feature (site blocking) failure.
- User trust degradation.
- Users able to access distracting sites during focus sessions.

### Root Cause
The `BlockerEngine` was generating declarativeNetRequest rules using the pattern `*://*.${domain}/*` (e.g., `*://*.youtube.com/*`).
- This pattern expects a subdomain context.
- It fails to match the root domain (e.g., `https://youtube.com`) because the wildcard `*.` requires at least one character prefix before the domain.
- It also potentially fails for `www.` if the user entered `www.youtube.com` and the pattern became `*://*.www.youtube.com/*`.

### Resolution
Updated `BlockerEngine` to use AdBlock-style filter syntax which is supported by Chrome's `declarativeNetRequest`.
- **Old Pattern:** `*://*.${domain}/*`
- **New Pattern:** `||${domain}^`
- The `||` prefix matches any scheme (http/https) and ensures the domain matches exactly or as a subdomain.
- The `^` suffix ensures the match ends at a separator (like `/`, `?`, or end of string), preventing partial matches (e.g., matching `example.com.evil.com`).

### Prevention / Lessons Learned
- When using `declarativeNetRequest`, prefer standard filter syntax (`||domain^`) over constructing custom regex-like wildcards unless necessary.
- Ensure test cases include both root domains and subdomains (e.g., `youtube.com` vs `www.youtube.com`).
