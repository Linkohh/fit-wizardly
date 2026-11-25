import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REMINDER_SETTINGS_KEY,
  defaultReminderDays,
  readReminderSettings,
  useReminderSettings,
} from './useReminderSettings';

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    getItem: async (name: string) => storage.get(name) ?? null,
    setItem: async (name: string, value: string) => {
      storage.set(name, value);
    },
    removeItem: async (name: string) => {
      storage.delete(name);
    },
  },
}));

describe('useReminderSettings', () => {
  beforeEach(() => storage.clear());

  it('spreads default days across the week for the plan', () => {
    expect(defaultReminderDays(3)).toEqual([1, 3, 5]);
    expect(defaultReminderDays(4)).toEqual([1, 2, 4, 5]);
    expect(defaultReminderDays(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(defaultReminderDays(null)).toEqual([1, 3, 5]);
    expect(defaultReminderDays(12)).toHaveLength(7);
  });

  it('defaults to the plan days, switched off, at 18:00', async () => {
    const { result } = renderHook(() => useReminderSettings(2));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    expect(result.current.settings).toEqual({ enabled: false, days: [1, 4], hour: 18, minute: 0 });
  });

  it('saves to device storage and reads it back', async () => {
    const { result } = renderHook(() => useReminderSettings(3));
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    await act(() => result.current.save({ enabled: true, days: [2, 6], hour: 7, minute: 15 }));

    expect(JSON.parse(storage.get(REMINDER_SETTINGS_KEY) ?? 'null')).toEqual({
      enabled: true,
      days: [2, 6],
      hour: 7,
      minute: 15,
    });
    expect(window.localStorage.getItem(REMINDER_SETTINGS_KEY)).toBeNull();

    const reloaded = renderHook(() => useReminderSettings(3));
    await waitFor(() => expect(reloaded.result.current.settings?.enabled).toBe(true));
    expect(reloaded.result.current.settings?.days).toEqual([2, 6]);
  });

  it('drops malformed saved settings instead of throwing', async () => {
    storage.set(REMINDER_SETTINGS_KEY, '{"enabled":"yes","days":[9]}');
    await expect(readReminderSettings()).resolves.toBeNull();
    storage.set(REMINDER_SETTINGS_KEY, 'not json');
    await expect(readReminderSettings()).resolves.toBeNull();
  });
});
