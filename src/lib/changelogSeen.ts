const CHANGELOG_SEEN_KEY = 'fitwizard-changelog-seen';

/** Whether the release notes for `version` have been opened on this device. Storage failures count as seen. */
export function hasSeenChangelog(version: string): boolean {
  try {
    return window.localStorage.getItem(CHANGELOG_SEEN_KEY) === version;
  } catch {
    return true;
  }
}

export function markChangelogSeen(version: string): void {
  try {
    window.localStorage.setItem(CHANGELOG_SEEN_KEY, version);
  } catch {
    // Private mode or blocked storage: the unread dot simply keeps showing.
  }
}
