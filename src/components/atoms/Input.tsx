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

// Base input styles
const baseInputStyles = `
  px-4 py-2
  border rounded-md
  bg-bg-primary text-text-primary placeholder:text-text-muted
  transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-offset-0
  disabled:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-50
`;

const errorStateStyles = `
  border-error
  focus:ring-error focus:border-error
`;

const normalStateStyles = `
  border-border
  focus:ring-accent focus:border-accent
`;

/**
 * Build combined class string for input
 */
function buildInputClasses(
  error: string | undefined,
  fullWidth: boolean,
  className: string
): string {
  const stateStyles = error ? errorStateStyles : normalStateStyles;
  const widthStyles = fullWidth ? 'w-full' : '';
  return [baseInputStyles, stateStyles, widthStyles, className]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build aria-describedby value
 */
function buildAriaDescribedBy(
  error: string | undefined,
  helperText: string | undefined,
  errorId: string,
  helperId: string
): string | undefined {
  return [error && errorId, helperText && !error && helperId]
    .filter(Boolean)
    .join(' ') || undefined;
}

/** Label sub-component */
function InputLabel({ inputId, label, required }: {
  inputId: string;
  label: string;
  required: boolean;
}): React.ReactElement {
  return (
    <label
      htmlFor={inputId}
      className="block text-sm font-medium text-text-primary mb-1.5"
    >
      {label}
      {required && (
        <span className="text-error ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

/** Error message sub-component */
function InputError({ errorId, error }: { errorId: string; error: string }): React.ReactElement {
  return (
    <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
      {error}
    </p>
  );
}

/** Helper text sub-component */
function InputHelper({ helperId, helperText }: {
  helperId: string;
  helperText: string;
}): React.ReactElement {
  return (
    <p id={helperId} className="mt-1.5 text-sm text-text-tertiary">
      {helperText}
    </p>
  );
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
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const inputClasses = buildInputClasses(error, fullWidth, className);
    const ariaDescribedBy = buildAriaDescribedBy(error, helperText, errorId, helperId);

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && <InputLabel inputId={inputId} label={label} required={required} />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          className={inputClasses}
          {...props}
        />
        {error && <InputError errorId={errorId} error={error} />}
        {helperText && !error && <InputHelper helperId={helperId} helperText={helperText} />}
      </div>
    );
  }
);

Input.displayName = 'Input';
