import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetShareForTests, useShare } from './useShare';

const mocks = vi.hoisted(() => ({
  native: false,
  share: vi.fn(async () => ({ activityType: 'test' })),
  writeFile: vi.fn(async ({ path }: { path: string }) => ({ uri: `file:///cache/${path}` })),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => mocks.native,
}));

vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: mocks.writeFile },
  Directory: { Cache: 'CACHE' },
}));

const originalShare = navigator.share;
const originalCanShare = navigator.canShare;

function setWebShare(share?: (data: ShareData) => Promise<void>, canShare?: (data: ShareData) => boolean) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true, writable: true });
}

function makeFile() {
  return new File([new Uint8Array([137, 80, 78, 71])], 'fitwizard card.png', { type: 'image/png' });
}

describe('useShare', () => {
  beforeEach(() => {
    resetShareForTests();
    mocks.native = false;
    mocks.share.mockClear();
    mocks.writeFile.mockClear();
  });

  afterEach(() => {
    setWebShare(originalShare, originalCanShare);
  });

  describe('web', () => {
    it('uses navigator.share and never loads the native plugin', async () => {
      const webShare = vi.fn(async () => undefined);
      setWebShare(webShare);
      const { result } = renderHook(() => useShare());

      expect(result.current.canShare({ title: 'Hi' })).toBe(true);
      await expect(result.current.share({ title: 'Hi', text: 'Done', url: 'https://x.test' })).resolves.toBe(true);
      expect(webShare).toHaveBeenCalledWith({ title: 'Hi', text: 'Done', url: 'https://x.test' });
      expect(mocks.share).not.toHaveBeenCalled();
    });

    it('reports false when the person cancels', async () => {
      setWebShare(vi.fn(async () => { throw new DOMException('cancelled', 'AbortError'); }));
      const { result } = renderHook(() => useShare());
      await expect(result.current.share({ title: 'Hi' })).resolves.toBe(false);
    });

    it('reports it cannot share when the Web Share API is missing', async () => {
      setWebShare(undefined);
      const { result } = renderHook(() => useShare());
      expect(result.current.canShare({ title: 'Hi' })).toBe(false);
      await expect(result.current.share({ title: 'Hi' })).resolves.toBe(false);
    });

    it('only shares files when canShare allows it', async () => {
      const webShare = vi.fn(async () => undefined);
      setWebShare(webShare, () => false);
      const { result } = renderHook(() => useShare());
      const data = { title: 'Card', files: [makeFile()] };

      expect(result.current.canShare(data)).toBe(false);
      await expect(result.current.share(data)).resolves.toBe(false);
      expect(webShare).not.toHaveBeenCalled();
    });
  });

  describe('native', () => {
    beforeEach(() => {
      mocks.native = true;
    });

    it('calls the Share plugin', async () => {
      const { result } = renderHook(() => useShare());
      expect(result.current.canShare()).toBe(true);
      await expect(result.current.share({ title: 'Hi', text: 'Done', url: 'https://x.test' })).resolves.toBe(true);
      expect(mocks.share).toHaveBeenCalledWith({
        title: 'Hi',
        text: 'Done',
        url: 'https://x.test',
        files: undefined,
        dialogTitle: 'Hi',
      });
      expect(mocks.writeFile).not.toHaveBeenCalled();
    });

    it('writes files to the cache folder and shares their URLs', async () => {
      const { result } = renderHook(() => useShare());
      await expect(result.current.share({ title: 'Card', files: [makeFile()] })).resolves.toBe(true);

      expect(mocks.writeFile).toHaveBeenCalledWith({
        path: 'share/fitwizard_card.png',
        data: btoa(String.fromCharCode(137, 80, 78, 71)),
        directory: 'CACHE',
        recursive: true,
      });
      expect(mocks.share).toHaveBeenCalledWith(
        expect.objectContaining({ files: ['file:///cache/share/fitwizard_card.png'] }),
      );
    });

    it('reports false when the sheet is cancelled', async () => {
      mocks.share.mockRejectedValueOnce(new Error('Share canceled'));
      const { result } = renderHook(() => useShare());
      await expect(result.current.share({ title: 'Hi' })).resolves.toBe(false);
    });

    it('reports false without sharing if a file cannot be written', async () => {
      mocks.writeFile.mockRejectedValueOnce(new Error('disk full'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { result } = renderHook(() => useShare());
      await expect(result.current.share({ title: 'Card', files: [makeFile()] })).resolves.toBe(false);
      expect(mocks.share).not.toHaveBeenCalled();
    });
  });
});
