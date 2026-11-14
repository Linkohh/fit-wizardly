import type { DeferredInstallPromptEvent } from '@/lib/install-coach';

/**
 * Holds the browser's "this site can be installed" event (Android Chrome).
 *
 * The browser fires `beforeinstallprompt` once per page load, often before any
 * React component has mounted. Capturing it at app start means the one-tap
 * install is available whichever page the user landed on.
 */

export type InstallPromptChange = 'available' | 'installed';
type Listener = (change: InstallPromptChange) => void;

let deferredPrompt: DeferredInstallPromptEvent | null = null;
let started = false;
const listeners = new Set<Listener>();

function notify(change: InstallPromptChange): void {
  listeners.forEach((listener) => listener(change));
}

function handleBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  deferredPrompt = event as DeferredInstallPromptEvent;
  notify('available');
}

function handleAppInstalled(): void {
  deferredPrompt = null;
  notify('installed');
}

/** Call once at app start. Safe to call again. */
export function startInstallPromptCapture(): void {
  if (started || typeof window === 'undefined') {
    return;
  }

  started = true;
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
}

export function getDeferredInstallPrompt(): DeferredInstallPromptEvent | null {
  return deferredPrompt;
}

/** The browser allows each prompt event to be used once. */
export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}

export function subscribeInstallPrompt(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetInstallPromptCaptureForTests(): void {
  if (started && typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  }

  started = false;
  deferredPrompt = null;
  listeners.clear();
}
