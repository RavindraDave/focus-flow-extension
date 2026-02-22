import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from '../../../../src/components/atoms/Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(<Input label="Email" required />);
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with helper text', () => {
      render(<Input label="Password" helperText="Must be at least 8 characters" />);
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should render with error message', () => {
      render(<Input label="Email" error="Invalid email address" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email address');
    });

    it('should not show helper text when error is present', () => {
      render(
        <Input
          label="Email"
          error="Invalid email"
          helperText="Enter your email address"
        />
      );
      expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('should render full width', () => {
      const { container } = render(<Input label="Full Width" fullWidth />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full');
    });

    it('should apply custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should have error state styles when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have normal state styles when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-border');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should be disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-bg-tertiary');
    });

    it('should be readonly', () => {
      render(<Input readOnly value="Read only value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();

      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello World');
      expect((input as HTMLInputElement).value).toBe('Hello World');
    });

    it('should call onFocus when focused', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations - basic input', async () => {
      const { container } = render(<Input label="Basic Input" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - with error', async () => {
      const { container } = render(<Input label="Email" error="Invalid email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations - required field', async () => {
      const { container } = render(<Input label="Required Field" required />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should associate label with input via htmlFor/id', () => {
      render(<Input label="Test Label" id="test-input" />);
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'test-input');
      expect(input).toHaveAttribute('id', 'test-input');
    });

    it('should have aria-invalid=true when error is present', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-invalid=false when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-required when required', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should associate error message with input via aria-describedby', () => {
      render(<Input id="test-input" error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-describedby');
      const describedById = input.getAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id', describedById);
    });

    it('should associate helper text with input via aria-describedby', () => {
      render(<Input id="test-input" helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Helper text');

      expect(input).toHaveAttribute('aria-describedby');
      const describedById = input.getAttribute('aria-describedby');
      expect(helperText).toHaveAttribute('id', describedById);
    });

    it('should have focus ring styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
    });

    it('should have focus indicator with accent color when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-accent');
    });

    it('should have focus indicator with error color when error exists', () => {
      render(<Input error="Error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:ring-error');
    });
  });

  describe('Input Types', () => {
    it('should render as email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render as password input', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should render as number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render as url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow programmatic focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      render(<Input label="" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should generate unique IDs for multiple inputs', () => {
      render(
        <>
          <Input label="Input 1" />
          <Input label="Input 2" />
          <Input label="Input 3" />
        </>
      );

      const inputs = screen.getAllByRole('textbox');
      const ids = inputs.map(input => input.id);

      // All IDs should be unique
      expect(new Set(ids).size).toBe(3);
    });

    it('should handle long error messages', () => {
      const longError = 'This is a very long error message that might wrap to multiple lines in the UI';
      render(<Input error={longError} />);
      expect(screen.getByRole('alert')).toHaveTextContent(longError);
    });

    it('should pass through data attributes', () => {
      render(<Input data-testid="custom-input" />);
      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    });

    it('should handle controlled input', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'controlled');

      expect((input as HTMLInputElement).value).toBe('controlled');
    });
  });
});
