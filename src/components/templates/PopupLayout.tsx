import React from 'react';

/**
 * PopupLayout component props
 */
export interface PopupLayoutProps {
  /**
   * Header content (optional)
   */
  header?: React.ReactNode;

  /**
   * Main content (required)
   */
  children: React.ReactNode;

  /**
   * Footer content (optional)
   */
  footer?: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * PopupLayout Component
 *
 * A fixed-size layout template for Chrome extension popup pages.
 * Dimensions: 400px × 600px (as per Chrome extension popup requirements).
 *
 * Layout structure:
 * - Header: Fixed at top (optional)
 * - Main: Scrollable content area
 * - Footer: Fixed at bottom (optional)
 *
 * @example
 * ```tsx
 * <PopupLayout
 *   header={<h1>Focus Mode</h1>}
 *   footer={<Button>Settings</Button>}
 * >
 *   <TimerDisplay />
 *   <StatsCard />
 * </PopupLayout>
 * ```
 */
export const PopupLayout: React.FC<PopupLayoutProps> = ({
  header,
  children,
  footer,
  className = '',
}) => {
  return (
    <div
      className={`
        relative
        flex flex-col
        w-full h-[600px]
        bg-bg-primary
        ${className}
      `.trim()}
    >
      {/* Header Section */}
      {header && (
        <header
          className="
            flex-shrink-0
            px-4 py-4
            bg-surface border-b border-border
          "
        >
          {header}
        </header>
      )}

      {/* Main Content Section - Scrollable */}
      <main
        id="main-content"
        className="
          flex-1
          overflow-y-auto
          px-4 py-6
        "
        role="main"
      >
        {children}
      </main>

      {/* Footer Section */}
      {footer && (
        <footer
          className="
            flex-shrink-0
            px-4 py-4
            bg-surface border-t border-border
          "
        >
          {footer}
        </footer>
      )}
    </div>
  );
};
