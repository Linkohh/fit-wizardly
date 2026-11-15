import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SCULPT_DEFAULT } from '../lib/sculpt';
import { useSculptPrefs } from './useSculptPrefs';

const KEY = 'fitwizard.mcl.sculpt.v1';

describe('useSculptPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to { sculptLevel: 60, layer: "surface" }', () => {
    const { result } = renderHook(() => useSculptPrefs());
    expect(result.current.sculptLevel).toBe(SCULPT_DEFAULT);
    expect(SCULPT_DEFAULT).toBe(60);
    expect(result.current.layer).toBe('surface');
  });

  it('persists changes and restores them on remount', () => {
    const first = renderHook(() => useSculptPrefs());
    act(() => {
      first.result.current.setSculptLevel(25);
      first.result.current.setLayer('deep');
    });
    first.unmount();
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ sculptLevel: 25, layer: 'deep' });

    const second = renderHook(() => useSculptPrefs());
    expect(second.result.current.sculptLevel).toBe(25);
    expect(second.result.current.layer).toBe('deep');
  });

  it('clamps sculptLevel to 0-100', () => {
    const { result } = renderHook(() => useSculptPrefs());
    act(() => result.current.setSculptLevel(250));
    expect(result.current.sculptLevel).toBe(100);
    act(() => result.current.setSculptLevel(-5));
    expect(result.current.sculptLevel).toBe(0);
  });

  it('falls back to defaults when stored JSON is malformed', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useSculptPrefs());
    expect(result.current.sculptLevel).toBe(SCULPT_DEFAULT);
    expect(result.current.layer).toBe('surface');
  });

  it('falls back to defaults when stored values fail the schema (sculptLevel: 900)', () => {
    localStorage.setItem(KEY, JSON.stringify({ sculptLevel: 900, layer: 'deep' }));
    const { result } = renderHook(() => useSculptPrefs());
    expect(result.current.sculptLevel).toBe(SCULPT_DEFAULT);
    expect(result.current.layer).toBe('surface');
  });

  it('still works when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useSculptPrefs());
    act(() => result.current.setSculptLevel(40));
    expect(result.current.sculptLevel).toBe(40);
  });

  it('falls back to defaults when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const { result } = renderHook(() => useSculptPrefs());
    expect(result.current.sculptLevel).toBe(SCULPT_DEFAULT);
  });
});
