/**
 * Virtual Garden - Zen Theme Gamification
 *
 * Visualizes progress as a growing garden where:
 * - Each completed session plants a healthy tree
 * - Abandoned sessions create withered trees
 * - Shows last 14 days of activity
 */

import React, { useState, useEffect } from 'react';
import type { AnalyticsData } from '../../types';
import { createLogger } from '../../utils/logger';

const log = createLogger('VirtualGarden');

interface TreeProps {
  status: 'empty' | 'healthy' | 'withered';
  date: Date;
  completedSessions: number;
  abandonedSessions: number;
}

/**
 * Individual tree component with growth stages
 */
const Tree: React.FC<TreeProps> = ({ status, date, completedSessions, abandonedSessions }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTreeIcon = () => {
    if (status === 'empty') {return '🌱';} // Seedling for no activity
    if (status === 'withered') {return '🥀';} // Withered for abandoned

    // Different tree stages based on number of completed sessions
    if (completedSessions >= 8) {return '🌳';} // Mature tree
    if (completedSessions >= 4) {return '🌲';} // Growing tree
    return '🌿'; // Young tree
  };

  const getTreeSize = () => {
    if (status === 'empty') {return 'text-2xl';}
    if (status === 'withered') {return 'text-2xl opacity-50';}

    // Larger trees for more sessions
    if (completedSessions >= 8) {return 'text-4xl';}
    if (completedSessions >= 4) {return 'text-3xl';}
    return 'text-2xl';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`${getTreeSize()} transition-all duration-300 cursor-pointer hover:scale-110`}>
        {getTreeIcon()}
      </div>
      <div className="text-xs text-text-tertiary mt-1">
        {formatDate(date)}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 bg-bg-tertiary border border-border-light rounded-lg p-3 shadow-lg z-10 min-w-[180px]">
          <div className="text-sm font-semibold text-text-primary mb-1">
            {formatDate(date)}
          </div>
          {status === 'empty' ? (
            <div className="text-xs text-text-secondary">No sessions</div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-text-secondary">
                ✅ Completed: {completedSessions}
              </div>
              {abandonedSessions > 0 && (
                <div className="text-xs text-text-tertiary">
                  ❌ Abandoned: {abandonedSessions}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const VirtualGarden: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' });
        if (response.success && response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        log.error('Failed to fetch analytics', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Get last 14 days of data
  const getLast14Days = () => {
    const days: TreeProps[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];

      // Find matching day in analytics
      const dayData = analytics?.dailyStats?.find(stat => {
        const statDate = new Date(stat.date).toISOString().split('T')[0];
        return statDate === dateStr;
      });

      const completedSessions = dayData?.completedSessions || 0;
      const abandonedSessions = dayData?.abandonedSessions || 0;

      let status: 'empty' | 'healthy' | 'withered';
      if (completedSessions === 0 && abandonedSessions === 0) {
        status = 'empty';
      } else if (abandonedSessions > completedSessions) {
        status = 'withered';
      } else {
        status = 'healthy';
      }

      days.push({
        status,
        date,
        completedSessions,
        abandonedSessions,
      });
    }

    return days;
  };

  const calculateGardenStats = () => {
    const days = getLast14Days();
    const healthyTrees = days.filter(d => d.status === 'healthy').length;
    const witheredTrees = days.filter(d => d.status === 'withered').length;
    const emptySpots = days.filter(d => d.status === 'empty').length;

    return { healthyTrees, witheredTrees, emptySpots };
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-text-tertiary">
        <div className="animate-pulse">Loading garden...</div>
      </div>
    );
  }

  const days = getLast14Days();
  const stats = calculateGardenStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          🌱 The Garden
        </h3>
        <p className="text-sm text-text-tertiary">
          Every completed session grows your garden. Abandoned sessions wither the trees.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-green-600">{stats.healthyTrees}</div>
          <div className="text-xs text-text-tertiary mt-1">Healthy Trees</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-amber-600">{stats.witheredTrees}</div>
          <div className="text-xs text-text-tertiary mt-1">Withered Trees</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-neutral-400">{stats.emptySpots}</div>
          <div className="text-xs text-text-tertiary mt-1">Empty Spots</div>
        </div>
      </div>

      {/* Garden Grid */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-light">
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => (
            <Tree
              key={index}
              status={day.status}
              date={day.date}
              completedSessions={day.completedSessions}
              abandonedSessions={day.abandonedSessions}
            />
          ))}
        </div>
      </div>

      {/* Garden Legend */}
      <div className="bg-bg-tertiary p-4 rounded-lg border border-border-light">
        <div className="text-xs font-semibold text-text-secondary mb-2">Garden Guide:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-text-tertiary">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span>No activity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span>1-3 sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌲</span>
            <span>4-7 sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌳</span>
            <span>8+ sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
