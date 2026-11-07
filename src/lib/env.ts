// Where is the app running?
//   - "web":    the normal website (npm run dev / deployed site)
//   - "popup":  the Chrome extension's toolbar popup
//   - "window": the extension's own small floating window (opened from the popup)

export type AppSurface = "web" | "popup" | "window";

export const isExtension = (): boolean =>
  typeof chrome !== "undefined" && !!chrome.runtime?.id;

export const getSurface = (): AppSurface => {
  if (!isExtension()) return "web";
  return new URLSearchParams(window.location.search).get("mode") === "window"
    ? "window"
    : "popup";
};

// Document Picture-in-Picture: an always-on-top window that floats over every
// app on the computer (Chrome / Edge 116+ on desktop).
export const supportsAlwaysOnTop = (): boolean =>
  typeof window !== "undefined" && "documentPictureInPicture" in window;
