import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OptionsLayout, NavigationItem } from '../../../../src/components/templates/OptionsLayout';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

describe('OptionsLayout', () => {
  const mockNavigation: NavigationItem[] = [
    { id: 'general', label: 'General Settings', active: true },
    { id: 'blocking', label: 'Website Blocking' },
    { id: 'analytics', label: 'Analytics' },
  ];

  describe('Rendering', () => {
    it('should render children in main content', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Main Content</div>
        </OptionsLayout>
      );
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText('Website Blocking')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render navigation items as buttons', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should render empty navigation list', () => {
      render(
        <OptionsLayout navigation={[]}>
          <div>Content</div>
        </OptionsLayout>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation} className="custom-layout">
          <div>Content</div>
        </OptionsLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('custom-layout');
    });
  });

  describe('Navigation', () => {
    it('should highlight active navigation item', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const activeButton = screen.getByText('General Settings').closest('button');
      expect(activeButton).toHaveClass('bg-primary-50');
      expect(activeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight inactive navigation items', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const inactiveButton = screen.getByText('Website Blocking').closest('button');
      expect(inactiveButton).not.toHaveClass('bg-primary-50');
      expect(inactiveButton).not.toHaveAttribute('aria-current');
    });

    it('should call onClick when navigation item is clicked', async () => {
      const handleClick = vi.fn();
      const navigation: NavigationItem[] = [
        { id: 'test', label: 'Test Item', onClick: handleClick },
      ];

      const user = userEvent.setup();
      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      const button = screen.getByText('Test Item');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render navigation items with icons', () => {
      const navigation: NavigationItem[] = [
        { id: 'settings', label: 'Settings', icon: <span>⚙️</span> },
      ];

      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should mark icon as decorative', () => {
      const navigation: NavigationItem[] = [
        { id: 'settings', label: 'Settings', icon: <span>⚙️</span> },
      ];

      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      const icon = screen.getByText('⚙️').parentElement;
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Layout Structure', () => {
    it('should use semantic HTML elements', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      expect(container.querySelector('aside')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should have aside with aria-label', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const aside = screen.getByLabelText('Settings navigation');
      expect(aside).toBeInTheDocument();
    });

    it('should have main element with role="main"', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have main element with id="main-content"', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should use flexbox layout', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('flex');
    });

    it('should have fixed sidebar width', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('w-60');
      expect(aside).toHaveClass('flex-shrink-0');
    });

    it('should have scrollable main content', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('overflow-y-auto');
    });

    it('should constrain main content width', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div data-testid="content">Content</div>
        </OptionsLayout>
      );
      const contentWrapper = screen.getByTestId('content').parentElement;
      expect(contentWrapper).toHaveClass('max-w-4xl');
    });

    it('should center main content', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div data-testid="content">Content</div>
        </OptionsLayout>
      );
      const contentWrapper = screen.getByTestId('content').parentElement;
      expect(contentWrapper).toHaveClass('mx-auto');
    });
  });

  describe('Styling', () => {
    it('should have background color', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('bg-neutral-50');
    });

    it('should have dark mode background', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('dark:bg-neutral-900');
    });

    it('should have sidebar border', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('border-r');
      expect(aside).toHaveClass('border-neutral-200');
    });

    it('should have sticky navigation', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('sticky');
      expect(nav).toHaveClass('top-0');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Main Content</div>
        </OptionsLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - with icons', async () => {
      const navigation: NavigationItem[] = [
        { id: 'settings', label: 'Settings', icon: <span>⚙️</span>, active: true },
        { id: 'help', label: 'Help', icon: <span>❓</span> },
      ];

      const { container } = render(
        <OptionsLayout navigation={navigation}>
          <div>Main Content</div>
        </OptionsLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have focus ring on navigation buttons', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const button = screen.getByText('General Settings').closest('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });

    it('should support keyboard navigation', async () => {
      const handleClick = vi.fn();
      const navigation: NavigationItem[] = [
        { id: 'first', label: 'First', onClick: handleClick },
        { id: 'second', label: 'Second' },
      ];

      const user = userEvent.setup();
      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      const firstButton = screen.getByText('First') as HTMLButtonElement;

      await user.click(firstButton);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have navigation list role', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const list = container.querySelector('ul');
      expect(list).toHaveAttribute('role', 'list');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have minimum height', () => {
      const { container } = render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('min-h-screen');
    });
  });

  describe('Content Rendering', () => {
    it('should render multiple children', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Section 1</div>
          <div>Section 2</div>
          <div>Section 3</div>
        </OptionsLayout>
      );
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('should handle complex navigation', () => {
      const complexNav: NavigationItem[] = [
        { id: '1', label: 'Item 1', active: true },
        { id: '2', label: 'Item 2' },
        { id: '3', label: 'Item 3' },
        { id: '4', label: 'Item 4' },
        { id: '5', label: 'Item 5' },
      ];

      render(
        <OptionsLayout navigation={complexNav}>
          <div>Content</div>
        </OptionsLayout>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigation items without onClick', () => {
      const navigation: NavigationItem[] = [
        { id: 'no-click', label: 'No Click Handler' },
      ];

      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      expect(screen.getByText('No Click Handler')).toBeInTheDocument();
    });

    it('should handle navigation items without icons', () => {
      render(
        <OptionsLayout navigation={mockNavigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      mockNavigation.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('should handle very long navigation labels', () => {
      const navigation: NavigationItem[] = [
        {
          id: 'long',
          label: 'This is a very long navigation label that might wrap',
        },
      ];

      render(
        <OptionsLayout navigation={navigation}>
          <div>Content</div>
        </OptionsLayout>
      );

      expect(
        screen.getByText('This is a very long navigation label that might wrap')
      ).toBeInTheDocument();
    });
  });
});
