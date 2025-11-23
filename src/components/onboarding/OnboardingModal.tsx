/**
 * Onboarding Modal Component
 *
 * Shows on first run to help users:
 * - Choose their preferred visual theme
 * - Understand key features
 * - Get started quickly
 */

import React, { useState } from 'react';

export type ThemeMode = 'modern' | 'zen' | 'cyber';

interface OnboardingModalProps {
  onComplete: (selectedTheme: ThemeMode) => void;
  suggestedTheme: ThemeMode;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  suggestedTheme,
}) => {
  const [step, setStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(suggestedTheme);

  const themes: Array<{
    id: ThemeMode;
    name: string;
    description: string;
    gradient: string;
    icon: string;
  }> = [
    {
      id: 'modern',
      name: 'Modern Pro',
      description: 'Clean, minimal, and professional',
      gradient: 'from-slate-900 to-indigo-900',
      icon: '💼',
    },
    {
      id: 'zen',
      name: 'Zen Mode',
      description: 'Organic, calming, and peaceful',
      gradient: 'from-[#F4EBD0] to-[#5F8D4E]',
      icon: '🍃',
    },
    {
      id: 'cyber',
      name: 'Cyber Focus',
      description: 'Neon, futuristic, and intense',
      gradient: 'from-black via-[#00F0FF] to-[#FF0099]',
      icon: '⚡',
    },
  ];

  const steps = [
    {
      title: 'Welcome to Focus Flow! 🎯',
      content: (
        <div>
          <p className="text-text-secondary mb-4">
            Your personal productivity companion with Pomodoro timer, website blocking, and focus tracking.
          </p>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li className="flex items-start">
              <span className="text-accent mr-2">✓</span>
              <span>Customizable Pomodoro timer with breaks</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-2">✓</span>
              <span>Block distracting websites during focus sessions</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-2">✓</span>
              <span>Track your productivity with analytics</span>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-2">✓</span>
              <span>Three beautiful themes to match your style</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Choose Your Visual Theme 🎨',
      content: (
        <div>
          <p className="text-text-secondary mb-6">
            Pick the theme that matches your workflow. You can change this anytime in settings.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-accent bg-accent/10 shadow-lg'
                    : 'border-border hover:border-border-secondary'
                }`}
              >
                <div
                  className={`w-full h-20 bg-gradient-to-br ${theme.gradient} rounded-lg mb-3`}
                ></div>
                <div className="text-2xl mb-2">{theme.icon}</div>
                <h4 className="font-semibold text-text-primary text-sm">
                  {theme.name}
                </h4>
                <p className="text-xs text-text-tertiary mt-1">
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
          {suggestedTheme === selectedTheme && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
              <p className="text-sm text-text-secondary">
                <span className="text-accent font-semibold">Recommended</span> based on your system preferences
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Quick Start Guide 📚',
      content: (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-accent text-text-inverse rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">Click the Extension Icon</h4>
              <p className="text-sm text-text-tertiary">
                Access the timer popup to start/pause focus sessions
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-accent text-text-inverse rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">Block Distracting Sites</h4>
              <p className="text-sm text-text-tertiary">
                Go to Settings → Blocking Rules to add sites to block
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-accent text-text-inverse rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">Start Your First Session</h4>
              <p className="text-sm text-text-tertiary">
                Default: 25 minutes focus + 5 minute break. Customize in Timer Settings.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-bg-secondary rounded-lg">
            <h4 className="font-semibold text-text-primary mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-text-tertiary">
              Use <kbd className="px-2 py-1 bg-bg-primary rounded text-xs">Nuclear Mode</kbd> on the Dashboard for instant site blocking when you need maximum focus.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(selectedTheme);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-primary rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-accent-hover p-6 text-white">
          <h2 className="text-3xl font-bold font-serif">{steps[step]?.title}</h2>
          <div className="mt-4 flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px]">{steps[step]?.content}</div>

        {/* Footer */}
        <div className="p-6 bg-bg-secondary flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="text-sm text-text-tertiary">
            Step {step + 1} of {steps.length}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-accent hover:bg-accent-hover text-text-inverse rounded-lg font-semibold transition shadow-lg"
          >
            {step === steps.length - 1 ? 'Get Started 🚀' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
