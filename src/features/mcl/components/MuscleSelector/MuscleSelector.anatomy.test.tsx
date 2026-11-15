import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MuscleSelector } from './MuscleSelector';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-apple-mobile', () => ({ useAppleMobile: () => false }));
vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({ shouldReduceMotion: true }),
}));
vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('./ui/SelectionSidebar', () => ({ default: () => <div data-testid="selection-sidebar" /> }));

const focusedLabels = () =>
  screen
    .getAllByRole('button')
    .map((element) => element.getAttribute('aria-label') ?? '')
    .filter((label) => label.endsWith('- focus'))
    .sort();

function typeInSearch(text: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });
  act(() => {
    vi.advanceTimersByTime(200);
  });
}

describe('MuscleSelector anatomy search and regions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('typing a nickname lists the matches and lights them up without selecting', () => {
    const onSelectionChange = vi.fn();
    render(<MuscleSelector showLegend={false} defaultView="front" onSelectionChange={onSelectionChange} />);

    typeInSearch('chest');

    const list = screen.getByTestId('anatomy-result-list');
    expect(within(list).getByText('Pectoralis Major')).toBeInTheDocument();
    expect(within(list).getByText('Serratus Anterior')).toBeInTheDocument();
    expect(focusedLabels()).toEqual(expect.arrayContaining(['Pectoralis Major (Left) - focus']));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('Select all adds every match to the selection, and clearing keeps it', () => {
    const onSelectionChange = vi.fn();
    render(<MuscleSelector showLegend={false} defaultView="front" onSelectionChange={onSelectionChange} />);

    typeInSearch('chest');
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));

    const selected = onSelectionChange.mock.calls.at(-1)?.[0] as string[];
    expect(selected).toEqual(expect.arrayContaining(['pectoralis-major-left', 'serratus-anterior-right']));

    const callsBeforeClear = onSelectionChange.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Clear matches' }));
    expect(screen.queryByTestId('anatomy-result-list')).not.toBeInTheDocument();
    expect(onSelectionChange.mock.calls.length).toBe(callsBeforeClear);
  });

  it('tapping one name selects just that muscle on both sides', () => {
    const onSelectionChange = vi.fn();
    render(<MuscleSelector showLegend={false} defaultView="front" onSelectionChange={onSelectionChange} />);

    typeInSearch('arms');
    fireEvent.click(within(screen.getByTestId('anatomy-result-list')).getByText('Biceps Brachii'));

    expect((onSelectionChange.mock.calls.at(-1)?.[0] as string[]).sort()).toEqual(['biceps-left', 'biceps-right']);
  });

  it('a search that only matches another view switches to it', () => {
    const onViewChange = vi.fn();
    render(<MuscleSelector showLegend={false} defaultView="front" onViewChange={onViewChange} />);

    typeInSearch('lats');

    expect(onViewChange).toHaveBeenCalledWith('back');
  });

  it('matches on the other layer show as highlighted ghosts, and group headings are not listed', () => {
    render(<MuscleSelector showLegend={false} defaultView="back" />);

    typeInSearch('calf');

    // Surface layer: gastrocnemius is active and focused; soleus and plantaris are deep.
    expect(focusedLabels()).toEqual(expect.arrayContaining(['Gastrocnemius (Left) - focus']));
    expect(document.querySelectorAll('path.muscle-path[data-ghost-highlight="true"]').length).toBe(4);

    const list = screen.getByTestId('anatomy-result-list');
    expect(within(list).queryByText('Calves')).not.toBeInTheDocument();
    expect(within(list).getByText(/Calves: 3 muscles/)).toBeInTheDocument();
  });

  it('the Back chip lists the region, and tapping it again clears it', () => {
    render(<MuscleSelector showLegend={false} defaultView="back" />);

    const chip = within(screen.getByTestId('region-chips')).getByRole('button', { name: 'Back region' });
    fireEvent.click(chip);

    const list = screen.getByTestId('anatomy-result-list');
    expect(within(list).getByText('Latissimus Dorsi')).toBeInTheDocument();
    expect(within(list).getByText('Infraspinatus')).toBeInTheDocument();
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(chip);
    expect(screen.queryByTestId('anatomy-result-list')).not.toBeInTheDocument();
  });

  it('typing clears the active chip', () => {
    render(<MuscleSelector showLegend={false} defaultView="back" />);

    const chip = within(screen.getByTestId('region-chips')).getByRole('button', { name: 'Back region' });
    fireEvent.click(chip);
    typeInSearch('calf');

    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('search and chip light up the same shapes for the same muscle', () => {
    render(<MuscleSelector showLegend={false} defaultView="back" />);

    typeInSearch('lats');
    const fromSearch = focusedLabels().filter((label) => label.startsWith('Latissimus'));

    fireEvent.click(within(screen.getByTestId('region-chips')).getByRole('button', { name: 'Back region' }));
    const fromChip = focusedLabels().filter((label) => label.startsWith('Latissimus'));

    expect(fromSearch.length).toBeGreaterThan(0);
    expect(fromChip).toEqual(fromSearch);
  });
});
