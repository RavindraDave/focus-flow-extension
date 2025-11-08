import React from 'react';

/**
 * Spinner component props
 */
export interface SpinnerProps {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Spinner color variant
   * @default 'current'
   */
  color?: 'current' | 'primary' | 'white' | 'neutral';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Accessible label for screen readers
   * @default 'Loading'
   */
  'aria-label'?: string;
}

/**
 * Spinner Component
 *
 * A loading spinner with ARIA live region for accessibility.
 * Uses CSS animations for smooth performance.
 *
 * @example
 * ```tsx
 * <Spinner size="md" color="primary" />
 * <Spinner size="lg" aria-label="Loading dashboard" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'current',
  className = '',
  'aria-label': ariaLabel = 'Loading',
}) => {
  // Size styles
  const sizeStyles: Record<typeof size, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  // Color styles
  const colorStyles: Record<typeof color, string> = {
    current: 'border-current border-t-transparent',
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    neutral: 'border-neutral-300 border-t-neutral-600',
  };

  const spinnerClasses = [
    'inline-block',
    'rounded-full',
    'animate-spin',
    sizeStyles[size],
    colorStyles[color],
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};
