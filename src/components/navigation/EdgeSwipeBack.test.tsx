import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { BROWSER_BACK_GRACE_MS } from '@/hooks/useEdgeSwipeBack';
import { EdgeSwipeBack } from './EdgeSwipeBack';

vi.mock('@/hooks/useInteractionFeedback', () => ({
  useInteractionFeedback: () => ({ emit: vi.fn(async () => undefined) }),
}));

function CurrentPath() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

function renderAt(entries: string[], initialIndex = entries.length - 1) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
      <EdgeSwipeBack />
      <CurrentPath />
    </MemoryRouter>
  );
}

function swipe(fromX: number, toX: number, y = 300) {
  fireEvent.touchStart(window, { touches: [{ clientX: fromX, clientY: y }] });
  fireEvent.touchMove(window, { touches: [{ clientX: (fromX + toX) / 2, clientY: y }] });
  fireEvent.touchMove(window, { touches: [{ clientX: toX, clientY: y }] });
  fireEvent.touchEnd(window, { touches: [] });
}

describe('EdgeSwipeBack', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('goes back after a long swipe from the left edge', () => {
    renderAt(['/profile', '/legal']);

    swipe(5, 150);
    act(() => {
      vi.advanceTimersByTime(BROWSER_BACK_GRACE_MS + 10);
    });

    expect(screen.getByTestId('path')).toHaveTextContent('/profile');
  });

  it('shows an indicator that arms once the swipe is far enough', () => {
    renderAt(['/profile', '/legal']);

    fireEvent.touchStart(window, { touches: [{ clientX: 4, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 40, clientY: 300 }] });
    expect(screen.getByTestId('edge-swipe-indicator')).toHaveAttribute('data-armed', 'false');

    fireEvent.touchMove(window, { touches: [{ clientX: 120, clientY: 300 }] });
    expect(screen.getByTestId('edge-swipe-indicator')).toHaveAttribute('data-armed', 'true');

    fireEvent.touchEnd(window, { touches: [] });
    expect(screen.queryByTestId('edge-swipe-indicator')).not.toBeInTheDocument();
  });

  it('ignores short swipes, swipes away from the edge, and vertical scrolls', () => {
    renderAt(['/profile', '/legal']);

    swipe(5, 40); // too short
    swipe(120, 300); // not from the edge
    fireEvent.touchStart(window, { touches: [{ clientX: 5, clientY: 100 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 30, clientY: 400 }] }); // scrolling
    fireEvent.touchMove(window, { touches: [{ clientX: 150, clientY: 400 }] });
    fireEvent.touchEnd(window, { touches: [] });

    act(() => {
      vi.advanceTimersByTime(BROWSER_BACK_GRACE_MS + 10);
    });
    expect(screen.getByTestId('path')).toHaveTextContent('/legal');
  });

  it("does not go back twice when the browser's own swipe already did", () => {
    renderAt(['/', '/profile', '/legal']);

    swipe(5, 150);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
      vi.advanceTimersByTime(BROWSER_BACK_GRACE_MS + 10);
    });

    // MemoryRouter ignores window popstate, so the path staying put proves our handler skipped.
    expect(screen.getByTestId('path')).toHaveTextContent('/legal');
  });

  it('is disabled on the home page', () => {
    renderAt(['/']);

    fireEvent.touchStart(window, { touches: [{ clientX: 4, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 120, clientY: 300 }] });
    expect(screen.queryByTestId('edge-swipe-indicator')).not.toBeInTheDocument();
  });
});
