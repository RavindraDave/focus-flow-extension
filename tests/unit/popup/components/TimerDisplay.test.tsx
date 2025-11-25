/**
 * TimerDisplay component tests
 * Coverage: ≥80% line coverage
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TimerDisplay } from '../../../../src/popup/components/TimerDisplay';

describe('TimerDisplay', () => {
  describe('Timer Formatting', () => {
    it('should display formatted time correctly', () => {
      render(
        <TimerDisplay
          remainingSeconds={1500} // 25:00
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByRole('timer')).toHaveTextContent('25:00');
    });

    it('should pad single-digit seconds', () => {
      render(
        <TimerDisplay
          remainingSeconds={65} // 01:05
          totalSeconds={300}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByRole('timer')).toHaveTextContent('01:05');
    });

    it('should display zero correctly', () => {
      render(
        <TimerDisplay
          remainingSeconds={0}
          totalSeconds={1500}
          sessionType="work"
          isActive={false}
          isPaused={false}
        />
      );

      expect(screen.getByRole('timer')).toHaveTextContent('00:00');
    });
  });

  describe('Session Type Display', () => {
    it('should show "Focus Session" for work type', () => {
      render(
        <TimerDisplay
          remainingSeconds={1500}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByText('Focus Session')).toBeInTheDocument();
    });

    it('should show "Short Break" for short-break type', () => {
      render(
        <TimerDisplay
          remainingSeconds={300}
          totalSeconds={300}
          sessionType="short-break"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByText('Short Break')).toBeInTheDocument();
    });

    it('should show "Long Break" for long-break type', () => {
      render(
        <TimerDisplay
          remainingSeconds={900}
          totalSeconds={900}
          sessionType="long-break"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByText('Long Break')).toBeInTheDocument();
    });

    it('should show "Ready to Focus" when idle', () => {
      render(
        <TimerDisplay
          remainingSeconds={0}
          totalSeconds={0}
          sessionType={null}
          isActive={false}
          isPaused={false}
        />
      );

      expect(screen.getByText('Ready to Focus')).toBeInTheDocument();
    });
  });

  describe('Paused State', () => {
    it('should show "Paused" status when timer is paused', () => {
      render(
        <TimerDisplay
          remainingSeconds={1200}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={true}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Paused');
    });

    it('should not show "Paused" when timer is active', () => {
      render(
        <TimerDisplay
          remainingSeconds={1200}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    });
  });

  describe('Last Minute Warning', () => {
    it('should show "Last minute!" when 60 seconds or less remaining', () => {
      render(
        <TimerDisplay
          remainingSeconds={60}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Last minute!');
    });

    it('should not show warning when more than 60 seconds remaining', () => {
      render(
        <TimerDisplay
          remainingSeconds={61}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      expect(screen.queryByText('Last minute!')).not.toBeInTheDocument();
    });

    it('should not show warning when paused', () => {
      render(
        <TimerDisplay
          remainingSeconds={30}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={true}
        />
      );

      expect(screen.queryByText('Last minute!')).not.toBeInTheDocument();
    });
  });

  describe('Progress Ring', () => {
    it('should render progress ring SVG', () => {
      const { container } = render(
        <TimerDisplay
          remainingSeconds={750} // 50% progress
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('role', 'img');
    });

    it('should have accessible progress label', () => {
      render(
        <TimerDisplay
          remainingSeconds={750} // 50% progress
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      const svg = screen.getByRole('img');
      expect(svg).toHaveAccessibleName(/Timer progress: 50% remaining/i);
    });

    it('should calculate 0% progress when totalSeconds is 0', () => {
      render(
        <TimerDisplay
          remainingSeconds={0}
          totalSeconds={0}
          sessionType={null}
          isActive={false}
          isPaused={false}
        />
      );

      const svg = screen.getByRole('img');
      expect(svg).toHaveAccessibleName(/Timer progress: 0% remaining/i);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TimerDisplay
          remainingSeconds={1500}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have ARIA live region for timer updates', () => {
      render(
        <TimerDisplay
          remainingSeconds={1500}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
      expect(timer).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Color Coding', () => {
    it('should use primary color for work sessions', () => {
      render(
        <TimerDisplay
          remainingSeconds={1500}
          totalSeconds={1500}
          sessionType="work"
          isActive={true}
          isPaused={false}
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer.className).toContain('text-accent');
    });

    it('should use success color for break sessions', () => {
      render(
        <TimerDisplay
          remainingSeconds={300}
          totalSeconds={300}
          sessionType="short-break"
          isActive={true}
          isPaused={false}
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer.className).toContain('text-success');
    });

    it('should use neutral color when idle', () => {
      render(
        <TimerDisplay
          remainingSeconds={0}
          totalSeconds={0}
          sessionType={null}
          isActive={false}
          isPaused={false}
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer.className).toContain('text-text-muted');
    });
  });
});
