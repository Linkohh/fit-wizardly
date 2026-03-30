import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingProgress } from './OnboardingProgress';

vi.mock('framer-motion', () => ({
  motion: {
    circle: ({
      animate,
      initial: _initial,
      transition: _transition,
      children,
      ...props
    }: React.SVGProps<SVGCircleElement> & {
      animate?: { strokeDashoffset?: number };
      initial?: unknown;
      transition?: unknown;
    }) => (
      <circle data-stroke-dashoffset={String(animate?.strokeDashoffset ?? '')} {...props}>
        {children}
      </circle>
    ),
    span: ({
      children,
      initial: _initial,
      animate: _animate,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & {
      initial?: unknown;
      animate?: unknown;
    }) => <span {...props}>{children}</span>,
  },
}));

describe('OnboardingProgress', () => {
  it('clamps overflow values so the counter never exceeds the total', () => {
    const { container } = render(
      <OnboardingProgress progress={150} currentStep={4} totalSteps={3} />,
    );

    expect(screen.getByText('3/3')).toBeInTheDocument();

    const progressCircle = container.querySelector('[data-stroke-dashoffset]');
    expect(progressCircle).toHaveAttribute('data-stroke-dashoffset', '0');
  });

  it('clamps invalid low values to the first step', () => {
    render(<OnboardingProgress progress={-20} currentStep={0} totalSteps={0} />);

    expect(screen.getByText('1/1')).toBeInTheDocument();
  });
});
