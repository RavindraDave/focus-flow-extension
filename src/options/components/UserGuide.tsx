/**
 * UserGuide Component
 * Comprehensive documentation and premium features showcase
 * WCAG 2.1 AA compliant
 */

import React, { useState } from 'react';
import { Button } from '../../components/atoms/Button';
import { IS_PREMIUM_COMING_SOON } from '../../utils/constants';

type GuideSection = 'start' | 'features' | 'tips' | 'premium';

/**
 * UserGuide Component
 */
export const UserGuide: React.FC = () => {
    const [activeSection, setActiveSection] = useState<GuideSection>('start');



    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl font-bold text-text-primary tracking-tight">
                    How to Master Your Focus
                </h1>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Everything you need to know about using Focus Flow to reclaim your attention and boost productivity.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveSection('start')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
            ${activeSection === 'start'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                >
                    Getting Started
                </button>
                <button
                    onClick={() => setActiveSection('features')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
            ${activeSection === 'features'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                >
                    Core Features
                </button>
                <button
                    onClick={() => setActiveSection('tips')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
            ${activeSection === 'tips'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                >
                    Pro Tips
                </button>
                <button
                    onClick={() => setActiveSection('premium')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2
            ${activeSection === 'premium'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                        }`}
                >
                    <span>✨ Premium</span>
                </button>
            </div>

            {/* Getting Started Section */}
            {activeSection === 'start' && (
                <div className="space-y-8 animate-fadeIn">
                    <Section title="Installation & Setup" icon="🚀">
                        <p className="mb-4">
                            Focus Flow is designed to work right out of the box. Once installed, pin the extension to your browser toolbar for quick access.
                        </p>
                        <div className="bg-bg-secondary p-4 rounded-lg border border-border">
                            <h4 className="font-semibold mb-2">Why do we need permissions?</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                                <li><strong>Read and change all your data on websites:</strong> Required to block distracting sites and inject the "Focus Mode" overlay. We never collect or sell your browsing history.</li>
                                <li><strong>Storage:</strong> To save your settings, schedules, and blocking rules locally.</li>
                                <li><strong>Notifications:</strong> To alert you when a timer session ends.</li>
                            </ul>
                        </div>
                    </Section>

                    <Section title="Quick Start Guide" icon="⚡">
                        <ol className="list-decimal list-inside space-y-4 text-text-secondary">
                            <li className="pl-2"><span className="font-medium text-text-primary">Set a Timer:</span> Open the popup, choose a duration (e.g., 25 min), and hit Start.</li>
                            <li className="pl-2"><span className="font-medium text-text-primary">Add Block Rules:</span> Go to Options &gt; Blocking Rules. Add sites like `facebook.com` or `twitter.com`.</li>
                            <li className="pl-2"><span className="font-medium text-text-primary">Focus:</span> While the timer is running, those sites will be blocked. Get to work!</li>
                        </ol>
                    </Section>
                </div>
            )}

            {/* Core Features Section */}
            {activeSection === 'features' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FeatureCard
                            title="Pomodoro Timer"
                            icon="⏱️"
                            description="Customize your work/break intervals. The classic technique is 25m work / 5m break, but you can adjust this in Settings."
                        />
                        <FeatureCard
                            title="Website Blocking"
                            icon="🛡️"
                            description="Create powerful blocking rules. Use 'Strict Blocking' to prevent disabling rules during a session."
                        />
                        <FeatureCard
                            title="Analytics"
                            icon="bar_chart"
                            description="Track your focus time and see which days you are most productive. Visualize your streak to stay motivated."
                        />
                        <FeatureCard
                            title="Schedules"
                            icon="📅"
                            description="Automate your focus. Set up 'Work Hours' to automatically block social media from 9 AM to 5 PM."
                        />
                    </div>

                    <Section title="Blocking Modes" icon="🔒">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-text-primary">Standard Blocking</h4>
                                <p className="text-text-secondary">Blocks sites only when a timer is running. Great for Pomodoro users.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary">Always Block</h4>
                                <p className="text-text-secondary">Sites are blocked 24/7. Good for permanently removing distractions.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary">Schedule Blocking</h4>
                                <p className="text-text-secondary">Sites are blocked only during specific times/days defined in your Schedules.</p>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {/* Pro Tips Section */}
            {activeSection === 'tips' && (
                <div className="space-y-8 animate-fadeIn">
                    <Section title="Strict Blocking" icon="😤">
                        <p className="mb-4">
                            Find yourself disabling the extension when you want to cheat? Turn on <strong>Strict Blocking</strong> in the Dashboard.
                        </p>
                        <div className="bg-error/10 border border-error/20 p-4 rounded-lg text-error-800">
                            <p className="font-medium">Warning:</p>
                            <p className="text-sm">Strict Mode prevents you from accessing settings or disabling the extension while a timer is active. Use with caution!</p>
                        </div>
                    </Section>

                    <Section title="Mastering Block Rules" icon="🧠">
                        <p className="mb-4">
                            Did you know you can block entire categories of sites with just one rule? This is perfect for the free plan limit!
                        </p>
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-3">
                            <div>
                                <h4 className="font-bold text-primary-700">Use Wildcards (*)</h4>
                                <p className="text-sm text-text-secondary">
                                    <code>*.news</code> blocks 'bbc.news', 'cnn.news', etc.<br />
                                    <code>*social*</code> blocks any URL containing 'social'.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-primary-700">Use Keywords</h4>
                                <p className="text-sm text-text-secondary">
                                    Just typing <code>reddit</code> matches any domain containing 'reddit'.
                                </p>
                            </div>
                        </div>
                    </Section>



                    <Section title="Keyboard Shortcuts" icon="⌨️">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between items-center bg-bg-secondary p-3 rounded">
                                <span>Open Popup</span>
                                <kbd className="bg-surface px-2 py-1 rounded border border-border border-b-2">Alt+Shift+F</kbd>
                            </div>
                            <div className="flex justify-between items-center bg-bg-secondary p-3 rounded">
                                <span>Start/Stop Timer</span>
                                <kbd className="bg-surface px-2 py-1 rounded border border-border border-b-2">Alt+Shift+P</kbd>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {/* Premium Showcase Section */}
            {activeSection === 'premium' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-8 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">✨</div>

                        <div className="relative z-10 text-center mb-10">
                            <h2 className="text-3xl font-bold mb-4">Unlock Your Full Potential</h2>
                            <p className="text-neutral-300 max-w-xl mx-auto">
                                {IS_PREMIUM_COMING_SOON
                                    ? "We are building the ultimate productivity suite. Here is a sneak peek at what is coming soon."
                                    : "Upgrade to Focus Flow Pro to remove limits and access advanced features."}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 relative z-10">
                            <PremiumFeature
                                title="Unlimited Rules & Schedules"
                                icon="∞"
                                desc="Remove the 5-rule and 1-schedule limit. Create as many blocking rules as you need for every context."
                            />
                            <PremiumFeature
                                title="Nuclear Mode"
                                icon="☢️"
                                desc="Need absolute focus? Override all rules and block everything for a set duration. No exceptions."
                            />
                            <PremiumFeature
                                title="YouTube Feed Eradicator"
                                icon="📺"
                                desc="Take control of YouTube. Hide the feed, comments, shorts, and recommendations to stop doom-scrolling."
                            />
                            <PremiumFeature
                                title="Cloud Sync"
                                icon="☁️"
                                desc="Sync your settings, stats, and block lists across all your devices seamlessly."
                            />
                            <PremiumFeature
                                title="AI Insights"
                                icon="🤖"
                                desc="Get personalized productivity advice based on your focus habits and distraction patterns."
                            />
                        </div>

                        <div className="mt-10 text-center relative z-10">
                            {IS_PREMIUM_COMING_SOON ? (
                                <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-full font-semibold">
                                    🚀 Launching Soon
                                </div>
                            ) : (
                                <Button variant="primary" size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 border-none hover:shadow-lg hover:scale-105 transition-transform">
                                    Upgrade for $4.99/mo
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="text-center text-sm text-text-tertiary">
                        <p>Your support helps us continue developing privacy-focused productivity tools.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Components

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-2xl font-bold text-text-primary">{title}</h3>
        </div>
        <div className="prose text-text-secondary">
            {children}
        </div>
    </div>
);

const FeatureCard: React.FC<{ title: string; icon: string; description: string }> = ({ title, icon, description }) => (
    <div className="bg-surface p-6 rounded-xl border border-border hover:border-accent/50 transition-colors">
        <div className="w-12 h-12 bg-bg-secondary rounded-lg flex items-center justify-center text-2xl mb-4">
            {icon}
        </div>
        <h4 className="text-lg font-bold text-text-primary mb-2">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
);

const PremiumFeature: React.FC<{ title: string; icon: string; desc: string }> = ({ title, icon, desc }) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-bold text-white">{title}</h4>
        </div>
        <p className="text-sm text-neutral-300">{desc}</p>
    </div>
);
