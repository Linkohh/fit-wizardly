import { Capacitor } from "@capacitor/core";

export type NativePlatform = "ios" | "android" | "web";

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
