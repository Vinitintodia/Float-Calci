// Where is the app running?
//   - "web":    the normal website (npm run dev / deployed site)
//   - "popup":  the Chrome extension's toolbar popup
//   - "window": the extension's own small floating window (can float above all apps)
//   - "overlay": the calculator shown on top of a web page (inside an iframe)

export type AppSurface = "web" | "popup" | "window" | "overlay";

export const isExtension = (): boolean =>
  typeof chrome !== "undefined" && !!chrome.runtime?.id;

export const getSurface = (): AppSurface => {
  if (!isExtension()) return "web";
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "window" ? "window" : mode === "overlay" ? "overlay" : "popup";
};

// Document Picture-in-Picture: an always-on-top window that floats over every
// app on the computer (Chrome / Edge 116+ on desktop).
export const supportsAlwaysOnTop = (): boolean =>
  typeof window !== "undefined" && "documentPictureInPicture" in window;
