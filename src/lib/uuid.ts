function hasRandomUUID(): boolean {
  return typeof globalThis.crypto?.randomUUID === 'function';
}

function hasGetRandomValues(): boolean {
  return typeof globalThis.crypto?.getRandomValues === 'function';
}

function generateUuidFromRandomValues(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  // RFC 4122 version 4 UUID bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuid(): string {
  if (hasRandomUUID()) {
    return globalThis.crypto.randomUUID();
  }

  if (hasGetRandomValues()) {
    return generateUuidFromRandomValues();
  }

  // Last-resort fallback for very old runtimes.
  return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
