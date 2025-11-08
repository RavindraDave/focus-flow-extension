# Security Standards - Focus Mode & Pomodoro Timer Extension
## OWASP ASVS Level 2 Implementation

## Overview

This extension implements **OWASP ASVS (Application Security Verification Standard) Level 2** for internet-facing applications with sensitive user data. All security requirements are mapped to specific ASVS controls.

**Security Posture**:
- **Threat Level**: Medium (user productivity data, subscription info)
- **Privacy Model**: Local-first, privacy-preserving
- **Attack Surface**: Chrome extension APIs, user input, optional cloud AI

---

## Security Controls by Category

### V1: Architecture, Design and Threat Modeling

#### V1.4: Access Control Architecture
**Requirement**: Enforce least privilege principle for Chrome API permissions

```json
// manifest.json - Minimal permissions
{
  "permissions": [
    "declarativeNetRequest",  // Required for blocking
    "storage",                // Required for data persistence
    "alarms",                 // Required for timers
    "tabs",                   // Required for context detection
    "notifications"           // Required for alerts
  ],
  "optional_permissions": [
    "storage.sync"            // User must grant for cloud sync
  ],
  "host_permissions": []      // No host permissions by default
}
```

**Control**: Never request broad `<all_urls>` permission. Use `declarativeNetRequest` instead of `webRequest` (MV3 requirement).

#### V1.14: Configuration Architecture
**Requirement**: Sensitive configuration values must not be hardcoded

```typescript
// ❌ BAD: Hardcoded API key
const OPENAI_API_KEY = 'sk-proj-abc123...';

// ✅ GOOD: User provides their own API key (premium feature)
const apiKey = await chrome.storage.local.get('premiumApiKey');
if (!apiKey) {
  throw new Error('API key not configured');
}
```

---

### V2: Authentication & Session Management

#### V2.1: Password Security (Applicable to Premium License Keys)
**ASVS 2.1.1**: Verify that user-set passwords are at least 12 characters in length.

**Implementation**: For Premium license validation:
```typescript
// License key format: PREFIX-XXXX-XXXX-XXXX-XXXX (24 chars)
// Generated server-side with cryptographically secure random
function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^FPT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}
```

#### V2.2: General Authenticator Security
**ASVS 2.2.1**: Verify that anti-automation controls are effective at mitigating breached credential testing, brute force, and account lockout attacks.

**Implementation**: Rate limiting for challenge attempts:
```typescript
// src/background/blocker/ChallengeGate.ts
const CHALLENGE_ATTEMPTS_LIMIT = 3;
const CHALLENGE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export class ChallengeGate {
  async verifyChallengeAttempt(userId: string): Promise<void> {
    const attempts = await this.getAttempts(userId);
    
    if (attempts.count >= CHALLENGE_ATTEMPTS_LIMIT) {
      const timeSinceFirst = Date.now() - attempts.firstAttemptTime;
      
      if (timeSinceFirst < CHALLENGE_TIMEOUT_MS) {
        throw new ValidationError(
          `Too many attempts. Try again in ${Math.ceil((CHALLENGE_TIMEOUT_MS - timeSinceFirst) / 60000)} minutes.`
        );
      }
      
      // Reset after timeout
      await this.resetAttempts(userId);
    }
  }
  
  async recordFailedAttempt(userId: string): Promise<void> {
    const attempts = await this.getAttempts(userId);
    
    await chrome.storage.local.set({
      [`challengeAttempts_${userId}`]: {
        count: attempts.count + 1,
        firstAttemptTime: attempts.firstAttemptTime || Date.now(),
      },
    });
  }
}
```

---

### V3: Session Management

#### V3.3: Session Logout and Timeout
**ASVS 3.3.1**: Verify that logout and expiration invalidate the session token.

