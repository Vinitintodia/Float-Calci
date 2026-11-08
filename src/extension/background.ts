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
  const win = await chrome.windows.create({ url, type: "popup", width: 400, height: 720, focused: true });
  await chrome.storage.session.set({ [WINDOW_KEY]: win.id });
};

// Clicking the toolbar icon (or Alt+Shift+C) puts a floating calculator on the
// current page. Chrome doesn't allow that on its own pages (chrome://, the Web
// Store, the new tab page), so there we open the separate floating window.
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return openFloatingWindow();
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["assets/overlay.js"] });
  } catch {
    await openFloatingWindow();
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
