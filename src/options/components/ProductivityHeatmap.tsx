/**
 * Productivity Heatmap - Modern Theme Gamification
 *
 * GitHub-style contribution graph showing:
 * - Daily focus time over the last 12 weeks
 * - Color intensity based on minutes
 * - Streak visualization
 */

import React, { useState, useEffect } from 'react';
import type { AnalyticsData } from '../../types';

interface DayCell {
  date: Date;
  focusMinutes: number;
  completedSessions: number;
  intensity: number; // 0-4
}

// Color intensity levels (GitHub-style)
const INTENSITY_COLORS = [
  'bg-neutral-200 dark:bg-neutral-800', // 0: No activity
  'bg-green-200 dark:bg-green-900', // 1: Light
  'bg-green-400 dark:bg-green-700', // 2: Medium
  'bg-green-600 dark:bg-green-500', // 3: High
  'bg-green-800 dark:bg-green-400', // 4: Very high
];

const getIntensity = (minutes: number): number => {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

export const ProductivityHeatmap: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'ANALYTICS_GET' });
        if (response.success && response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  /**
   * Generate heatmap data for last 12 weeks (84 days)
   */
  const generateHeatmapData = (): DayCell[][] => {
    const weeks: DayCell[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start date (12 weeks ago, starting from Sunday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83); // 84 days including today

    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - dayOfWeek);
    }

    let currentWeek: DayCell[] = [];

    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dateStr = date.toISOString().split('T')[0];

      // Find matching day in analytics
      const dayData = analytics?.dailyStats?.find(stat => {
        const statDate = new Date(stat.date).toISOString().split('T')[0];
        return statDate === dateStr;
      });

      const focusMinutes = dayData?.focusTimeMinutes || 0;
      const completedSessions = dayData?.completedSessions || 0;

      currentWeek.push({
        date,
        focusMinutes,
        completedSessions,
        intensity: getIntensity(focusMinutes),
      });

      // Start new week on Sunday
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const calculateStats = () => {
    if (!analytics) return { totalDays: 0, avgMinutes: 0, maxMinutes: 0, activeDays: 0 };

    const last84Days = analytics.dailyStats?.filter(stat => {
      const statDate = new Date(stat.date);
      const daysAgo = Math.floor((Date.now() - statDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 84;
    }) || [];

    const totalMinutes = last84Days.reduce((sum, day) => sum + day.focusTimeMinutes, 0);
    const activeDays = last84Days.filter(day => day.focusTimeMinutes > 0).length;
    const maxMinutes = Math.max(...last84Days.map(day => day.focusTimeMinutes), 0);
    const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    return {
      totalDays: 84,
      avgMinutes,
      maxMinutes,
      activeDays,
    };
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes === 0) return '0min';
    if (minutes < 60) return `${minutes}min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-text-tertiary">
        <div className="animate-pulse">Loading heatmap...</div>
      </div>
    );
  }

  const weeks = generateHeatmapData();
  const stats = calculateStats();
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          📈 Productivity Heatmap
        </h3>
        <p className="text-sm text-text-tertiary">
          GitHub-style contribution graph showing your daily focus time over the last 12 weeks
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-accent">{stats.activeDays}</div>
          <div className="text-xs text-text-tertiary mt-1">Active Days</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-accent">{formatMinutes(stats.avgMinutes)}</div>
          <div className="text-xs text-text-tertiary mt-1">Avg per Active Day</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-accent">{formatMinutes(stats.maxMinutes)}</div>
          <div className="text-xs text-text-tertiary mt-1">Best Day</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border-light">
          <div className="text-2xl font-bold text-accent">
            {analytics?.streak?.currentStreak || 0}
          </div>
          <div className="text-xs text-text-tertiary mt-1">Day Streak</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-light overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col justify-around mr-2">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="text-xs text-text-tertiary h-3 flex items-center"
                style={{ opacity: index % 2 === 0 ? 1 : 0 }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`
                      w-3 h-3 rounded-sm cursor-pointer transition-all
                      ${INTENSITY_COLORS[day.intensity]}
                      hover:ring-2 hover:ring-accent hover:scale-125
                    `}
                    onMouseEnter={() => setSelectedDay(day)}
                    onMouseLeave={() => setSelectedDay(null)}
                    title={`${formatDate(day.date)}: ${formatMinutes(day.focusMinutes)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-2 ml-12">
          {weeks.map((week, index) => {
            const firstDayOfWeek = week[0]?.date;
            if (!firstDayOfWeek) return null;

            const month = firstDayOfWeek.getMonth();
            const prevWeekFirstDay = weeks[index - 1]?.[0]?.date;
            const showLabel = index === 0 || (prevWeekFirstDay && prevWeekFirstDay.getMonth() !== month);

            return (
              <div key={index} className="flex-1 min-w-[12px]">
                {showLabel && (
                  <div className="text-xs text-text-tertiary">
                    {monthLabels[month]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
          <div className="text-sm font-semibold text-text-primary mb-2">
            {formatDate(selectedDay.date)}
          </div>
          <div className="space-y-1 text-sm text-text-secondary">
            <div>
              Focus Time: <span className="font-semibold text-accent">{formatMinutes(selectedDay.focusMinutes)}</span>
            </div>
            <div>
              Completed Sessions: <span className="font-semibold text-accent">{selectedDay.completedSessions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-bg-tertiary p-4 rounded-lg border border-border-light">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-text-tertiary">Less</div>
          <div className="flex gap-1">
            {INTENSITY_COLORS.map((color, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-sm ${color}`}
                title={
                  index === 0 ? 'No activity' :
                  index === 1 ? '< 30 min' :
                  index === 2 ? '30-60 min' :
                  index === 3 ? '1-2 hours' :
                  '2+ hours'
                }
              />
            ))}
          </div>
          <div className="text-xs text-text-tertiary">More</div>
        </div>
      </div>
    </div>
  );
};