**Implementation**: Nuclear mode session expiration:
```typescript
// src/background/blocker/NuclearMode.ts
export class NuclearMode {
  async activate(durationMinutes: number, challengeToken: string): Promise<void> {
    // Validate challenge token signature
    if (!this.verifyHMAC(challengeToken)) {
      throw new SecurityError('Invalid challenge token');
    }
    
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    
    // Store signed session
    const session: NuclearModeSession = {
      active: true,
      endTime,
      signature: this.signSession(endTime),
    };
    
    await chrome.storage.local.set({ nuclearMode: session });
    
    // Auto-deactivate at end time
    await chrome.alarms.create('nuclear_mode_end', {
      when: endTime,
    });
  }
  
  async checkExpiration(): Promise<void> {
    const session = await chrome.storage.local.get('nuclearMode');
    
    if (!session.nuclearMode) return;
    
    // Verify signature to prevent tampering
    if (!this.verifySignature(session.nuclearMode)) {
      console.error('Nuclear mode signature invalid - possible tampering');
      await this.forceDeactivate();
      return;
    }
    
    if (Date.now() >= session.nuclearMode.endTime) {
      await this.deactivate();
    }
  }
}
```

---

### V4: Access Control

#### V4.1: General Access Control Design
**ASVS 4.1.1**: Verify that the application enforces access control rules on a trusted service layer.

**Implementation**: Settings access control during nuclear mode:
```typescript
// src/background/blocker/SettingsGuard.ts
export class SettingsGuard {
  async canModifySettings(): Promise<boolean> {
    const nuclearMode = await chrome.storage.local.get('nuclearMode');
    
    if (nuclearMode.nuclearMode?.active) {
      const now = Date.now();
      
      // Verify session hasn't been tampered with
      if (!this.verifyNuclearModeIntegrity(nuclearMode.nuclearMode)) {
        throw new SecurityError('Nuclear mode integrity check failed');
      }
      
      if (now < nuclearMode.nuclearMode.endTime) {
        return false; // Settings locked
      }
    }
    
    return true;
  }
  
  async enforceSettingsAccess(action: string): Promise<void> {
    const allowed = await this.canModifySettings();
    
    if (!allowed) {
      const session = await chrome.storage.local.get('nuclearMode');
      const remaining = Math.ceil((session.nuclearMode.endTime - Date.now()) / 60000);
      
      throw new AccessDeniedError(
        `Settings locked by nuclear mode. ${remaining} minutes remaining.`
      );
    }
  }
}
```

---

### V5: Validation, Sanitization and Encoding

#### V5.1: Input Validation
**ASVS 5.1.1**: Verify that the application has defenses against HTTP parameter pollution attacks.

**Implementation**: URL validation for block list:
```typescript
// src/shared/utils/validation.ts

/**
 * Validate URL to prevent SSRF and malicious patterns.
 * ASVS V5.1.1, V5.2.6
 */
export function validateBlockedURL(input: string): ValidationResult {
  // Max length (prevent storage exhaustion)
  if (input.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 chars)' };
  }
  
  // Allowed protocols only
  const allowedProtocols = ['http:', 'https:'];
  try {
    const url = new URL(input);
    
    if (!allowedProtocols.includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs allowed' };
    }
    
    // Prevent localhost/private IP targeting (SSRF protection)
    const hostname = url.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
    ];
    
    if (privatePatterns.some(p => p.test(hostname))) {
      return { valid: false, error: 'Cannot block localhost/private IPs' };
    }
    
    return { valid: true, url };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
```

#### V5.2: Sanitization and Sandboxing
**ASVS 5.2.8**: Verify that the application sanitizes user input before passing to mail systems.

**Implementation**: Sanitize task names before display:
```typescript
// src/shared/utils/sanitize.ts
import DOMPurify from 'dompurify';

/**
 * Sanitize user-provided text to prevent XSS.
 * ASVS V5.2.8, V14.3.1
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  // Truncate
  const truncated = input.slice(0, maxLength);
  
  // Remove HTML tags and scripts
  const clean = DOMPurify.sanitize(truncated, {
    ALLOWED_TAGS: [],  // No HTML allowed
    ALLOWED_ATTR: [],
  });
  
  return clean.trim();
}

// Usage
const taskName = sanitizeText(userInput, 100);
await chrome.storage.local.set({ taskName });
```

