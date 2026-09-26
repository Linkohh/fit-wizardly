const ABOUT_SEEN_KEY = 'fitwizard-about-seen';

/** Whether the user has opened the About page on this device. Storage failures count as "seen" so we never nag. */
export function hasSeenAbout(): boolean {
  try {
    return window.localStorage.getItem(ABOUT_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markAboutSeen(): void {
  try {
    window.localStorage.setItem(ABOUT_SEEN_KEY, '1');
  } catch {
    // Private mode or blocked storage: the "New" hint simply keeps showing.
  }
}
