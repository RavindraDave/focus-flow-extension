/**
 * Onboarding Page - Welcome and User Guide
 * Comprehensive introduction to Focus Flow features
 */

import React, { useState } from 'react';
import { Button } from '../components/atoms/Button';

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
    title: 'Pomodoro Timer',
    description: 'Work in focused 25-minute sessions followed by short breaks. After 4 sessions, take a longer break. Click the extension icon to start your first timer!',
    icon: '⏱️',
  },
  {
    title: 'Block Distracting Websites',
    description: 'Add websites to your blocklist to prevent distractions during work sessions. Go to Settings to manage your block rules.',
    icon: '🚫',
  },
  {
    title: 'Nuclear Mode',
    description: 'Need extreme focus? Activate Nuclear Mode to block ALL distracting sites for 1-8 hours. This cannot be undone until the time expires!',
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
    chrome.storage.local.set({ onboardingCompleted: true });
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">Focus Flow</h1>
          <p className="text-primary-100">Your productivity companion</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-neutral-100 h-2">
          <div
            className="bg-gradient-to-r from-primary-600 to-secondary-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">{step.title}</h2>
            <p className="text-lg text-neutral-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Quick Tips Section */}
          {currentStep === 1 && (
            <div className="mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">💡 Quick Tips:</h3>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li>• Default work session: 25 minutes</li>
                <li>• Short break: 5 minutes</li>
                <li>• Long break (after 4 sessions): 15 minutes</li>
                <li>• Customize durations in Settings</li>
              </ul>
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-8 bg-warning-50 border border-warning-200 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">🎯 How to Block Websites:</h3>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li>1. Click the extension icon</li>
                <li>2. Click "Settings & Analytics"</li>
                <li>3. Go to "Blocking" tab</li>
                <li>4. Add domains like "youtube.com" or "reddit.com"</li>
                <li>5. Sites are blocked only during work sessions</li>
              </ul>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mt-8 bg-error-50 border border-error-200 rounded-lg p-6">
              <h3 className="font-semibold text-error-900 mb-3">⚠️ Important Warning:</h3>
              <p className="text-sm text-error-800">
                Nuclear Mode CANNOT be deactivated once started. Use this feature only when you need maximum focus and commitment.
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="mt-8 bg-success-50 border border-success-200 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-900 mb-3">📚 Additional Resources:</h3>
              <ul className="space-y-2 text-sm text-neutral-700">
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
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary-600 w-8'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-neutral-50 px-12 py-6 flex justify-between items-center border-t">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Previous
          </Button>

          <span className="text-sm text-neutral-500">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>

          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <Button variant="primary" onClick={handleNext}>
              Next →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleGetStarted}>
              Get Started 🚀
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