#### V5.3: Output Encoding and Injection Prevention
**ASVS 5.3.3**: Verify that context-aware output escaping protects against XSS.

**Implementation**: Safe rendering in React components:
```typescript
// ✅ GOOD: React auto-escapes by default
export const TaskDisplay: React.FC<{ task: string }> = ({ task }) => {
  return <div>{task}</div>; // React escapes automatically
};

// ❌ BAD: dangerouslySetInnerHTML without sanitization
export const TaskDisplay: React.FC<{ task: string }> = ({ task }) => {
  return <div dangerouslySetInnerHTML={{ __html: task }} />; // NEVER DO THIS
};

// ✅ GOOD: If HTML needed, sanitize first
export const TaskDisplay: React.FC<{ task: string }> = ({ task }) => {
  const clean = DOMPurify.sanitize(task, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: [],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};
```

---

### V6: Stored Cryptography

#### V6.2: Algorithms
**ASVS 6.2.1**: Verify that all cryptographic modules fail securely.

**Implementation**: HMAC-SHA256 for nuclear mode integrity:
```typescript
// src/shared/utils/crypto.ts

/**
 * Sign data with HMAC-SHA256.
 * ASVS V6.2.1, V6.2.2
 */
export async function signHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Import secret as CryptoKey
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign data
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  // Return as hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify HMAC-SHA256 signature.
 */
export async function verifyHMAC(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await signHMAC(data, secret);
  
  // Constant-time comparison (prevent timing attacks)
  if (expected.length !== signature.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  
  return result === 0;
}

// Usage: Nuclear mode session signing
const sessionData = JSON.stringify({ endTime: 1699999999999 });
const secret = await getDeviceSecret(); // Unique per browser profile
const signature = await signHMAC(sessionData, secret);

// Store
await chrome.storage.local.set({
  nuclearMode: {
    endTime: 1699999999999,
    signature,
  },
});

// Later: Verify
const stored = await chrome.storage.local.get('nuclearMode');
const isValid = await verifyHMAC(
  JSON.stringify({ endTime: stored.nuclearMode.endTime }),
  stored.nuclearMode.signature,
  await getDeviceSecret()
);

if (!isValid) {
  console.error('Nuclear mode tampered with!');
  await forceDeactivate();
}
```

#### V6.2.2: Random Values
**ASVS 6.2.2**: Verify that random numbers are created with proper entropy.

```typescript
/**
 * Generate cryptographically secure random ID.
 * ASVS V6.2.2
 */
export function generateSecureId(): string {
  // Use Web Crypto API (CSPRNG)
  return crypto.randomUUID();
}

// ❌ BAD: Math.random() is NOT cryptographically secure
const insecureId = Math.random().toString(36); // NEVER use for security

// ✅ GOOD: crypto.randomUUID() uses CSPRNG
const secureId = crypto.randomUUID();
```

---

### V8: Data Protection

#### V8.2: Client-side Data Protection
**ASVS 8.2.2**: Verify that data stored in browser storage (such as localStorage) does not contain sensitive data.

