import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Spinner } from '../../../../src/components/atoms/Spinner';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render small size', () => {
      render(<Spinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('h-4');
    });

    it('should render medium size by default', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-6');
      expect(spinner).toHaveClass('h-6');
    });

    it('should render large size', () => {
      render(<Spinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-8');
      expect(spinner).toHaveClass('h-8');
    });

    it('should render current color by default', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-current');
    });

    it('should render primary color', () => {
      render(<Spinner color="primary" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-primary-500');
    });

    it('should render white color', () => {
      render(<Spinner color="white" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-white');
    });

    it('should render neutral color', () => {
      render(<Spinner color="neutral" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-neutral-300');
    });

    it('should apply custom className', () => {
      render(<Spinner className="custom-class" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });

    it('should have spin animation', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have role="status"', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('should have default aria-label', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should support custom aria-label', () => {
      render(<Spinner aria-label="Loading dashboard" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading dashboard');
    });

    it('should have screen reader only text', () => {
      render(<Spinner aria-label="Custom loading" />);
      expect(screen.getByText('Custom loading')).toHaveClass('sr-only');
    });
  });

  describe('Color Combinations', () => {
    it('should render all size and color combinations', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      const colors: Array<'current' | 'primary' | 'white' | 'neutral'> = [
        'current',
        'primary',
        'white',
        'neutral',
      ];

      sizes.forEach((size) => {
        colors.forEach((color) => {
          const { unmount } = render(<Spinner size={size} color={color} />);
          expect(screen.getByRole('status')).toBeInTheDocument();
          unmount();
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spinners on the same page', () => {
      render(
        <>
          <Spinner aria-label="Spinner 1" />
          <Spinner aria-label="Spinner 2" />
          <Spinner aria-label="Spinner 3" />
        </>
      );
      expect(screen.getAllByRole('status')).toHaveLength(3);
    });
  });
});
