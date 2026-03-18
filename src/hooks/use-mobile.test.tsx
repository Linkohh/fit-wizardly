import { describe, expect, it } from 'vitest';
import { getViewportTier } from './use-mobile';

describe('getViewportTier', () => {
  it('classifies phone widths below the mobile breakpoint', () => {
    expect(getViewportTier(320)).toBe('phone');
    expect(getViewportTier(767)).toBe('phone');
  });

  it('classifies tablet widths between the mobile and desktop breakpoints', () => {
    expect(getViewportTier(768)).toBe('tablet');
    expect(getViewportTier(1023)).toBe('tablet');
  });

  it('classifies desktop widths at and above the desktop breakpoint', () => {
    expect(getViewportTier(1024)).toBe('desktop');
    expect(getViewportTier(1440)).toBe('desktop');
  });
});
