import React from 'react';

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label text
   */
  label?: string;

  /**
   * Whether the field is required
   * Shows an asterisk (*) next to the label
   * @default false
   */
  required?: boolean;

  /**
   * Error message to display
   */
  error?: string | undefined;

  /**
   * Helper text to display below the input
   */
  helperText?: string;

  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Input Component
 *
 * An accessible input field with label, error states, and helper text.
 * Follows WCAG 2.1 AA accessibility standards.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Website URL"
 *   placeholder="example.com"
 *   required
 *   error="Please enter a valid URL"
 * />
 *
 * <Input
 *   label="Task Name"
 *   helperText="Describe what you'll be working on"
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required = false,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Base input styles
    const baseInputStyles = `
      px-4 py-2
      border rounded-md
      text-neutral-900 placeholder:text-neutral-400
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50
      dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500
      dark:disabled:bg-neutral-900
    `;

    // Conditional styles based on error state
    const stateStyles = error
      ? `
        border-error-500
        focus:ring-error-500 focus:border-error-500
      `
      : `
        border-neutral-300
        focus:ring-primary-500 focus:border-primary-500
        dark:border-neutral-600
      `;

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Combine all input styles
    const inputClasses = [baseInputStyles, stateStyles, widthStyles, className]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Determine aria-describedby
    const ariaDescribedBy = [
      error && errorId,
      helperText && !error && helperId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1.5"
          >
            {label}
            {required && (
              <span className="text-error-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          className={inputClasses}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error-600 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper Text (only show if no error) */}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
