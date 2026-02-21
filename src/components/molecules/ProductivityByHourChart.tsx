/**
 * ProductivityByHourChart Component
 * Focus Flow Extension
 *
 * Bar chart showing productivity by hour of day
 * WCAG 2.1 AA compliant with proper ARIA labels
 */

import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, TooltipItem } from 'chart.js';
import { chartColors, defaultChartOptions, defaultScales } from './chartConfig';

export interface ProductivityByHourChartProps {
  /**
   * Array of 24 numbers representing completed sessions for each hour (0-23)
   */
  sessionsPerHour: number[];

  /**
   * Optional height in pixels (default: 300)
   */
  height?: number;
}

/**
 * Format hour for display (24-hour to 12-hour format)
 * Complexity: 3 (calculation + formatting)
 */
function formatHour(hour: number): string {
  if (hour === 0) {return '12 AM';}
  if (hour === 12) {return '12 PM';}
  if (hour < 12) {return `${hour} AM`;}
  return `${hour - 12} PM`;
}

/**
 * Get bar color based on productivity level
 * Complexity: 3 (conditional logic)
 */
function getBarColor(sessionCount: number, maxSessions: number): string {
  if (sessionCount === 0) {return chartColors.neutral.light;}
  if (maxSessions === 0) {return chartColors.primary.main;}

  const ratio = sessionCount / maxSessions;
  if (ratio >= 0.7) {return chartColors.success.main;}
  if (ratio >= 0.4) {return chartColors.primary.main;}
  return chartColors.warning.main;
}

/**
 * Build chart data for productivity by hour
 */
function buildChartData(hourData: number[], maxSessions: number): ChartData<'bar'> {
  const labels = Array.from({ length: 24 }, (_, i) => formatHour(i));
  const backgroundColors = hourData.map(count => getBarColor(count, maxSessions));
  const borderColors = hourData.map(count =>
    count === 0 ? chartColors.neutral.border : chartColors.primary.border
  );

  return {
    labels,
    datasets: [
      {
        label: 'Completed Sessions',
        data: hourData,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 'flex' as const,
        maxBarThickness: 40,
      },
    ],
  };
}

/**
 * Build chart options for productivity by hour
 */
function buildChartOptions(totalSessions: number): object {
  return {
    ...defaultChartOptions,
    scales: {
      ...defaultScales,
      x: {
        ...defaultScales.x,
        ticks: {
          ...defaultScales.x.ticks,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      title: { display: false },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          title: (context: TooltipItem<'bar'>[]): string => {
            const hour = context[0]?.dataIndex ?? 0;
            return formatHour(hour);
          },
          label: (context: TooltipItem<'bar'>): string => {
            const sessions = context.parsed.y ?? 0;
            const percentage =
              totalSessions > 0 ? ((sessions / totalSessions) * 100).toFixed(1) : '0';
            return `${sessions} ${sessions === 1 ? 'session' : 'sessions'} (${percentage}%)`;
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

/** Empty state for productivity chart */
function ProductivityEmptyState({ height }: { height: number }): React.ReactElement {
  return (
    <div
      className="flex items-center justify-center bg-bg-secondary rounded-lg"
      style={{ height: `${height}px` }}
      role="img"
      aria-label="No productivity data available by hour"
    >
      <p className="text-text-tertiary text-sm">
        No sessions completed yet. Complete Pomodoros throughout the day to see your productivity
        patterns!
      </p>
    </div>
  );
}

/**
 * ProductivityByHourChart Component
 * Complexity: 5 (data transformation + color mapping + chart configuration)
 */
export const ProductivityByHourChart: React.FC<ProductivityByHourChartProps> = ({
  sessionsPerHour,
  height = 300,
}) => {
  const hourData = Array.from({ length: 24 }, (_, i) => sessionsPerHour[i] ?? 0);
  const maxSessions = Math.max(...hourData, 1);
  const totalSessions = hourData.reduce((sum, count) => sum + count, 0);

  if (totalSessions === 0) {
    return <ProductivityEmptyState height={height} />;
  }

  const data = buildChartData(hourData, maxSessions);
  const options = buildChartOptions(totalSessions);
  const peakHourIndex = hourData.indexOf(maxSessions);
  const peakHourLabel = formatHour(peakHourIndex);

  return (
    <div
      role="img"
      aria-label={`Productivity by hour of day. Peak productivity at ${peakHourLabel} with ${maxSessions} sessions. Total of ${totalSessions} sessions across all hours.`}
    >
      <Bar data={data} options={options} height={height} />
    </div>
  );
};
