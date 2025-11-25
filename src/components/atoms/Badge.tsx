import React from 'react';

/**
 * Badge component props
 */
export interface BadgeProps {
  /**
   * Badge visual variant
   * @default 'info'
   */
  variant?: 'success' | 'warning' | 'error' | 'info';

  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * Badge content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge Component
 *
 * A small status indicator component for displaying labels, counts, or status.
 * Follows the design system color palette.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Failed</Badge>
 * <Badge variant="info" size="sm">3</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  children,
  className = '',
}) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-full
    whitespace-nowrap
  `;

  // Variant styles
  const variantStyles: Record<typeof variant, string> = {
    success: `
      bg-success/10 text-success
      border border-success/30
    `,
    warning: `
      bg-warning/10 text-warning
      border border-warning/30
    `,
    error: `
      bg-error/10 text-error
      border border-error/30
    `,
    info: `
      bg-info/10 text-info
      border border-info/30
    `,
  };

  // Size styles
  const sizeStyles: Record<typeof size, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  // Combine all styles
  const badgeClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};
