/**
 * Onboarding Page - Welcome and User Guide
 * Comprehensive introduction to Focus Flow features
 */

import React, { useState } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import { ThemeMode } from '../hooks/useTheme';

interface Step {
  title: string;
  description: string;
  icon: string;
}

const ONBOARDING_STEPS: Step[] = [
  {
    title: 'Welcome to Focus Flow',
    description: 'Focus Flow helps you stay productive with the Pomodoro technique, website blocking, and focus tracking.',
    icon: '🎯',
  },
  {
    title: 'Choose Your Theme',
    description: 'Personalize your experience. Choose a theme that fits your style and helps you focus.',
    icon: '🎨',
  },
  {
    title: 'Pomodoro Timer',
    description: 'Work in focused 25-minute sessions followed by short breaks. After 4 sessions, take a longer break. Click the extension icon to start your first timer!',
    icon: '⏱️',
  },
  {
    title: 'Block Distracting Websites',
    description: 'Add websites to your blocklist to prevent distractions during work sessions. Choose from 100+ pre-suggested popular sites or add your own custom rules.',
    icon: '🚫',
  },
  {
    title: 'Nuclear Mode (Premium)',
    description: 'Need extreme focus? Activate Nuclear Mode to block ALL distracting sites for 1-8 hours. Upgrade to Pro to unlock this unbreakable focus tool!',
    icon: '🚀',
  },
  {
    title: 'Track Your Progress',
    description: 'View your focus time, completed pomodoros, and maintain daily streaks. All analytics are private and stored locally.',
    icon: '📊',
  },
  {
    title: 'Schedule Blocking',
    description: 'Create schedules to automatically block websites at specific times. Perfect for establishing daily routines.',
    icon: '📅',
  },
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { theme, setTheme } = useThemeContext();

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetStarted = () => {
    // Mark onboarding as completed
    // Mark onboarding as completed (sync with popup logic)
    chrome.storage.sync.set({ has_onboarded: true });
    // Close the onboarding tab
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  };

  const step: Step = ONBOARDING_STEPS[currentStep] ?? ONBOARDING_STEPS[0]!;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 transition-colors duration-300 overflow-x-hidden">
      <div className="max-w-4xl w-full bg-surface rounded-2xl shadow-2xl overflow-hidden border border-border transition-colors duration-300">
        {/* Header */}
        <div className="bg-bg-secondary border-b border-border p-8 transition-colors duration-300">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Focus Flow</h1>
          <p className="text-text-secondary">Your productivity companion</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-bg-secondary h-2">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">{step.title}</h2>
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">{step.description}</p>
          </div>

          {/* Theme Selection Section */}
          {currentStep === 1 && (
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {(['modern', 'zen', 'cyber'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === mode
                    ? 'border-accent bg-accent/10 scale-105'
                    : 'border-border hover:border-accent/50 bg-bg-secondary'
                    }`}
                >
                  <div className={`h-20 rounded-lg mb-3 ${mode === 'modern' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                    mode === 'zen' ? 'bg-gradient-to-br from-stone-200 to-stone-400' :
                      'bg-gradient-to-br from-slate-900 to-cyan-500'
                    }`} />
                  <div className="font-medium capitalize text-text-primary">
                    {mode}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Tips Section */}
          {currentStep === 2 && (
            <div className="mt-8 bg-bg-secondary border border-border rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-text-primary mb-3">💡 Quick Tips:</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Default work session: 25 minutes</li>
                <li>• Short break: 5 minutes</li>
                <li>• Long break (after 4 sessions): 15 minutes</li>
                <li>• Customize durations in Settings</li>
              </ul>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mt-8 bg-warning/10 border border-warning/20 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-text-primary mb-3">🎯 How to Block Websites:</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>1. Click the extension icon</li>
                <li>2. Click "Settings & Analytics"</li>
                <li>3. Go to "Block List" tab</li>
                <li>4. <strong>Quick Add:</strong> Browse 100+ suggested sites organized by category</li>
                <li>5. Or add custom domains like "youtube.com" or "reddit.com"</li>
                <li>6. Sites are blocked only during work sessions</li>
              </ul>
            </div>
          )}

          {currentStep === 4 && (
            <div className="mt-8 bg-error/10 border border-error/20 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-error mb-3">⚠️ Premium Feature:</h3>
              <p className="text-sm text-error/90">
                Nuclear Mode is available for Pro users. It blocks everything and CANNOT be deactivated once started.
              </p>
            </div>
          )}

          {currentStep === 6 && (
            <div className="mt-8 bg-success/10 border border-success/20 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-text-primary mb-3">📚 Additional Resources:</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• All your data is stored locally and private</li>
                <li>• Export your analytics anytime</li>
                <li>• Customize themes in Settings</li>
                <li>• Enable/disable notifications</li>
              </ul>
            </div>
          )}

          {/* Step Counter */}
          <div className="mt-8 flex justify-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                  ? 'bg-accent w-8'
                  : 'bg-border hover:bg-border-secondary'
                  }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-bg-secondary px-12 py-6 flex justify-between items-center border-t border-border transition-colors duration-300">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            ← Previous
          </button>

          <span className="text-sm text-text-secondary font-medium">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>

          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleGetStarted}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Get Started 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
