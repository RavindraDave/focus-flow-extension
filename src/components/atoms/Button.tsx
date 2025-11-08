import React from 'react';
import { Spinner } from './Spinner';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state - shows spinner and disables button
   * @default false
   */
  loading?: boolean;

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Children elements (button content)
   */
  children: React.ReactNode;
}

/**
 * Button Component
 *
 * A flexible, accessible button component with multiple variants and sizes.
 * Follows WCAG 2.1 AA accessibility standards.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Start Pomodoro
 * </Button>
 *
 * <Button variant="secondary" loading>
 *   Saving...
 * </Button>
 *
 * <Button variant="destructive" size="sm">
 *   Delete
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  // Base styles (always applied)
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    transition-colors duration-150 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Variant styles
  const variantStyles: Record<typeof variant, string> = {
    primary: `
      bg-primary-500 hover:bg-primary-600 active:bg-primary-700
      text-white
      focus:ring-primary-500
    `,
    secondary: `
      bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300
      text-neutral-900
      focus:ring-neutral-400
      dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white
    `,
    destructive: `
      bg-error-500 hover:bg-error-600 active:bg-error-600
      text-white
      focus:ring-error-500
    `,
    ghost: `
      bg-transparent hover:bg-neutral-100 active:bg-neutral-200
      text-neutral-700
      focus:ring-neutral-400
      dark:hover:bg-neutral-800 dark:text-neutral-200
    `,
  };

  // Size styles
  const sizeStyles: Record<typeof size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Combine all styles
  const buttonClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    widthStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Determine if button should be disabled
  const isDisabled = disabled || loading;

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner size={size === 'sm' ? 'sm' : 'md'} />}
      {children}
    </button>
  );
};