**Implementation**: Sensitive data encryption:
```typescript
// src/background/storage/SecureStorage.ts

/**
 * Encrypt sensitive data before storing.
 * ASVS V8.2.2, V8.3.4
 */
export class SecureStorage {
  async setSecure(key: string, value: any): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(value));
    await chrome.storage.local.set({ [key]: encrypted });
  }
  
  async getSecure<T>(key: string): Promise<T | null> {
    const data = await chrome.storage.local.get(key);
    if (!data[key]) return null;
    
    const decrypted = await this.decrypt(data[key]);
    return JSON.parse(decrypted);
  }
  
  private async encrypt(plaintext: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Get encryption key (derived from device-specific secret)
    const key = await this.getEncryptionKey();
    
    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  }
  
  private async decrypt(ciphertext: string): Promise<string> {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const key = await this.getEncryptionKey();
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
  
  private async getEncryptionKey(): Promise<CryptoKey> {
    // Derive key from device-specific secret
    // (In a real implementation, this would use a key derivation function)
    const secret = await getDeviceSecret();
    const encoder = new TextEncoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('focus-pomodoro-extension'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

// Usage: Store premium license key securely
const secureStorage = new SecureStorage();
await secureStorage.setSecure('premiumLicenseKey', licenseKey);
```

#### V8.3: Sensitive Private Data
**ASVS 8.3.4**: Verify that sensitive data is sent to the server in the HTTP message body or headers.

**Implementation**: Never log sensitive data:
```typescript
// ❌ BAD: Logs sensitive data
console.log('User license key:', licenseKey);
console.log('Session data:', JSON.stringify(session));

// ✅ GOOD: Sanitized logging
console.log('User authenticated:', Boolean(licenseKey));
console.log('Session active:', session.status);

// Logging utility
export function logSecurely(message: string, data: any): void {
  const sanitized = sanitizeForLogging(data);
  console.log(message, sanitized);
}

function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object') return data;
  
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    // Redact sensitive fields
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object') {
      sanitized[key] = sanitizeForLogging(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  
  return sanitized;
}

const SENSITIVE_FIELDS = [
  'licenseKey',
  'apiKey',
  'password',
  'token',
  'secret',
  'signature',
];
```

---

### V11: Business Logic

#### V11.1: Business Logic Security
**ASVS 11.1.3**: Verify the application has anti-automation controls to protect against excessive calls.

**Implementation**: Rate limiting for API calls:
```typescript
// src/background/ai/RateLimiter.ts

/**
 * Rate limiter for AI API calls.
 * ASVS V11.1.3
 */
export class RateLimiter {
  private readonly limits: Map<string, RateLimitState> = new Map();
  
  async checkLimit(
    userId: string,
    limit: number,
    windowMs: number
  ): Promise<void> {
    const now = Date.now();
    const state = this.limits.get(userId);
    
    if (!state) {
      this.limits.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return;
    }
    
    if (now >= state.resetTime) {
      // Window expired, reset
      state.count = 1;
      state.resetTime = now + windowMs;
      return;
    }
    
    if (state.count >= limit) {
      const remaining = Math.ceil((state.resetTime - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${remaining} seconds.`
      );
    }
    
    state.count++;
  }
}

// Usage: Limit AI insights to 60/hour
const rateLimiter = new RateLimiter();

async function generateAIInsight(userId: string, data: any): Promise<string> {
  await rateLimiter.checkLimit(userId, 60, 60 * 60 * 1000); // 60 per hour
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: data }],
      max_tokens: 200,
    }),
  });
  
  return response.json();
}
```

---

### V14: Configuration

#### V14.2: Dependency
**ASVS 14.2.1**: Verify that all components are up to date with proper security configurations.

**Implementation**: Automated dependency scanning:
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [pull_request, schedule]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: Fail on high/critical vulnerabilities
        run: |
          VULNS=$(npm audit --json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical')
          if [ "$VULNS" -gt 0 ]; then
            echo "Found $VULNS high/critical vulnerabilities"
            exit 1
          fi
```

**Package.json scripts**:
```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "audit:check": "npm audit --audit-level=high || exit 1"
  }
}
```

#### V14.3: Unintended Security Disclosure
**ASVS 14.3.1**: Verify that debug features are disabled in production.

```typescript
// src/shared/config/index.ts

export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';

// Never expose debug info in production
export function debugLog(message: string, data?: any): void {
  if (IS_DEV) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

// Conditional error details
export function handleError(error: Error): void {
  if (IS_DEV) {
    console.error('Full error:', error);
  } else {
    console.error('Error occurred:', error.message); // No stack trace in prod
  }
}
```

