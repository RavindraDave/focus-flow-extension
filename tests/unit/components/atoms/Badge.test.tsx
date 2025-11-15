import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Badge } from '../../../../src/components/atoms/Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render with children', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render info variant by default', () => {
      render(<Badge>Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-info-50');
      expect(badge).toHaveClass('text-info-600');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-success-100');
      expect(badge).toHaveClass('text-success-700');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning-100');
      expect(badge).toHaveClass('text-warning-700');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-error-50');
      expect(badge).toHaveClass('text-error-600');
    });

    it('should render medium size by default', () => {
      render(<Badge>Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should apply custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
    });

    it('should have rounded-full class', () => {
      render(<Badge>Rounded</Badge>);
      const badge = screen.getByText('Rounded');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should render as span element', () => {
      const { container } = render(<Badge>Span</Badge>);
      const badge = container.firstChild;
      expect(badge).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Badge>Text Content</Badge>);
      expect(screen.getByText('Text Content')).toBeInTheDocument();
    });

    it('should render number content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render with icon and text', () => {
      render(
        <Badge>
          <span>🔥</span>
          <span>Hot</span>
        </Badge>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Hot')).toBeInTheDocument();
    });

    it('should handle long text with whitespace-nowrap', () => {
      render(<Badge>Very Long Badge Text</Badge>);
      const badge = screen.getByText('Very Long Badge Text');
      expect(badge).toHaveClass('whitespace-nowrap');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('should render all variant and size combinations', () => {
      const variants: Array<'success' | 'warning' | 'error' | 'info'> = [
        'success',
        'warning',
        'error',
        'info',
      ];
      const sizes: Array<'sm' | 'md'> = ['sm', 'md'];

      variants.forEach((variant) => {
        sizes.forEach((size) => {
          const { unmount } = render(
            <Badge variant={variant} size={size}>
              {variant}-{size}
            </Badge>
          );
          expect(screen.getByText(`${variant}-${size}`)).toBeInTheDocument();
          unmount();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations - success', async () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - warning', async () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - error', async () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - info', async () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient color contrast for success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      // Testing that contrast classes are applied
      expect(badge).toHaveClass('bg-success-100');
      expect(badge).toHaveClass('text-success-700');
    });

    it('should have sufficient color contrast for warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning-100');
      expect(badge).toHaveClass('text-warning-700');
    });

    it('should have sufficient color contrast for error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-error-50');
      expect(badge).toHaveClass('text-error-600');
    });

    it('should have sufficient color contrast for info variant', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-info-50');
      expect(badge).toHaveClass('text-info-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      render(<Badge>{''}</Badge>);
      const { container } = render(<Badge>{''}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle zero as content', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle multiple badges', () => {
      render(
        <>
          <Badge variant="success">Badge 1</Badge>
          <Badge variant="warning">Badge 2</Badge>
          <Badge variant="error">Badge 3</Badge>
        </>
      );
      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    it('should not affect inline layout', () => {
      render(<Badge>Inline</Badge>);
      const badge = screen.getByText('Inline');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('Use Cases', () => {
    it('should work as status indicator', () => {
      render(
        <div>
          Status: <Badge variant="success">Active</Badge>
        </div>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should work as counter badge', () => {
      render(
        <button>
          Notifications <Badge variant="error" size="sm">3</Badge>
        </button>
      );
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should work as category tag', () => {
      render(
        <div>
          Categories:
          <Badge variant="info" size="sm">React</Badge>
          <Badge variant="info" size="sm">TypeScript</Badge>
        </div>
      );
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });
});
