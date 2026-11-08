// Extension service worker (Manifest V3 background).
// Shows the floating calculator on the current page, or opens the separate
// floating window (keeping only one of them).

const WINDOW_KEY = "floatWindowId";

const openFloatingWindow = async (calc?: string) => {
  const { [WINDOW_KEY]: existing } = await chrome.storage.session.get(WINDOW_KEY);
  if (typeof existing === "number") {
    try {
      await chrome.windows.update(existing, { focused: true, state: "normal" });
      return;
    } catch {
      // It was closed; open a new one below.
    }
  }

  const url = chrome.runtime.getURL(`popup.html?mode=window${calc ? `&calc=${calc}` : ""}`);
  const width = 400;
  const height = 720;
  // A normal small window at the right edge of the browser window you're using
  // (not a full-screen space, even if the browser itself is full screen).
  let left: number | undefined;
  let top: number | undefined;
  try {
    const current = await chrome.windows.getLastFocused();
    if (current.left !== undefined && current.width !== undefined) left = Math.max(0, current.left + current.width - width - 24);
    if (current.top !== undefined) top = current.top + 80;
  } catch {
    /* no browser window: let Chrome choose */
  }
  const win = await chrome.windows.create({ url, type: "popup", width, height, left, top, state: "normal", focused: true });
  await chrome.storage.session.set({ [WINDOW_KEY]: win.id });
};

// Pages where Chrome doesn't let any extension draw: its own pages, the new tab
// page, the Web Store, and other extensions' pages.
const RESTRICTED = [
  /^(chrome|edge|brave|opera|vivaldi|about|devtools|view-source|chrome-extension|chrome-search|chrome-untrusted):/i,
  /^https:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com|microsoftedge\.microsoft\.com\/addons)/i,
];
const isRestricted = (url?: string) => !url || RESTRICTED.some((r) => r.test(url));

/**
 * Where we can't draw on the page, show the calculator as a popup under the
 * toolbar icon instead (still inside the browser), with a note saying why.
 */
const showAsPopup = async (tabId: number, reason: "restricted" | "file" | "blocked") => {
  try {
    await chrome.action.setPopup({ tabId, popup: `popup.html?notice=${reason}` });
    await chrome.action.openPopup();
  } catch {
    await openFloatingWindow(); // very old browsers without openPopup()
  } finally {
    // Next click on this tab goes back to "float it on the page"
    await chrome.action.setPopup({ tabId, popup: "" }).catch(() => {});
  }
};

// Clicking the toolbar icon (or Alt+Shift+C) puts a floating calculator on the
// current page.
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return openFloatingWindow();
  if (isRestricted(tab.url)) return showAsPopup(tab.id, "restricted");
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["assets/overlay.js"] });
  } catch (err) {
    console.warn("Float Calci: can't draw on this page", err);
    await showAsPopup(tab.id, tab.url?.startsWith("file:") ? "file" : "blocked");
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "open-floating-window") {
    openFloatingWindow(msg.calc).then(() => sendResponse({ ok: true }));
    return true; // keep the message channel open for the async response
  }
  return false;
});

// Keyboard shortcut (default Alt+Shift+F, change it at chrome://extensions/shortcuts)
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-floating-window") void openFloatingWindow();
});

chrome.windows.onRemoved.addListener(async (id) => {
  const { [WINDOW_KEY]: existing } = await chrome.storage.session.get(WINDOW_KEY);
  if (existing === id) await chrome.storage.session.remove(WINDOW_KEY);
});
