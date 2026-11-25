import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SetLog } from '@/types/fitness';
import { SetLogger } from '../SetLogger';

vi.mock('@/components/tools/PlateCalculator', () => ({
    PlateCalculatorDialog: () => null,
}));

const keyboardMock = vi.hoisted(() => ({
    useKeyboard: vi.fn(() => ({ isOpen: false, height: 0 })),
}));
vi.mock('@/hooks/useKeyboard', () => keyboardMock);

const completedPreviousSet: SetLog = {
    setNumber: 1,
    weight: 50,
    weightUnit: 'lbs',
    reps: 10,
    rir: 2,
    effortMode: 'rir',
    completed: true,
};

describe('SetLogger', () => {
    it('names its group and inputs so they can be found by role', () => {
        render(<SetLogger setNumber={2} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />);

        const group = screen.getByRole('group', { name: 'Set 2' });
        expect(group).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Weight (lbs)' })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Reps' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Increase weight' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Decrease reps' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'RIR' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('prefills from a completed previous set without locking this set', () => {
        const onComplete = vi.fn();
        render(
            <SetLogger
                setNumber={2}
                targetReps="8-12"
                targetRIR={2}
                previousSet={completedPreviousSet}
                onComplete={onComplete}
            />,
        );

        const weight = screen.getByRole('spinbutton', { name: 'Weight (lbs)' });
        expect(weight).toHaveValue(50);
        expect(weight).toBeEnabled();
        expect(screen.queryByRole('img', { name: 'Set completed' })).not.toBeInTheDocument();

        fireEvent.change(weight, { target: { value: '40' } });
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Reps' }), { target: { value: '8' } });
        fireEvent.click(screen.getByRole('button', { name: 'Complete Set' }));

        expect(onComplete).toHaveBeenCalledWith(
            expect.objectContaining({ setNumber: 2, weight: 40, reps: 8, completed: true }),
        );
        expect(screen.getByRole('img', { name: 'Set completed' })).toBeInTheDocument();
    });

    it('keeps its own logged values when the previous set changes afterwards', () => {
        const { rerender } = render(
            <SetLogger setNumber={2} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />,
        );
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Weight (lbs)' }), { target: { value: '30' } });
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Reps' }), { target: { value: '12' } });
        fireEvent.click(screen.getByRole('button', { name: 'Complete Set' }));

        rerender(
            <SetLogger
                setNumber={2}
                targetReps="8-12"
                targetRIR={2}
                previousSet={completedPreviousSet}
                onComplete={vi.fn()}
            />,
        );

        expect(screen.getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue(30);
        expect(screen.getByRole('spinbutton', { name: 'Reps' })).toHaveValue(12);
    });
});

describe('SetLogger with its own saved log', () => {
    it('shows a completed saved log as done, with its values', () => {
        render(
            <SetLogger
                setNumber={1}
                targetReps="8-12"
                targetRIR={2}
                loggedSet={{ ...completedPreviousSet, weight: 45, reps: 9 }}
                onComplete={vi.fn()}
            />,
        );

        expect(screen.getByRole('img', { name: 'Set completed' })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue(45);
        expect(screen.getByRole('spinbutton', { name: 'Reps' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Complete Set' })).not.toBeInTheDocument();
    });

    it('unlocks when reused for a set that has not been logged yet', () => {
        const { rerender } = render(
            <SetLogger
                setNumber={1}
                targetReps="8-12"
                targetRIR={2}
                loggedSet={completedPreviousSet}
                onComplete={vi.fn()}
            />,
        );
        rerender(
            <SetLogger
                setNumber={1}
                targetReps="8-12"
                targetRIR={2}
                loggedSet={{ ...completedPreviousSet, weight: 0, reps: 0, completed: false }}
                onComplete={vi.fn()}
            />,
        );

        expect(screen.queryByRole('img', { name: 'Set completed' })).not.toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Weight (lbs)' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Complete Set' })).toBeInTheDocument();
    });

    it('mounts the native keyboard hook and leaves the layout alone while it is closed', () => {
        keyboardMock.useKeyboard.mockClear();
        render(<SetLogger setNumber={1} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />);

        expect(keyboardMock.useKeyboard).toHaveBeenCalled();
        expect(screen.getByRole('group', { name: 'Set 1' }).style.paddingBottom).toBe('');
    });

    it('pads below Complete Set by the keyboard height while the keyboard is open', () => {
        keyboardMock.useKeyboard.mockReturnValue({ isOpen: true, height: 320 });
        render(<SetLogger setNumber={1} targetReps="8-12" targetRIR={2} onComplete={vi.fn()} />);

        expect(screen.getByRole('group', { name: 'Set 1' }).style.paddingBottom).toBe('320px');
        keyboardMock.useKeyboard.mockReturnValue({ isOpen: false, height: 0 });
    });
});
