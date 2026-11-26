import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetKeyboardForTests, useKeyboard } from './useKeyboard';

type Listener = (info?: { keyboardHeight: number }) => void;

const mocks = vi.hoisted(() => ({
  native: false,
  platform: 'web' as 'ios' | 'android' | 'web',
  listeners: new Map<string, Listener>(),
  remove: vi.fn(async () => undefined),
  addListener: vi.fn(),
  setResizeMode: vi.fn(async () => undefined),
  setScroll: vi.fn(async () => undefined),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.native,
  getNativePlatform: () => mocks.platform,
}));

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: mocks.addListener,
    setResizeMode: mocks.setResizeMode,
    setScroll: mocks.setScroll,
  },
  KeyboardResize: { Body: 'body' },
}));

function setNative(platform: 'ios' | 'android' | 'web') {
  mocks.native = platform !== 'web';
  mocks.platform = platform;
}

describe('useKeyboard', () => {
  beforeEach(() => {
    resetKeyboardForTests();
    setNative('web');
    mocks.listeners.clear();
    mocks.remove.mockClear();
    mocks.setResizeMode.mockClear();
    mocks.setScroll.mockClear();
    mocks.addListener.mockReset();
    mocks.addListener.mockImplementation(async (event: string, listener: Listener) => {
      mocks.listeners.set(event, listener);
      return { remove: mocks.remove };
    });
  });

  it('does nothing on the web', async () => {
    const { result } = renderHook(() => useKeyboard());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current).toEqual({ isOpen: false, height: 0 });
    expect(mocks.addListener).not.toHaveBeenCalled();
  });

  it('sets the iOS resize mode and tracks the keyboard', async () => {
    setNative('ios');
    const { result } = renderHook(() => useKeyboard());
    await waitFor(() => expect(mocks.listeners.size).toBe(3));
    expect(mocks.setResizeMode).toHaveBeenCalledWith({ mode: 'body' });
    expect(mocks.setScroll).toHaveBeenCalledWith({ isDisabled: false });

    act(() => mocks.listeners.get('keyboardWillShow')?.({ keyboardHeight: 320 }));
    expect(result.current).toEqual({ isOpen: true, height: 320 });

    act(() => mocks.listeners.get('keyboardWillHide')?.());
    expect(result.current).toEqual({ isOpen: false, height: 0 });
  });

  it('skips the iOS-only calls on Android', async () => {
    setNative('android');
    renderHook(() => useKeyboard());
    await waitFor(() => expect(mocks.listeners.size).toBe(3));
    expect(mocks.setResizeMode).not.toHaveBeenCalled();
    expect(mocks.setScroll).not.toHaveBeenCalled();
  });

  it('scrolls the focused input into view once the keyboard is open', async () => {
    setNative('android');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const scrollIntoView = vi.fn();
    input.scrollIntoView = scrollIntoView;

    renderHook(() => useKeyboard());
    await waitFor(() => expect(mocks.listeners.size).toBe(3));
    act(() => mocks.listeners.get('keyboardDidShow')?.({ keyboardHeight: 280 }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    input.remove();
  });

  it('removes its listeners on unmount', async () => {
    setNative('ios');
    const { unmount } = renderHook(() => useKeyboard());
    await waitFor(() => expect(mocks.listeners.size).toBe(3));
    unmount();
    expect(mocks.remove).toHaveBeenCalledTimes(3);
  });
});
