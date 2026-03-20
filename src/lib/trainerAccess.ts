const TRAINER_ACCESS_SESSION_KEY = 'fitwizard-trainer-access-unlocked';

function getConfiguredValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getTrainerAccessConfig() {
  const username = getConfiguredValue(import.meta.env.VITE_TRAINER_ACCESS_USERNAME);
  const passcode = getConfiguredValue(import.meta.env.VITE_TRAINER_ACCESS_PASSCODE);

  return {
    username,
    passcode,
    enabled: Boolean(username && passcode),
  };
}

export function isTrainerAccessUnlocked(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(TRAINER_ACCESS_SESSION_KEY) === 'true';
}

export function unlockTrainerAccessSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(TRAINER_ACCESS_SESSION_KEY, 'true');
}
