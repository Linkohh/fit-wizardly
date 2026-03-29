import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LivingBackground } from './living-background';

const mocks = vi.hoisted(() => ({
  isMobile: false,
  theme: 'dark' as 'dark' | 'light',
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: (selector?: (state: { getEffectiveTheme: () => 'dark' | 'light' }) => unknown) => {
    const state = {
      getEffectiveTheme: () => mocks.theme,
    };

    return selector ? selector(state) : state;
  },
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mocks.isMobile,
}));

describe('LivingBackground', () => {
  beforeEach(() => {
    mocks.isMobile = false;
    mocks.theme = 'dark';
  });

  it('keeps cool and warm accent blobs visible in the mobile atmosphere mix', () => {
    mocks.isMobile = true;

    render(<LivingBackground />);

    const blobs = screen.getAllByTestId('living-background-blob');
    const blobColors = blobs.map((blob) => blob.getAttribute('data-blob-color'));

    expect(blobs).toHaveLength(6);
    expect(blobColors).toContain('rgba(34, 211, 238, 0.6)');
    expect(blobColors).toContain('rgba(251, 146, 60, 0.45)');
    expect(blobColors).toContain('rgba(6, 182, 212, 0.55)');
  });
});
