/**
 * NuclearModeModal - Challenge-based activation for Nuclear Mode
 * Implements PRD Section 1.3 (FR-NO-001, FR-NO-002)
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/atoms/Button';
import { IS_PREMIUM_COMING_SOON } from '../../utils/constants';

// Rate limiting storage key
const RATE_LIMIT_KEY = 'nuclear_mode_rate_limit';
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_FAILED_ATTEMPTS = 5;

interface RateLimitData {
  failedAttempts: number;
  firstAttemptTime: number;
  lockedUntil: number | null;
}

export interface NuclearModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (durationHours: number) => Promise<void>;
  isPremium: boolean;
}

type ChallengeStep = 'duration' | 'typing' | 'math' | 'cooldown' | 'confirm';

/**
 * Generate a random math problem
 * Complexity: 3 (random generation + string building)
 */
function generateMathProblem(): { question: string; answer: number } {
  const operators = ['+', '-', '*'] as const;
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let num1: number;
  let num2: number;
  let answer: number;

  if (operator === '+') {
    num1 = Math.floor(Math.random() * 50) + 1;
    num2 = Math.floor(Math.random() * 50) + 1;
    answer = num1 + num2;
  } else if (operator === '-') {
    num1 = Math.floor(Math.random() * 50) + 20;
    num2 = Math.floor(Math.random() * num1);
    answer = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 12) + 1;
    num2 = Math.floor(Math.random() * 12) + 1;
    answer = num1 * num2;
  }

  return {
    question: `${num1} ${operator} ${num2}`,
    answer,
  };
}

const COMMITMENT_TEXT = `I commit to staying focused for the duration I have chosen. I understand that I cannot disable this mode until the timer expires. I will use this time productively and resist all distractions. This is my commitment to deep, meaningful work.`;

/**
 * Load rate limiting data from storage
 */
async function loadRateLimitData(): Promise<RateLimitData | null> {
  if (!chrome?.storage?.local) {return null;}
  const result = await chrome.storage.local.get(RATE_LIMIT_KEY);
  return (result[RATE_LIMIT_KEY] as RateLimitData) ?? null;
}

/**
 * Save rate limiting data to storage
 */
async function saveRateLimitData(data: RateLimitData): Promise<void> {
  if (!chrome?.storage?.local) {return;}
  await chrome.storage.local.set({ [RATE_LIMIT_KEY]: data });
}

/**
 * Clear rate limiting data (when window expires)
 */
async function clearRateLimitData(): Promise<void> {
  if (!chrome?.storage?.local) {return;}
  await chrome.storage.local.remove(RATE_LIMIT_KEY);
}

/**
 * Calculate text similarity (simple Jaccard similarity)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/** State shape for the nuclear mode challenge */
interface NuclearChallengeState {
  currentStep: ChallengeStep;
  durationHours: number;
  typedText: string;
  isPasting: boolean;
  typingStartTime: number | null;
  mathProblems: Array<{ question: string; answer: number }>;
  currentMathIndex: number;
  mathAnswer: string;
  mathErrors: number;
  cooldownSeconds: number;
  isActivating: boolean;
  error: string | null;
  isRateLimited: boolean;
  rateLimitMinutesRemaining: number;
}

