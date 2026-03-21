import { Capacitor } from "@capacitor/core";

export type NativePlatform = "ios" | "android" | "web";
export type WebPlatform = "ios" | "android" | "desktop";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePlatform(): NativePlatform {
  if (!isNativeApp()) {
    return "web";
  }

  const platform = Capacitor.getPlatform();
  if (platform === "ios" || platform === "android") {
    return platform;
  }

  return "web";
}

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent ?? "";
}

export function getWebPlatform(): WebPlatform {
  if (typeof navigator === "undefined") return "desktop";

  const userAgent = getUserAgent();
  const isIOSDevice =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOSDevice) return "ios";
  if (/Android/i.test(userAgent)) return "android";

  return "desktop";
}

export function canUseWebHaptics(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }

  return !isNativeApp() && getWebPlatform() === "android";
}

export function isIOSWebWithoutHaptics(): boolean {
  return !isNativeApp() && getWebPlatform() === "ios";
}
