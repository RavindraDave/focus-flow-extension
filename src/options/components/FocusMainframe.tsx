/**
 * Focus Mainframe - Cyber Theme Gamification
 *
 * Cyberpunk-style XP and ranking system:
 * - XP gained from completed sessions
 * - Rank progression from Script Kiddie to 10x Engineer
 * - Terminal-style display with data nodes
 */

import React, { useState, useEffect } from 'react';
import type { AnalyticsData } from '../../types';
import { createLogger } from '../../utils/logger';

const log = createLogger('FocusMainframe');

// XP and rank configuration
const RANKS = [
  { name: 'Script Kiddie', minXP: 0, icon: '🐣', color: 'text-neutral-400' },
  { name: 'Junior Dev', minXP: 500, icon: '👶', color: 'text-blue-400' },
  { name: 'Developer', minXP: 1500, icon: '👨‍💻', color: 'text-cyan-400' },
  { name: 'Senior Dev', minXP: 3500, icon: '🧑‍💼', color: 'text-green-400' },
  { name: 'Tech Lead', minXP: 7000, icon: '👔', color: 'text-yellow-400' },
  { name: 'Architect', minXP: 12000, icon: '🏗️', color: 'text-orange-400' },
  { name: 'Principal Engineer', minXP: 20000, icon: '⭐', color: 'text-purple-400' },
  { name: '10x Engineer', minXP: 35000, icon: '🚀', color: 'text-pink-400' },
];

const XP_PER_COMPLETED_SESSION = 50;
const XP_PER_FOCUS_MINUTE = 2;

interface DataNode {
  id: string;
  label: string;
  value: string | number;
  encrypted: boolean;
}

