/**
 * Chart.js Configuration
 * Focus Flow Extension
 *
 * Default configuration for all charts following design system
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Design system colors
 */
export const chartColors = {
  primary: {
    main: 'rgb(79, 70, 229)', // primary-600
    light: 'rgba(79, 70, 229, 0.1)', // primary-50
    border: 'rgba(79, 70, 229, 0.5)',
  },
  success: {
    main: 'rgb(34, 197, 94)', // success-500
    light: 'rgba(34, 197, 94, 0.1)', // success-50
    border: 'rgba(34, 197, 94, 0.5)',
  },
  warning: {
    main: 'rgb(251, 146, 60)', // warning-500
    light: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.5)',
  },
  error: {
    main: 'rgb(239, 68, 68)', // error-500
    light: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.5)',
  },
  neutral: {
    main: 'rgb(115, 115, 115)', // neutral-500
    light: 'rgba(115, 115, 115, 0.1)',
    border: 'rgba(115, 115, 115, 0.3)',
  },
};

/**
 * Default chart options following WCAG 2.1 AA
 * Complexity: 2 (object configuration)
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
        },
        color: 'rgb(64, 64, 64)', // neutral-700
        padding: 12,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(23, 23, 23, 0.9)', // neutral-900
      titleColor: 'rgb(255, 255, 255)',
      bodyColor: 'rgb(255, 255, 255)',
      padding: 12,
      cornerRadius: 6,
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 13,
        weight: 'bold' as const,
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 12,
      },
      displayColors: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
};

/**
 * Default scale configuration
 * Complexity: 2 (object configuration)
 */
export const defaultScales = {
  x: {
    grid: {
      display: false,
      drawBorder: true,
      color: 'rgba(0, 0, 0, 0.05)',
    },
    ticks: {
      font: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
      },
      color: 'rgb(115, 115, 115)', // neutral-500
    },
  },
  y: {
    beginAtZero: true,
    grid: {
      display: true,
      drawBorder: false,
      color: 'rgba(0, 0, 0, 0.05)',
    },
    ticks: {
      font: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
      },
      color: 'rgb(115, 115, 115)', // neutral-500
      precision: 0,
    },
  },
};
