/**
 * SessionDistributionChart Component
 * Focus Flow Extension
 *
 * Pie chart showing distribution of session types (work vs breaks)
 * WCAG 2.1 AA compliant with proper ARIA labels
 */

import React from 'react';
import { Pie } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { chartColors, defaultChartOptions } from './chartConfig';

export interface SessionDistributionChartProps {
  /**
   * Number of completed work sessions
   */
  workSessions: number;

  /**
   * Number of completed short break sessions
   */
  shortBreaks: number;

  /**
   * Number of completed long break sessions
   */
  longBreaks: number;

  /**
   * Optional height in pixels (default: 300)
   */
  height?: number;
}

/**
 * SessionDistributionChart Component
 * Complexity: 4 (data aggregation + chart configuration)
 */
export const SessionDistributionChart: React.FC<SessionDistributionChartProps> = ({
  workSessions,
  shortBreaks,
  longBreaks,
  height = 300,
}) => {
  const totalSessions = workSessions + shortBreaks + longBreaks;

  const data = {
    labels: ['Work Sessions', 'Short Breaks', 'Long Breaks'],
    datasets: [
      {
        label: 'Session Count',
        data: [workSessions, shortBreaks, longBreaks],
        backgroundColor: [
          chartColors.primary.main,
          chartColors.success.main,
          chartColors.warning.main,
        ],
        borderColor: [
          'rgba(0, 0, 0, 0.1)',
          'rgba(0, 0, 0, 0.1)',
          'rgba(0, 0, 0, 0.1)',
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: false,
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context: TooltipItem<'pie'>): string => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = totalSessions > 0 ? ((value / totalSessions) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
      legend: {
        ...defaultChartOptions.plugins.legend,
        display: true,
        position: 'bottom' as const,
      },
    },
  };

  // Empty state
  if (totalSessions === 0) {
    return (
      <div
        className="flex items-center justify-center bg-bg-secondary rounded-lg"
        style={{ height: `${height}px` }}
        role="img"
        aria-label="No session data available"
      >
        <p className="text-text-tertiary text-sm">
          No sessions completed yet. Start a Pomodoro to see your session distribution!
        </p>
      </div>
    );
  }

  const workPercent = ((workSessions / totalSessions) * 100).toFixed(1);
  const shortBreakPercent = ((shortBreaks / totalSessions) * 100).toFixed(1);
  const longBreakPercent = ((longBreaks / totalSessions) * 100).toFixed(1);

  return (
    <div
      role="img"
      aria-label={`Session distribution: ${workSessions} work sessions (${workPercent}%), ${shortBreaks} short breaks (${shortBreakPercent}%), ${longBreaks} long breaks (${longBreakPercent}%)`}
    >
      <Pie data={data} options={options} height={height} />
    </div>
  );
};
