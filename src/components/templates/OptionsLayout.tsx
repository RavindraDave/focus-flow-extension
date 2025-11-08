import React from 'react';

/**
 * Navigation item for sidebar
 */
export interface NavigationItem {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Icon element (optional)
   */
  icon?: React.ReactNode;

  /**
   * Whether this item is currently active
   */
  active?: boolean;

  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * OptionsLayout component props
 */
export interface OptionsLayoutProps {
  /**
   * Navigation items for sidebar
   */
  navigation: NavigationItem[];

  /**
   * Main content area
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * OptionsLayout Component
 *
 * A responsive layout template for Chrome extension options/settings pages.
 * Features a fixed sidebar navigation and scrollable main content area.
 *
 * Layout structure:
 * - Sidebar: Fixed width (240px), full height navigation
 * - Main: Flexible content area with max-width constraint (1200px)
 *
 * @example
 * ```tsx
 * const navigation = [
 *   { id: 'general', label: 'General', active: true },
 *   { id: 'blocking', label: 'Website Blocking' },
 *   { id: 'analytics', label: 'Analytics' },
 * ];
 *
 * <OptionsLayout navigation={navigation}>
 *   <SettingsPanel />
 * </OptionsLayout>
 * ```
 */
export const OptionsLayout: React.FC<OptionsLayoutProps> = ({
  navigation,
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        flex min-h-screen
        bg-neutral-50
        dark:bg-neutral-900
        ${className}
      `.trim()}
    >
      {/* Sidebar Navigation */}
      <aside
        className="
          w-60 flex-shrink-0
          bg-white border-r border-neutral-200
          dark:bg-neutral-800 dark:border-neutral-700
        "
        aria-label="Settings navigation"
      >
        <nav className="sticky top-0 p-4">
          <ul className="space-y-1" role="list">
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  onClick={item.onClick}
                  className={`
                    w-full flex items-center gap-3
                    px-4 py-2.5
                    text-left text-sm font-medium
                    rounded-lg
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${
                      item.active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'
                    }
                  `.trim()}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="
          flex-1
          overflow-y-auto
          p-8
        "
        role="main"
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