#### V14.4: HTTP Security Headers
**ASVS 14.4.3**: Verify that a Content Security Policy is in place.

```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'none';"
  }
}
```

**HTML pages** (popup.html, options.html):
```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self';">
</head>
<body>
  <!-- No inline scripts allowed -->
  <script src="./index.js"></script>
</body>
</html>
```

---

## Security Testing Requirements

### SAST (Static Application Security Testing)

#### SonarQube Security Rules
```yaml
# sonar-project.properties
sonar.security.hotspots.enabled=true
sonar.security.hotspots.review=true
sonar.exclusions=**/*.test.ts,**/*.spec.ts

# Security rules
sonar.typescript.tslint.configPath=tslint.json
sonar.typescript.lcov.reportPaths=coverage/lcov.info
```

**Required security hotspots to review**:
- SQL injection (not applicable - no SQL)
- XSS vulnerabilities
- Cryptographic issues
- Hard-coded credentials
- Insecure randomness

### DAST (Dynamic Application Security Testing)

#### Manual Penetration Testing Checklist
- [ ] Try to bypass nuclear mode by:
  - Changing system time
  - Modifying chrome.storage.local directly
  - Disabling extension and re-enabling
  - Using Chrome DevTools to manipulate service worker
- [ ] Try to inject XSS via:
  - Task names with `<script>` tags
  - Block list URLs with JavaScript
  - Settings fields with HTML
- [ ] Try to cause storage exhaustion:
  - Add 10,000+ blocked sites
  - Create 1 million+ analytics entries
- [ ] Verify rate limiting works:
  - Attempt 100 challenge attempts in 1 minute
  - Send 1,000 AI API requests in 1 minute

---

## Security Incident Response

### Vulnerability Disclosure Policy

**Contact**: security@focuspomodoro.com (create email)

**Response SLA**:
- Critical (RCE, data exfiltration): 24 hours
- High (XSS, authentication bypass): 7 days
- Medium (CSRF, info disclosure): 30 days
- Low (minor configuration issues): 90 days

### Incident Response Plan

1. **Detection**: User reports or automated alert
2. **Triage**: Assess severity (use CVSS scoring)
3. **Mitigation**: Deploy hotfix if critical
4. **Communication**: Notify affected users via extension update notes
5. **Post-Mortem**: Document root cause and preventive measures

---

## Compliance Checklist

### GDPR (EU Users)
- [ ] Privacy policy published and accessible
- [ ] User consent for optional cloud features (AI insights, sync)
- [ ] Data export functionality (CSV/JSON)
- [ ] Data deletion functionality (clear all data)
- [ ] No third-party tracking or analytics
- [ ] Encryption for data in transit (HTTPS only)

### CCPA (California Users)
- [ ] Privacy policy discloses data collection
- [ ] Right to delete personal information
- [ ] Right to opt-out of data sharing (N/A - no sharing)

### Chrome Web Store Policies
- [ ] Minimal permissions requested
- [ ] Permissions justified in privacy policy
- [ ] No obfuscated code
- [ ] Single purpose declaration
- [ ] No external code loaded (all bundled)

---

## Appendix: Security Tooling

### Development
- **ESLint**: security/detect-unsafe-regex, security/detect-non-literal-fs-filename
- **TypeScript**: Strict mode enabled
- **SonarQube**: Security hotspots review
- **npm audit**: Dependency vulnerability scanning

### CI/CD
- **GitHub Actions**: Automated security scans on every PR
- **Dependabot**: Automatic dependency updates
- **CodeQL**: Advanced semantic code analysis

### Monitoring (Post-Launch)
- **Chrome Error Reporting**: Crash analytics (no PII)
- **Manual reviews**: Chrome Web Store user feedback
- **Security mailing lists**: Subscribe to security advisories

---

**Document End**  
All security controls must be implemented and verified before production deployment.
