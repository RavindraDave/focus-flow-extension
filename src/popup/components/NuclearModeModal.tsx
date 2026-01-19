/**
 * NuclearModeModal - Challenge-based activation for Nuclear Mode
 * Implements PRD Section 1.3 (FR-NO-001, FR-NO-002)
 * WCAG 2.1 AA compliant
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/atoms/Button';
import { IS_PREMIUM_COMING_SOON } from '../../utils/constants';

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

export const NuclearModeModal: React.FC<NuclearModeModalProps> = ({
  isOpen,
  onClose,
  onActivate,
  isPremium,
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<ChallengeStep>('duration');
  const [durationHours, setDurationHours] = useState(2);

  // Typing challenge state
  const [typedText, setTypedText] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);

  // Math challenge state
  const [mathProblems, setMathProblems] = useState<Array<{ question: string; answer: number }>>([]);
  const [currentMathIndex, setCurrentMathIndex] = useState(0);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathErrors, setMathErrors] = useState(0);

  // Cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState(30);

  // Loading state
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typingInputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Reset modal state when closed
   */
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

  /**
   * Initialize math problems when step changes to math
   */
  useEffect(() => {
    if (currentStep === 'math' && mathProblems.length === 0) {
      const problems = Array.from({ length: 5 }, () => generateMathProblem());
      setMathProblems(problems);
    }
  }, [currentStep, mathProblems.length]);

  /**
   * Cooldown timer
   */
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

  /**
   * Handle duration selection
   */
  const handleDurationNext = (): void => {
    if (durationHours < 1 || durationHours > 8) {
      setError('Duration must be between 1 and 8 hours');
      return;
    }
    setError(null);
    setCurrentStep('typing');
    setTypingStartTime(Date.now());
  };

  /**
   * Handle typing challenge
   */
  const handleTypingNext = (): void => {
    const trimmedText = typedText.trim();
    const wordCount = trimmedText.split(/\s+/).length;
    const timeTaken = typingStartTime ? Date.now() - typingStartTime : 0;

    // Must be at least 80 words (allowing some flexibility)
    if (wordCount < 80) {
      setError(`Please type at least 80 words. Current: ${wordCount} words`);
      return;
    }

    // Must take at least 30 seconds (prevent copy-paste)
    if (timeTaken < 30000) {
      setError('Please take your time and type the commitment thoughtfully');
      return;
    }

    // Check similarity to commitment text
    const similarity = calculateSimilarity(trimmedText.toLowerCase(), COMMITMENT_TEXT.toLowerCase());
    if (similarity < 0.7) {
      setError('Please type the commitment text as shown');
      return;
    }

    if (isPasting) {
      setError('Copy-paste detected. Please type the text manually');
      return;
    }

    setError(null);
    setCurrentStep('math');
  };

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  };

  /**
   * Handle paste detection
   */
  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault();
    setIsPasting(true);
    setError('Copy-paste is not allowed. Please type the text manually.');
  };

  /**
   * Handle math answer submission
   */
  const handleMathSubmit = (): void => {
    const currentProblem = mathProblems[currentMathIndex];
    if (!currentProblem) { return; }

    const userAnswer = parseInt(mathAnswer, 10);

    if (isNaN(userAnswer)) {
      setError('Please enter a valid number');
      return;
    }

    if (userAnswer !== currentProblem.answer) {
      setMathErrors(mathErrors + 1);
      if (mathErrors + 1 >= 3) {
        setError('Too many errors. Please start over.');
        setTimeout(() => {
          setCurrentStep('duration');
          setMathProblems([]);
          setCurrentMathIndex(0);
          setMathErrors(0);
          setMathAnswer('');
        }, 2000);
        return;
      }
      setError(`Incorrect. ${3 - mathErrors - 1} attempts remaining`);
      setMathAnswer('');
      return;
    }

    // Correct answer
    setError(null);
    setMathAnswer('');

    if (currentMathIndex < mathProblems.length - 1) {
      setCurrentMathIndex(currentMathIndex + 1);
    } else {
      // All problems solved
      setCurrentStep('cooldown');
    }
  };

  /**
   * Handle final activation
   */
  const handleActivate = async (): Promise<void> => {
    try {
      setIsActivating(true);
      setError(null);
      await onActivate(durationHours);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate Nuclear Mode');
    } finally {
      setIsActivating(false);
    }
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
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="nuclear-mode-title" className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                🚀 Nuclear Mode
                {!isPremium && <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">PREMIUM</span>}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {isPremium ? 'Complete all challenges to activate unbreakable focus mode' : 'The ultimate distraction blocker'}
              </p>
            </div>
            {!isPremium && (
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {!isPremium ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🔒</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                Unlock Nuclear Mode
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Need total focus? Nuclear Mode blocks absolutely everything for a set duration. No cancellations. No overrides. Pure productivity.
              </p>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8 text-left max-w-sm mx-auto">
                <h4 className="font-semibold text-text-primary mb-2">Focused Flow Pro includes:</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">✅ Nuclear Mode (Unbreakable Block)</li>
                  <li className="flex items-center gap-2">✅ Unlimited Block Rules</li>
                  <li className="flex items-center gap-2">✅ Unlimited Schedules</li>
                  <li className="flex items-center gap-2">✅ Cross-Device Sync</li>
                </ul>
              </div>

              {!IS_PREMIUM_COMING_SOON ? (
                <Button variant="primary" size="lg" onClick={() => window.open('https://focusflow.app/pricing', '_blank')}>
                  Upgrade to Pro
                </Button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="px-6 py-3 bg-accent/10 border border-accent/20 rounded-lg text-accent font-medium">
                    ✨ Pro Plan Coming Soon
                  </div>
                </div>
              )}

              <p className="text-xs text-text-tertiary mt-4">
                {IS_PREMIUM_COMING_SOON ? 'Join the waitlist for early access!' : '30-day money-back guarantee'}
              </p>
            </div>
          ) : (
            <>
              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm mb-4"
                >
                  {error}
                </div>
              )}

              {/* Step 1: Duration Selection */}
              {currentStep === 'duration' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Step 1: Choose Duration
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      How long do you want to activate Nuclear Mode? You won't be able to disable it until the timer expires.
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

                  <Button variant="primary" size="md" onClick={handleDurationNext} className="w-full">
                    Continue to Challenges
                  </Button>
                </div>
              )}

              {/* Step 2: Typing Challenge */}
              {currentStep === 'typing' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Step 2: Commitment Challenge
                    </h3>
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
                      onPaste={handlePaste}
                      rows={6}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Start typing..."
                    />
                    <p className="text-xs text-neutral-500">
                      Words typed: {typedText.trim().split(/\s+/).filter(w => w.length > 0).length} / 80 minimum
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="secondary" size="md" onClick={() => setCurrentStep('duration')} className="flex-1">
                      Back
                    </Button>
                    <Button variant="primary" size="md" onClick={handleTypingNext} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Math Challenge */}
              {currentStep === 'math' && mathProblems[currentMathIndex] && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Step 3: Focus Challenge
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Solve {mathProblems.length} math problems to prove you're ready to focus (Problem {currentMathIndex + 1}/{mathProblems.length}):
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
                      onKeyDown={(e) => e.key === 'Enter' && handleMathSubmit()}
                      className="w-32 px-4 py-2 text-center text-2xl border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="?"
                      autoFocus
                    />
                  </div>

                  <p className="text-sm text-neutral-500 text-center">
                    Errors: {mathErrors} / 3 allowed
                  </p>

                  <Button variant="primary" size="md" onClick={handleMathSubmit} className="w-full">
                    Submit Answer
                  </Button>
                </div>
              )}

              {/* Step 4: Cooldown */}
              {currentStep === 'cooldown' && (
                <div className="space-y-4 text-center py-8">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Cooling Off Period
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Take a moment to prepare yourself for deep work...
                  </p>
                  <div className="text-5xl font-bold text-primary-600 my-8">
                    {cooldownSeconds}s
                  </div>
                  <p className="text-xs text-neutral-500">
                    Nuclear Mode will be ready to activate in {cooldownSeconds} seconds
                  </p>
                </div>
              )}

              {/* Step 5: Final Confirmation */}
              {currentStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Ready to Activate
                    </h3>
                    <p className="text-sm text-neutral-600">
                      You're about to activate Nuclear Mode for <strong>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</strong>.
                    </p>
                    <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mt-4">
                      <p className="text-sm text-warning-800 font-medium">
                        ⚠️ Warning: You cannot disable Nuclear Mode until the timer expires. Settings will be locked.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="secondary" size="md" onClick={onClose} disabled={isActivating} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleActivate}
                      disabled={isActivating}
                      className="flex-1"
                    >
                      {isActivating ? 'Activating...' : `Activate for ${durationHours}h`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer - Cancel button (not on confirm step) */}
              {currentStep !== 'confirm' && currentStep !== 'cooldown' && (
                <div className="border-t border-neutral-200 px-6 py-4">
                  <Button variant="secondary" size="sm" onClick={onClose} className="w-full">
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
