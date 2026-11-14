import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  resetInstallPromptCaptureForTests,
  startInstallPromptCapture,
  subscribeInstallPrompt,
} from './install-prompt-capture';

function buildPromptEvent() {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
  });
}

describe('install prompt capture', () => {
  beforeEach(() => {
    resetInstallPromptCaptureForTests();
  });

  it('keeps an install prompt that fired before anything subscribed', () => {
    startInstallPromptCapture();
    const event = buildPromptEvent();

    window.dispatchEvent(event);

    expect(getDeferredInstallPrompt()).toBe(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('captures nothing until capture is started', () => {
    window.dispatchEvent(buildPromptEvent());
    expect(getDeferredInstallPrompt()).toBeNull();
  });

  it('registers its listeners only once', () => {
    const listener = vi.fn();
    startInstallPromptCapture();
    startInstallPromptCapture();
    subscribeInstallPrompt(listener);

    window.dispatchEvent(buildPromptEvent());

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = vi.fn();
    startInstallPromptCapture();
    const unsubscribe = subscribeInstallPrompt(listener);

    window.dispatchEvent(buildPromptEvent());
    unsubscribe();
    window.dispatchEvent(buildPromptEvent());

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('drops the prompt once the app is installed', () => {
    const listener = vi.fn();
    startInstallPromptCapture();
    window.dispatchEvent(buildPromptEvent());
    subscribeInstallPrompt(listener);

    window.dispatchEvent(new Event('appinstalled'));

    expect(getDeferredInstallPrompt()).toBeNull();
    expect(listener).toHaveBeenCalledWith('installed');
  });

  it('can be cleared after the prompt is used', () => {
    startInstallPromptCapture();
    window.dispatchEvent(buildPromptEvent());

    clearDeferredInstallPrompt();

    expect(getDeferredInstallPrompt()).toBeNull();
  });
});