// eslint-disable-next-line max-lines-per-function
export const FocusMainframe: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decryptedNodes, setDecryptedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnalytics = async (): Promise<void> => {
      try {
        const response = (await chrome.runtime.sendMessage({
          type: 'ANALYTICS_GET',
        })) as unknown as { success: boolean; data?: AnalyticsData };

        if (response.success && response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        log.error('Failed to fetch analytics', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAnalytics();
  }, []);

  const calculateXP = (): number => {
    if (!analytics) {return 0;}

    const sessionXP = analytics.totalSessions * XP_PER_COMPLETED_SESSION;
    const focusXP = analytics.totalFocusTimeMinutes * XP_PER_FOCUS_MINUTE;

    return sessionXP + focusXP;
  };

  const getCurrentRank = (xp: number): { name?: string; minXP?: number; icon?: string; color?: string; index: number } => {
    // Find highest rank that player has achieved
    for (let i = RANKS.length - 1; i >= 0; i--) {
      const rank = RANKS[i];
      if (rank && xp >= rank.minXP) {
        return { ...rank, index: i };
      }
    }
    const firstRank = RANKS[0];
    return { ...firstRank, index: 0 };
  };

  const getNextRank = (currentRankIndex: number): { name: string; minXP: number; icon: string; color: string } | null | undefined => {
    if (currentRankIndex >= RANKS.length - 1) {return null;}
    return RANKS[currentRankIndex + 1];
  };

  const getProgressToNextRank = (xp: number, currentRankIndex: number): number => {
    const nextRank = getNextRank(currentRankIndex);
    if (!nextRank) {return 100;} // Max rank achieved

    const currentRank = RANKS[currentRankIndex];
    if (!currentRank) {return 0;}

    const currentRankXP = currentRank.minXP;
    const nextRankXP = nextRank.minXP;
    const progress = ((xp - currentRankXP) / (nextRankXP - currentRankXP)) * 100;

    return Math.min(Math.max(progress, 0), 100);
  };

  const getDataNodes = (): DataNode[] => {
    if (!analytics) {return [];}

    const xp = calculateXP();
    const rank = getCurrentRank(xp);

    return [
      {
        id: 'xp',
        label: 'TOTAL_XP',
        value: xp.toLocaleString(),
        encrypted: xp < 100,
      },
      {
        id: 'sessions',
        label: 'SESSIONS_COMPLETED',
        value: analytics.totalSessions.toLocaleString(),
        encrypted: analytics.totalSessions < 5,
      },
      {
        id: 'focus-time',
        label: 'FOCUS_TIME_MINUTES',
        value: analytics.totalFocusTimeMinutes.toLocaleString(),
        encrypted: analytics.totalFocusTimeMinutes < 50,
      },
      {
        id: 'streak',
        label: 'CURRENT_STREAK',
        value: `${analytics.streak?.currentStreak ?? 0} days`,
        encrypted: (analytics.streak?.currentStreak ?? 0) < 3,
      },
      {
        id: 'achievements',
        label: 'ACHIEVEMENTS_UNLOCKED',
        value: analytics.achievements?.length ?? 0,
        encrypted: (analytics.achievements?.length ?? 0) === 0,
      },
      {
        id: 'rank',
        label: 'CURRENT_RANK',
        value: rank.name ?? 'Unknown',
        encrypted: false,
      },
    ];
  };

  const decryptNode = (nodeId: string): void => {
    setDecryptedNodes(prev => new Set([...prev, nodeId]));
  };

  const renderEncryptedText = (text: string | number): string => {
    const str = String(text);
    return str.split('').map(() => '█').join('');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-text-tertiary font-mono">
        <div className="animate-pulse">&gt;&gt; ACCESSING MAINFRAME...</div>
      </div>
    );
  }

  const xp = calculateXP();
  const currentRank = getCurrentRank(xp);
  const nextRank = getNextRank(currentRank.index);
  const progress = getProgressToNextRank(xp, currentRank.index);
  const dataNodes = getDataNodes();

  return (
    <div className="space-y-6 font-mono">
      {/* Terminal Header */}
      <div className="bg-black text-green-400 p-4 rounded-lg border border-green-400/30 shadow-lg shadow-green-400/20">
        <div className="text-xs mb-2 opacity-70">
          &gt;&gt; SYSTEM STATUS: ONLINE
        </div>
        <div className="text-lg font-bold">
          💻 THE MAINFRAME
        </div>
        <div className="text-xs mt-2 opacity-70">
          &gt;&gt; USER ACCESS LEVEL: {currentRank.name?.toUpperCase() ?? 'UNKNOWN'}
        </div>
      </div>

      {/* Rank Display */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-light">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-text-tertiary mb-1">CURRENT RANK</div>
            <div className={`text-3xl font-bold ${currentRank.color}`}>
              {currentRank.icon} {currentRank.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-tertiary mb-1">TOTAL XP</div>
            <div className="text-2xl font-bold text-accent">
              {xp.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div>
            <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
              <span>PROGRESS TO {nextRank.name.toUpperCase()}</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {(nextRank.minXP - xp).toLocaleString()} XP needed
            </div>
          </div>
        )}

        {nextRank === null && (
          <div className="text-center text-sm text-accent mt-4 font-bold animate-pulse">
            🏆 MAX RANK ACHIEVED! YOU ARE A TRUE 10x ENGINEER! 🏆
          </div>
        )}
      </div>

      {/* Data Nodes Grid */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-light">
        <div className="text-xs text-text-tertiary mb-4 uppercase">
          &gt;&gt; Decrypting Data Nodes...
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {dataNodes.map(node => {
            const isDecrypted = !node.encrypted || decryptedNodes.has(node.id);

            return (
              <div
                key={node.id}
                className={`
                  bg-bg-tertiary p-4 rounded-lg border transition-all duration-300
                  ${isDecrypted
                    ? 'border-green-400/30 shadow-sm shadow-green-400/10'
                    : 'border-border-light opacity-60 cursor-pointer hover:border-yellow-400/50'
                  }
                `}
                onClick={() => !isDecrypted && decryptNode(node.id)}
              >
                <div className="text-xs text-text-tertiary mb-1">
                  {isDecrypted ? '✓' : '🔒'} {node.label}
                </div>
                <div className={`text-lg font-bold ${isDecrypted ? 'text-text-primary' : 'text-yellow-400'}`}>
                  {isDecrypted ? node.value : renderEncryptedText(node.value)}
                </div>
                {!isDecrypted && (
                  <div className="text-xs text-yellow-400 mt-1">
                    Click to decrypt
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="bg-bg-tertiary p-4 rounded-lg border border-border-light">
        <div className="text-xs font-semibold text-text-secondary mb-2 uppercase">
          &gt;&gt; XP Calculation Protocol:
        </div>
        <div className="space-y-1 text-xs text-text-tertiary">
          <div>• +{XP_PER_COMPLETED_SESSION} XP per completed session</div>
          <div>• +{XP_PER_FOCUS_MINUTE} XP per minute of focus time</div>
          <div className="mt-2 pt-2 border-t border-border-light text-text-secondary">
            Complete more sessions to gain XP and unlock higher ranks!
          </div>
        </div>
      </div>

      {/* Rank Ladder */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-light">
        <div className="text-xs text-text-tertiary mb-4 uppercase">
          &gt;&gt; Rank Progression Ladder:
        </div>
        <div className="space-y-2">
          {RANKS.map((rank, index) => {
            const isAchieved = xp >= rank.minXP;
            const isCurrent = currentRank.index === index;

            return (
              <div
                key={rank.name}
                className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${isCurrent ? 'bg-accent/10 border border-accent/30' : 'bg-bg-tertiary'}
                  ${!isAchieved ? 'opacity-40' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rank.icon}</span>
                  <div>
                    <div className={`font-semibold ${rank.color}`}>
                      {rank.name}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {rank.minXP.toLocaleString()} XP
                    </div>
                  </div>
                </div>
                <div>
                  {isAchieved && (
                    <span className="text-green-400 text-xl">✓</span>
                  )}
                  {isCurrent && (
                    <span className="text-xs text-accent font-bold ml-2">CURRENT</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
