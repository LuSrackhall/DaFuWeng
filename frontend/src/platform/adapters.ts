export type PlatformAdapter = {
  id: "browser" | "tauri" | "mobile-shell" | "harmony";
  canUseNativeShare: boolean;
  canUseNotifications: boolean;
};

export const browserAdapter: PlatformAdapter = {
  id: "browser",
  canUseNativeShare: typeof navigator !== "undefined" && "share" in navigator,
  canUseNotifications: typeof window !== "undefined" && "Notification" in window
};
