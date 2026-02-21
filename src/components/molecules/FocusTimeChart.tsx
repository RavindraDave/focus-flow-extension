/**
 * FocusTimeChart Component
 * Focus Flow Extension
 *
 * 7-day focus time trend line chart
 * WCAG 2.1 AA compliant with proper ARIA labels
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { chartColors, defaultChartOptions, defaultScales } from './chartConfig';

export interface FocusTimeChartProps {
  /**
   * Array of daily focus times for the last 7 days
   * Index 0 = 6 days ago, Index 6 = today
   */
  dailyFocusTime: number[];

  /**
   * Array of date labels for the X axis
   * e.g., ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
   */
  labels: string[];

  /**
   * Optional height in pixels (default: 300)
   */
  height?: number;
}

/**
 * Format minutes for tooltip display
 * Complexity: 3 (calculation + conditional formatting)
 */
function formatMinutesForTooltip(minutes: number): string {
  if (minutes === 0) {return '0 minutes';}
  if (minutes < 60) {return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;}

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Build chart data configuration
 */
function buildChartData(labels: string[], dailyFocusTime: number[]) {
  return {
    labels,
    datasets: [
      {
        label: 'Focus Time (minutes)',
        data: dailyFocusTime,
        borderColor: chartColors.primary.main,
        backgroundColor: chartColors.primary.light,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: chartColors.primary.main,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };
}

/**
 * Build chart options configuration
 */
function buildChartOptions(): object {
  return {
    ...defaultChartOptions,
    scales: defaultScales,
    plugins: {
      ...defaultChartOptions.plugins,
      title: { display: false },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context: TooltipItem<'line'>): string => {
            const minutes = context.parsed.y ?? 0;
            return `Focus Time: ${formatMinutesForTooltip(minutes)}`;
          },
        },
      },
      legend: {
        ...defaultChartOptions.plugins.legend,
        display: false,
      },
    },
  };
}

/** Empty state when no data is available */
function FocusTimeEmptyState({ height }: { height: number }): React.ReactElement {
  return (
    <div
      className="flex items-center justify-center bg-bg-secondary rounded-lg"
      style={{ height: `${height}px` }}
      role="img"
      aria-label="No focus time data available for the past 7 days"
    >
      <p className="text-text-tertiary text-sm">
        No focus time recorded yet. Complete a Pomodoro session to see your progress!
      </p>
    </div>
  );
}

/**
 * FocusTimeChart Component
 * Complexity: 4 (data transformation + chart configuration)
 */
export const FocusTimeChart: React.FC<FocusTimeChartProps> = ({
  dailyFocusTime,
  labels,
  height = 300,
}) => {
  if (dailyFocusTime.length === 0 || dailyFocusTime.every(val => val === 0)) {
    return <FocusTimeEmptyState height={height} />;
  }

  const data = buildChartData(labels, dailyFocusTime);
  const options = buildChartOptions();

  return (
    <div
      role="img"
      aria-label={`Focus time trend for the past 7 days. ${labels
        .map((label, idx) => `${label}: ${formatMinutesForTooltip(dailyFocusTime[idx] ?? 0)}`)
        .join(', ')}`}
    >
      <Line data={data} options={options} height={height} />
    </div>
  );
};
