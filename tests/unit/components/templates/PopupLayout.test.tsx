import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PopupLayout } from '../../../../src/components/templates/PopupLayout';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

describe('PopupLayout', () => {
  describe('Rendering', () => {
    it('should render children in main content', () => {
      render(
        <PopupLayout>
          <div>Main Content</div>
        </PopupLayout>
      );
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render header when provided', () => {
      render(
        <PopupLayout header={<h1>Header</h1>}>
          <div>Content</div>
        </PopupLayout>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <PopupLayout footer={<button>Settings</button>}>
          <div>Content</div>
        </PopupLayout>
      );
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should not render header when not provided', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const header = container.querySelector('header');
      expect(header).not.toBeInTheDocument();
    });

    it('should not render footer when not provided', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const footer = container.querySelector('footer');
      expect(footer).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PopupLayout className="custom-layout">
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('custom-layout');
    });
  });

  describe('Layout Structure', () => {
    it('should use semantic HTML elements', () => {
      const { container } = render(
        <PopupLayout
          header={<h1>Header</h1>}
          footer={<div>Footer</div>}
        >
          <div>Content</div>
        </PopupLayout>
      );

      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should have main element with role="main"', () => {
      render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have main element with id="main-content"', () => {
      render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('should use flexbox layout', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('flex');
      expect(layout).toHaveClass('flex-col');
    });

    it('should have scrollable main content', () => {
      render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('overflow-y-auto');
    });

    it('should have flexible main content area', () => {
      render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
    });
  });

  describe('Styling', () => {
    it('should have background color', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('bg-neutral-50');
    });

    it('should have dark mode background', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('dark:bg-neutral-900');
    });

    it('should have header border', () => {
      const { container } = render(
        <PopupLayout header={<div>Header</div>}>
          <div>Content</div>
        </PopupLayout>
      );
      const header = container.querySelector('header');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-neutral-200');
    });

    it('should have footer border', () => {
      const { container } = render(
        <PopupLayout footer={<div>Footer</div>}>
          <div>Content</div>
        </PopupLayout>
      );
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t');
      expect(footer).toHaveClass('border-neutral-200');
    });

    it('should have consistent padding', () => {
      const { container } = render(
        <PopupLayout
          header={<div>Header</div>}
          footer={<div>Footer</div>}
        >
          <div>Content</div>
        </PopupLayout>
      );

      const header = container.querySelector('header');
      const main = container.querySelector('main');
      const footer = container.querySelector('footer');

      expect(header).toHaveClass('px-4', 'py-4');
      expect(main).toHaveClass('px-4', 'py-6');
      expect(footer).toHaveClass('px-4', 'py-4');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations - with all sections', async () => {
      const { container } = render(
        <PopupLayout
          header={<h1>Focus Mode</h1>}
          footer={<button>Settings</button>}
        >
          <div>Main Content</div>
        </PopupLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - main only', async () => {
      const { container } = render(
        <PopupLayout>
          <div>Main Content</div>
        </PopupLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - with header', async () => {
      const { container } = render(
        <PopupLayout header={<h1>Focus Mode</h1>}>
          <div>Main Content</div>
        </PopupLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - with footer', async () => {
      const { container } = render(
        <PopupLayout footer={<button>Settings</button>}>
          <div>Main Content</div>
        </PopupLayout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have full width', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('w-full');
    });

    it('should have minimum height', () => {
      const { container } = render(
        <PopupLayout>
          <div>Content</div>
        </PopupLayout>
      );
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('min-h-screen');
    });
  });

  describe('Content Rendering', () => {
    it('should render complex header content', () => {
      render(
        <PopupLayout
          header={
            <div>
              <h1>Focus Mode</h1>
              <button>Action</button>
            </div>
          }
        >
          <div>Content</div>
        </PopupLayout>
      );
      expect(screen.getByText('Focus Mode')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('should render complex footer content', () => {
      render(
        <PopupLayout
          footer={
            <div className="flex gap-2">
              <button>Cancel</button>
              <button>Save</button>
            </div>
          }
        >
          <div>Content</div>
        </PopupLayout>
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should render multiple children in main content', () => {
      render(
        <PopupLayout>
          <div>Section 1</div>
          <div>Section 2</div>
          <div>Section 3</div>
        </PopupLayout>
      );
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      // @ts-expect-error - Testing edge case
      render(<PopupLayout>{null}</PopupLayout>);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = Array.from({ length: 100 }, (_, i) => (
        <div key={i}>Line {i}</div>
      ));

      render(<PopupLayout>{longContent}</PopupLayout>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('overflow-y-auto');
    });
  });
});