/** Hook for nuclear challenge state and effects */
// eslint-disable-next-line max-lines-per-function
function useNuclearChallengeState(isOpen: boolean): {
  state: NuclearChallengeState;
  setState: {
    setCurrentStep: React.Dispatch<React.SetStateAction<ChallengeStep>>;
    setDurationHours: React.Dispatch<React.SetStateAction<number>>;
    setTypedText: React.Dispatch<React.SetStateAction<string>>;
    setIsPasting: React.Dispatch<React.SetStateAction<boolean>>;
    setTypingStartTime: React.Dispatch<React.SetStateAction<number | null>>;
    setMathProblems: React.Dispatch<React.SetStateAction<Array<{ question: string; answer: number }>>>;
    setCurrentMathIndex: React.Dispatch<React.SetStateAction<number>>;
    setMathAnswer: React.Dispatch<React.SetStateAction<string>>;
    setMathErrors: React.Dispatch<React.SetStateAction<number>>;
    setCooldownSeconds: React.Dispatch<React.SetStateAction<number>>;
    setIsActivating: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setIsRateLimited: React.Dispatch<React.SetStateAction<boolean>>;
    setRateLimitMinutesRemaining: React.Dispatch<React.SetStateAction<number>>;
  };
} {
  const [currentStep, setCurrentStep] = useState<ChallengeStep>('duration');
  const [durationHours, setDurationHours] = useState(2);
  const [typedText, setTypedText] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [mathProblems, setMathProblems] = useState<Array<{ question: string; answer: number }>>([]);
  const [currentMathIndex, setCurrentMathIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathErrors, setMathErrors] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(30);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMinutesRemaining, setRateLimitMinutesRemaining] = useState(0);

  // Check rate limiting on mount
  useEffect(() => {
    const checkRateLimit = async (): Promise<void> => {
      const data = await loadRateLimitData();
      if (!data) {return;}
      const now = Date.now();
      if (data.lockedUntil && data.lockedUntil > now) {
        setIsRateLimited(true);
        setRateLimitMinutesRemaining(Math.ceil((data.lockedUntil - now) / 60000));
      } else if (data.lockedUntil && data.lockedUntil <= now) {
        await clearRateLimitData();
        setIsRateLimited(false);
      } else if (now - data.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
        await clearRateLimitData();
      }
    };
    if (isOpen) {
      void checkRateLimit();
    }
  }, [isOpen]);

  // Update rate limit countdown
  useEffect(() => {
    if (isRateLimited && rateLimitMinutesRemaining > 0) {
      const timer = setInterval(() => {
        setRateLimitMinutesRemaining(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            void clearRateLimitData();
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [isRateLimited, rateLimitMinutesRemaining]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('duration');
      setDurationHours(2);
      setTypedText('');
      setMathProblems([]);
      setCurrentMathIndex(0);
      setMathAnswer('');
      setMathErrors(0);
      setCooldownSeconds(30);
      setError(null);
    }
  }, [isOpen]);

  // Initialize math problems when step changes to math
  useEffect(() => {
    if (currentStep === 'math' && mathProblems.length === 0) {
      const problems = Array.from({ length: 5 }, () => generateMathProblem());
      setMathProblems(problems);
    }
  }, [currentStep, mathProblems.length]);

  // Cooldown timer
  useEffect(() => {
    if (currentStep === 'cooldown' && cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentStep === 'cooldown' && cooldownSeconds === 0) {
      setCurrentStep('confirm');
    }
    return undefined;
  }, [currentStep, cooldownSeconds]);

  return {
    state: {
      currentStep, durationHours, typedText, isPasting, typingStartTime,
      mathProblems, currentMathIndex, mathAnswer, mathErrors, cooldownSeconds,
      isActivating, error, isRateLimited, rateLimitMinutesRemaining,
    },
    setState: {
      setCurrentStep, setDurationHours, setTypedText, setIsPasting, setTypingStartTime,
      setMathProblems, setCurrentMathIndex, setMathAnswer, setMathErrors, setCooldownSeconds,
      setIsActivating, setError, setIsRateLimited, setRateLimitMinutesRemaining,
    },
  };
}

/** Record a failed attempt and update rate limit state */
async function recordFailedAttempt(
  setIsRateLimited: React.Dispatch<React.SetStateAction<boolean>>,
  setRateLimitMinutesRemaining: React.Dispatch<React.SetStateAction<number>>,
): Promise<void> {
  const now = Date.now();
  const existing = await loadRateLimitData();

  let data: RateLimitData;

  if (!existing || now - existing.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
    data = { failedAttempts: 1, firstAttemptTime: now, lockedUntil: null };
  } else {
    data = { ...existing, failedAttempts: existing.failedAttempts + 1 };
    if (data.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      data.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
    }
  }

  await saveRateLimitData(data);

  if (data.lockedUntil && data.lockedUntil > now) {
    setIsRateLimited(true);
    setRateLimitMinutesRemaining(Math.ceil((data.lockedUntil - now) / 60000));
  }
}

/** Premium upsell content */
function PremiumUpsellContent({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <>
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="nuclear-mode-title" className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              Nuclear Mode
              <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">PREMIUM</span>
            </h2>
            <p className="text-sm text-neutral-600 mt-1">The ultimate distraction blocker</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-6">&#x1F512;</div>
          <h3 className="text-xl font-bold text-neutral-900 mb-3">Unlock Nuclear Mode</h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Need total focus? Nuclear Mode blocks absolutely everything for a set duration. No cancellations. No overrides. Pure productivity.
          </p>
          <PremiumFeatureList />
          <PremiumCallToAction />
        </div>
      </div>
    </>
  );
}

/** Premium feature list */
function PremiumFeatureList(): React.ReactElement {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8 text-left max-w-sm mx-auto">
      <h4 className="font-semibold text-text-primary mb-2">Focused Flow Pro includes:</h4>
      <ul className="space-y-2 text-sm text-text-secondary">
        <li className="flex items-center gap-2">&#x2705; Nuclear Mode (Unbreakable Block)</li>
        <li className="flex items-center gap-2">&#x2705; Unlimited Block Rules</li>
        <li className="flex items-center gap-2">&#x2705; Unlimited Schedules</li>
        <li className="flex items-center gap-2">&#x2705; Cross-Device Sync</li>
      </ul>
    </div>
  );
}

/** Premium call to action */
function PremiumCallToAction(): React.ReactElement {
  return (
    <>
      {!IS_PREMIUM_COMING_SOON ? (
        <Button variant="primary" size="lg" onClick={() => window.open('https://focusflow.app/pricing', '_blank')}>
          Upgrade to Pro
        </Button>
      ) : (
        <div className="flex flex-col items-center">
          <div className="px-6 py-3 bg-accent/10 border border-accent/20 rounded-lg text-accent font-medium">
            &#x2728; Pro Plan Coming Soon
          </div>
        </div>
      )}
      <p className="text-xs text-text-tertiary mt-4">
        {IS_PREMIUM_COMING_SOON ? 'Join the waitlist for early access!' : '30-day money-back guarantee'}
      </p>
    </>
  );
}

/** Modal header for premium users */
function PremiumModalHeader(): React.ReactElement {
  return (
    <div className="border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="nuclear-mode-title" className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            Nuclear Mode
          </h2>
          <p className="text-sm text-neutral-600 mt-1">Complete all challenges to activate unbreakable focus mode</p>
        </div>
      </div>
    </div>
  );
}

/** Rate limit warning banner */
function RateLimitWarning({ minutesRemaining }: { minutesRemaining: number }): React.ReactElement {
  return (
    <div
      role="alert"
      className="bg-warning-50 border border-warning-300 text-warning-800 px-4 py-4 rounded-md mb-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">&#x231B;</span>
        <div>
          <p className="font-semibold">Too many failed attempts</p>
          <p className="text-sm mt-1">
            Please wait {minutesRemaining} {minutesRemaining === 1 ? 'minute' : 'minutes'} before trying again.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Error message display */
function ErrorBanner({ error }: { error: string }): React.ReactElement {
  return (
    <div
      role="alert"
      className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm mb-4"
    >
      {error}
    </div>
  );
}

/** Step 1: Duration selection */
function DurationStep({ durationHours, setDurationHours, onNext }: {
  durationHours: number;
  setDurationHours: React.Dispatch<React.SetStateAction<number>>;
  onNext: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Step 1: Choose Duration</h3>
        <p className="text-sm text-neutral-600 mb-4">
          How long do you want to activate Nuclear Mode? You won&apos;t be able to disable it until the timer expires.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="duration-hours" className="block text-sm font-medium text-neutral-700">
          Duration (hours)
        </label>
        <input
          id="duration-hours"
          type="number"
          min="1"
          max="8"
          value={durationHours}
          onChange={(e) => setDurationHours(parseInt(e.target.value, 10) || 1)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-neutral-500">
          Choose between 1-8 hours. Recommended: 2-4 hours for deep work sessions.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onNext} className="w-full">
        Continue to Challenges
      </Button>
    </div>
  );
}

/** Step 2: Typing challenge */
function TypingStep({ typedText, setTypedText, onPaste, onNext, onBack, typingInputRef }: {
  typedText: string;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  onPaste: (e: React.ClipboardEvent) => void;
  onNext: () => void;
  onBack: () => void;
  typingInputRef: React.RefObject<HTMLTextAreaElement>;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Step 2: Commitment Challenge</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Type the following commitment text to prove your dedication (no copy-paste):
        </p>
      </div>
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 mb-4">
        <p className="text-sm text-neutral-700 leading-relaxed">{COMMITMENT_TEXT}</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="commitment-text" className="block text-sm font-medium text-neutral-700">
          Type the commitment:
        </label>
        <textarea
          id="commitment-text"
          ref={typingInputRef}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onPaste={onPaste}
          rows={6}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Start typing..."
        />
        <p className="text-xs text-neutral-500">
          Words typed: {typedText.trim().split(/\s+/).filter(w => w.length > 0).length} / 80 minimum
        </p>
      </div>
      <div className="flex space-x-3">
        <Button variant="secondary" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button variant="primary" size="md" onClick={onNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}

/** Step 3: Math challenge */
function MathStep({ mathProblems, currentMathIndex, mathAnswer, setMathAnswer, mathErrors, isRateLimited, onSubmit }: {
  mathProblems: Array<{ question: string; answer: number }>;
  currentMathIndex: number;
  mathAnswer: string;
  setMathAnswer: React.Dispatch<React.SetStateAction<string>>;
  mathErrors: number;
  isRateLimited: boolean;
  onSubmit: () => void;
}): React.ReactElement | null {
  if (!mathProblems[currentMathIndex]) {return null;}
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Step 3: Focus Challenge</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Solve {mathProblems.length} math problems to prove you&apos;re ready to focus (Problem {currentMathIndex + 1}/{mathProblems.length}):
        </p>
      </div>
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-8 text-center">
        <p className="text-4xl font-bold text-neutral-900 mb-6">
          {mathProblems[currentMathIndex]?.question} = ?
        </p>
        <input
          type="number"
          value={mathAnswer}
          onChange={(e) => setMathAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isRateLimited && onSubmit()}
          className="w-32 px-4 py-2 text-center text-2xl border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="?"
          autoFocus
          disabled={isRateLimited}
        />
      </div>
      <p className="text-sm text-neutral-500 text-center">Errors: {mathErrors} / 3 allowed</p>
      <Button variant="primary" size="md" onClick={onSubmit} className="w-full" disabled={isRateLimited}>
        Submit Answer
      </Button>
    </div>
  );
}

/** Step 4: Cooldown display */
function CooldownStep({ cooldownSeconds }: { cooldownSeconds: number }): React.ReactElement {
  return (
    <div className="space-y-4 text-center py-8">
      <div className="text-6xl mb-4">&#x231B;</div>
      <h3 className="text-lg font-semibold text-neutral-900">Cooling Off Period</h3>
      <p className="text-sm text-neutral-600">Take a moment to prepare yourself for deep work...</p>
      <div className="text-5xl font-bold text-primary-600 my-8">{cooldownSeconds}s</div>
      <p className="text-xs text-neutral-500">
        Nuclear Mode will be ready to activate in {cooldownSeconds} seconds
      </p>
    </div>
  );
}

/** Step 5: Final confirmation */
function ConfirmStep({ durationHours, isActivating, onActivate, onClose }: {
  durationHours: number;
  isActivating: boolean;
  onActivate: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-6xl mb-4">&#x2705;</div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Ready to Activate</h3>
        <p className="text-sm text-neutral-600">
          You&apos;re about to activate Nuclear Mode for <strong>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</strong>.
        </p>
        <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mt-4">
          <p className="text-sm text-warning-800 font-medium">
            &#x26A0;&#xFE0F; Warning: You cannot disable Nuclear Mode until the timer expires. Settings will be locked.
          </p>
        </div>
      </div>
      <div className="flex space-x-3">
        <Button variant="secondary" size="md" onClick={onClose} disabled={isActivating} className="flex-1">
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={onActivate} disabled={isActivating} className="flex-1">
          {isActivating ? 'Activating...' : `Activate for ${durationHours}h`}
        </Button>
      </div>
    </div>
  );
}

/** Premium challenge steps content */
// eslint-disable-next-line max-lines-per-function, complexity
function ChallengeContent({ state, setState, onClose, onActivate, typingInputRef }: {
  state: NuclearChallengeState;
  setState: ReturnType<typeof useNuclearChallengeState>['setState'];
  onClose: () => void;
  onActivate: () => void;
  typingInputRef: React.RefObject<HTMLTextAreaElement>;
}): React.ReactElement {
  const handleDurationNext = (): void => {
    if (state.durationHours < 1 || state.durationHours > 8) {
      setState.setError('Duration must be between 1 and 8 hours');
      return;
    }
    setState.setError(null);
    setState.setCurrentStep('typing');
    setState.setTypingStartTime(Date.now());
  };

  const handleTypingNext = (): void => {
    validateTypingChallenge(state, setState);
  };

  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault();
    setState.setIsPasting(true);
    setState.setError('Copy-paste is not allowed. Please type the text manually.');
  };

  const handleMathSubmit = (): void => {
    processMathSubmission(state, setState);
  };

  return (
    <>
      <PremiumModalHeader />
      <div className="px-6 py-6">
        {state.isRateLimited && <RateLimitWarning minutesRemaining={state.rateLimitMinutesRemaining} />}
        {state.error && !state.isRateLimited && <ErrorBanner error={state.error} />}
        {state.currentStep === 'duration' && (
          <DurationStep durationHours={state.durationHours} setDurationHours={setState.setDurationHours} onNext={handleDurationNext} />
        )}
        {state.currentStep === 'typing' && (
          <TypingStep typedText={state.typedText} setTypedText={setState.setTypedText} onPaste={handlePaste} onNext={handleTypingNext} onBack={() => setState.setCurrentStep('duration')} typingInputRef={typingInputRef} />
        )}
        {state.currentStep === 'math' && state.mathProblems[state.currentMathIndex] && (
          <MathStep mathProblems={state.mathProblems} currentMathIndex={state.currentMathIndex} mathAnswer={state.mathAnswer} setMathAnswer={setState.setMathAnswer} mathErrors={state.mathErrors} isRateLimited={state.isRateLimited} onSubmit={handleMathSubmit} />
        )}
        {state.currentStep === 'cooldown' && <CooldownStep cooldownSeconds={state.cooldownSeconds} />}
        {state.currentStep === 'confirm' && (
          <ConfirmStep durationHours={state.durationHours} isActivating={state.isActivating} onActivate={onActivate} onClose={onClose} />
        )}
        {state.currentStep !== 'confirm' && state.currentStep !== 'cooldown' && (
          <div className="border-t border-neutral-200 px-6 py-4">
            <Button variant="secondary" size="sm" onClick={onClose} className="w-full">Cancel</Button>
          </div>
        )}
      </div>
    </>
  );
}

/** Validate typing challenge input */
function validateTypingChallenge(
  state: NuclearChallengeState,
  setState: ReturnType<typeof useNuclearChallengeState>['setState'],
): void {
  const trimmedText = state.typedText.trim();
  const wordCount = trimmedText.split(/\s+/).length;
  const timeTaken = state.typingStartTime ? Date.now() - state.typingStartTime : 0;

  if (wordCount < 80) {
    setState.setError(`Please type at least 80 words. Current: ${wordCount} words`);
    return;
  }
  if (timeTaken < 30000) {
    setState.setError('Please take your time and type the commitment thoughtfully');
    return;
  }
  const similarity = calculateSimilarity(trimmedText.toLowerCase(), COMMITMENT_TEXT.toLowerCase());
  if (similarity < 0.7) {
    setState.setError('Please type the commitment text as shown');
    return;
  }
  if (state.isPasting) {
    setState.setError('Copy-paste detected. Please type the text manually');
    return;
  }
  setState.setError(null);
  setState.setCurrentStep('math');
}

/** Process math answer submission */
function processMathSubmission(
  state: NuclearChallengeState,
  setState: ReturnType<typeof useNuclearChallengeState>['setState'],
): void {
  if (state.isRateLimited) {
    setState.setError(`Too many failed attempts. Try again in ${state.rateLimitMinutesRemaining} minutes.`);
    return;
  }

  const currentProblem = state.mathProblems[state.currentMathIndex];
  if (!currentProblem) { return; }

  const userAnswer = parseInt(state.mathAnswer, 10);

  if (isNaN(userAnswer)) {
    setState.setError('Please enter a valid number');
    return;
  }

  if (userAnswer !== currentProblem.answer) {
    handleIncorrectAnswer(state, setState);
    return;
  }

  // Correct answer
  setState.setError(null);
  setState.setMathAnswer('');

  if (state.currentMathIndex < state.mathProblems.length - 1) {
    setState.setCurrentMathIndex(state.currentMathIndex + 1);
  } else {
    setState.setCurrentStep('cooldown');
  }
}

/** Handle incorrect math answer */
function handleIncorrectAnswer(
  state: NuclearChallengeState,
  setState: ReturnType<typeof useNuclearChallengeState>['setState'],
): void {
  setState.setMathErrors(state.mathErrors + 1);
  void recordFailedAttempt(setState.setIsRateLimited, setState.setRateLimitMinutesRemaining);

  if (state.mathErrors + 1 >= 3) {
    setState.setError('Too many errors. Please start over.');
    setTimeout(() => {
      setState.setCurrentStep('duration');
      setState.setMathProblems([]);
      setState.setCurrentMathIndex(0);
      setState.setMathErrors(0);
      setState.setMathAnswer('');
    }, 2000);
    return;
  }
  setState.setError(`Incorrect. ${3 - state.mathErrors - 1} attempts remaining`);
  setState.setMathAnswer('');
}

export const NuclearModeModal: React.FC<NuclearModeModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  isPremium,
}) => {
  const { state, setState } = useNuclearChallengeState(isOpen);
  const typingInputRef = useRef<HTMLTextAreaElement>(null);

  const handleActivate = (): void => {
    setState.setIsActivating(true);
    setState.setError(null);
    onActivate(state.durationHours)
      .then(() => { onClose(); })
      .catch((err: unknown) => {
        setState.setError(err instanceof Error ? err.message : 'Failed to activate Nuclear Mode');
      })
      .finally(() => { setState.setIsActivating(false); });
  };

  if (!isOpen) { return null; }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuclear-mode-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {!isPremium ? (
          <PremiumUpsellContent onClose={onClose} />
        ) : (
          <ChallengeContent state={state} setState={setState} onClose={onClose} onActivate={handleActivate} typingInputRef={typingInputRef} />
        )}
      </div>
    </div>
  );
};
