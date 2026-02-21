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

// Variant styles
const variantStyles: Record<string, string> = {
  primary: `
    bg-accent hover:bg-accent-hover active:bg-accent-hover
    text-text-inverse
    focus:ring-accent
  `,
  secondary: `
    bg-bg-secondary hover:bg-bg-tertiary active:bg-bg-tertiary
    text-text-primary
    focus:ring-border
  `,
  destructive: `
    bg-error hover:bg-error/90 active:bg-error/90
    text-text-inverse
    focus:ring-error
  `,
  ghost: `
    bg-transparent hover:bg-bg-secondary active:bg-bg-tertiary
    text-text-primary
    focus:ring-border
  `,
};

// Size styles
const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// Base styles (always applied)
const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-semibold rounded-lg
  transition-colors duration-150 ease-out
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;

/**
 * Build combined class string for button
 */
function buildButtonClasses(
  variant: string,
  size: string,
  fullWidth: boolean,
  className: string
): string {
  const widthStyles = fullWidth ? 'w-full' : '';
  return [baseStyles, variantStyles[variant], sizeStyles[size], widthStyles, className]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const buttonClasses = buildButtonClasses(variant, size, fullWidth, className);
  const isDisabled = disabled ?? loading;

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
