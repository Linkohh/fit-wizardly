import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExerciseSearch } from './ExerciseSearch';

const mocks = vi.hoisted(() => ({
  searchState: {
    data: [],
    isLoading: false,
    error: null as string | null,
    warning: null as string | null,
    currentQuery: 'Leg',
    hasEmptyResults: false,
    searchPrimary: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock('@/hooks/useExerciseSearch', () => ({
  useExerciseSearch: () => mocks.searchState,
}));

describe('ExerciseSearch', () => {
  beforeEach(() => {
    mocks.searchState.data = [];
    mocks.searchState.isLoading = false;
    mocks.searchState.error = null;
    mocks.searchState.warning = null;
    mocks.searchState.currentQuery = 'Leg';
    mocks.searchState.hasEmptyResults = false;
    mocks.searchState.searchPrimary.mockReset();
    mocks.searchState.reset.mockReset();
  });

  it('shows live-search warnings without also rendering empty-result copy', () => {
    mocks.searchState.warning =
      'Live exercise search is unavailable. The offline catalog remains available for browsing and workout generation.';
    mocks.searchState.hasEmptyResults = true;

    render(<ExerciseSearch />);

    expect(screen.getByText(/live exercise search is unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/no exercises found/i)).not.toBeInTheDocument();
  });
});
