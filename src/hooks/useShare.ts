import { useCallback } from 'react';
import { isNativeApp } from '@/lib/platform';

/**
 * Share sheet (contract #10, roadmap 2.4).
 *
 * - Native: `@capacitor/share`. Files are written to the app's cache folder
 *   with `@capacitor/filesystem` first, because the native sheet takes
 *   `file://` URLs, not `File` objects.
 * - Web: the Web Share API (`navigator.share`), as before.
 *
 * Both plugins load with a dynamic `import()` only on native.
 *
 * `share()` resolves `true` when the share went through, and `false` when
 * sharing isn't available, the person cancelled, or it failed. It never
 * throws. Callers that need a fallback (for example copying to the clipboard)
 * can check `canShare()` first, so a cancelled sheet doesn't also copy.
 */

export interface ShareData {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface UseShareResult {
  share(data: ShareData): Promise<boolean>;
  /** Whether `share(data)` can show a share sheet on this device. */
  canShare(data?: ShareData): boolean;
}

type ShareModule = typeof import('@capacitor/share');
type FilesystemModule = typeof import('@capacitor/filesystem');

let shareModulePromise: Promise<ShareModule | null> | null = null;
let filesystemModulePromise: Promise<FilesystemModule | null> | null = null;

function loadShareModule(): Promise<ShareModule | null> {
  if (!shareModulePromise) {
    shareModulePromise = import('@capacitor/share').catch(() => {
      shareModulePromise = null;
      return null;
    });
  }
  return shareModulePromise;
}

function loadFilesystemModule(): Promise<FilesystemModule | null> {
  if (!filesystemModulePromise) {
    filesystemModulePromise = import('@capacitor/filesystem').catch(() => {
      filesystemModulePromise = null;
      return null;
    });
  }
  return filesystemModulePromise;
}

/** Test helper: forget the cached plugins. */
export function resetShareForTests(): void {
  shareModulePromise = null;
  filesystemModulePromise = null;
}

/** Base64 without the `data:...;base64,` prefix, which is what Filesystem.writeFile expects. */
function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function safeFileName(name: string, index: number): string {
  const cleaned = name.replace(/[^\w.-]+/g, '_').replace(/^\.+/, '');
  return cleaned || `share-${index}`;
}

/** Writes files to the cache folder and returns their file:// URLs, or null on failure. */
async function writeFilesToCache(files: File[]): Promise<string[] | null> {
  const filesystemModule = await loadFilesystemModule();
  if (!filesystemModule) return null;
  const { Filesystem, Directory } = filesystemModule;

  try {
    const uris: string[] = [];
    for (const [index, file] of files.entries()) {
      const { uri } = await Filesystem.writeFile({
        path: `share/${safeFileName(file.name, index)}`,
        data: await fileToBase64(file),
        directory: Directory.Cache,
        recursive: true,
      });
      uris.push(uri);
    }
    return uris;
  } catch (error) {
    console.error('[Share] Could not prepare files:', error);
    return null;
  }
}

async function shareNative(data: ShareData): Promise<boolean> {
  const shareModule = await loadShareModule();
  if (!shareModule) return false;

  let fileUris: string[] | undefined;
  if (data.files && data.files.length > 0) {
    const uris = await writeFilesToCache(data.files);
    if (!uris) return false;
    fileUris = uris;
  }

  try {
    await shareModule.Share.share({
      title: data.title,
      text: data.text,
      url: data.url,
      files: fileUris,
      dialogTitle: data.title,
    });
    return true;
  } catch {
    // The person closed the sheet, or the platform couldn't share.
    return false;
  }
}

function toWebShareData(data: ShareData): globalThis.ShareData {
  const webData: globalThis.ShareData = { title: data.title };
  if (data.text) webData.text = data.text;
  if (data.url) webData.url = data.url;
  if (data.files && data.files.length > 0) webData.files = data.files;
  return webData;
}

function canShareOnWeb(data?: ShareData): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (!data?.files || data.files.length === 0) return true;
  // File sharing needs canShare(); browsers without it can't share files.
  return typeof navigator.canShare === 'function' && navigator.canShare(toWebShareData(data));
}

async function shareWeb(data: ShareData): Promise<boolean> {
  if (!canShareOnWeb(data)) return false;
  try {
    await navigator.share(toWebShareData(data));
    return true;
  } catch {
    // AbortError when the person cancels; anything else is a failed share.
    return false;
  }
}

export function useShare(): UseShareResult {
  const share = useCallback(
    (data: ShareData) => (isNativeApp() ? shareNative(data) : shareWeb(data)),
    [],
  );
  const canShare = useCallback(
    (data?: ShareData) => (isNativeApp() ? true : canShareOnWeb(data)),
    [],
  );
  return { share, canShare };
}
