# Float Calci – Developer Guide

Everything you need to work on the code: how it's put together, where things live, how to test, and how to ship.
For using the extension, see [CHROME_EXTENSION_GUIDE.md](../CHROME_EXTENSION_GUIDE.md). For the security model, see
[SECURITY.md](../SECURITY.md).

## 1. Setup

```bash
git clone https://github.com/Vinitintodia/Float-Calci.git
cd Float-Calci
npm install
npm run dev        # http://localhost:8080
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server for the website (hot reload) |
| `npm run build` | Builds the website **and** the Chrome extension into `dist/` |
| `npm test` | Vitest: finance maths, the financial keystroke engine, the expression parser |
| `npm run lint` | ESLint (should report 0 errors) |
| `npm run preview` | Serve the production build |

Optional: copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.

> One `npm run build` makes both outputs, so `dist/` is the website *and* the unpacked extension.
> `dist/` is git-ignored: always build after `git pull`.

## 2. Where the calculator runs ("surfaces")

The same React calculators render in several places. `src/lib/env.ts` (`getSurface()`) tells them where they are.

| Surface | Entry | How it's shown | Notes |
|---|---|---|---|
| Website, floating | `src/pages/Index.tsx` | Draggable over the page | Edge tuck, see-through while scrolling, save prompt on close |
| Website, live demo | `src/components/AppDemo.tsx` | Docked in the page | `autoKeyboard: false`: only takes keys after a click |
| Installed web app / `/?app` | `src/main.tsx` → `CalculatorApp` | Just the calculator, in its own OS window | PWA (`manifest.webmanifest` + `sw.js`); resizes itself to fit; **Pin** = always on top |
| Extension, on the page | `src/extension/overlay.ts` → iframe `popup.html?mode=overlay` | Window drawn over any website | Drag bar, dots, tuck and scroll fade live in `overlay.ts` |
| Extension, desktop window | `popup.html?mode=window` | `chrome.windows.create({type: "popup"})` | Auto-fits height; **Pin** opens the always-on-top window |
| Extension, toolbar popup | `popup.html?notice=…` | Only on pages Chrome blocks (`chrome://`, new tab, Web Store) | Shows a note explaining why |
| Always on top | Document Picture-in-Picture | `CalculatorShell.openAlwaysOnTop()` | Same React tree, rendered into the PiP window with a portal |

### `CalculatorShell` and `CalculatorHost`

`src/components/calculator/CalculatorShell.tsx` is the window frame every calculator uses: title bar and dots,
dragging, minimise, keyboard routing, edge tuck, scroll fade and always-on-top.

The page that shows a calculator configures it through `CalculatorHostContext` (`CalculatorHost.tsx`):

| Option | Meaning |
|---|---|
| `docked` | Fill the container instead of floating (demo, extension) |
| `requestClose(type)` | Red dot; pages use `useSaveOnClose()` to ask about unsaved calculations first |
| `float` / `floatLabel` | Override the green dot (default: always on top) |
| `autoKeyboard` | Take keyboard input as soon as it appears (default `true`) |
| `compact` | Tighter layout (toolbar popup, on-page overlay) |
| `hideTitleBar` | No title bar (the overlay and desktop window have their own controls) |
| `onAlwaysOnTopChange` | Called when the PiP window opens/closes (the desktop window minimises itself) |
| `startAlwaysOnTop` | Open straight into the always-on-top window (the website's **Float it over everything**; must follow a click) |

**Keyboard routing:** only one calculator takes keys: the one last clicked, or the newest floating one
(`activeShell` in `CalculatorShell.tsx`).

**Edge tuck timing** (constants at the top of `CalculatorShell.tsx` and `overlay.ts`, keep them in sync):
`TAB` 28 px left visible, `COOLDOWN` 5 s after tucking, `DWELL` 2 s hover to slide out, `MAGNET` 60 px zone,
`SCROLL_OPACITY` 0.3 while scrolling.

## 3. Source map

```
src/
├── components/
│   ├── calculator/CalculatorShell.tsx  window frame (see above)
│   ├── calculator/CalculatorHost.tsx   host options
│   ├── FloatingCalculator.tsx          Basic
│   ├── ScientificCalculator.tsx        Scientific (uses lib/evaluate)
│   ├── FinancialCalculator.tsx         Financial keypad + LCD + currency picker (uses lib/finCalc)
│   ├── CalculatorApp.tsx               app screen (tabs + calculator) for the extension and the installed app
│   ├── HistoryPanel.tsx                history, profile, delete
│   ├── SaveCalculationsDialog.tsx      name / Google sign-in prompt
│   └── ui/                             shadcn/ui components (generated)
├── hooks/use-save-on-close.tsx         "ask before closing" flow
├── lib/
│   ├── evaluate.ts     safe expression parser (no eval)
│   ├── finance.ts      pure maths: TVM, NPV, IRR, payback, amortization, bonds, ICONV, Δ%
│   ├── finCalc.ts      financial keystroke engine: press(state, key) → { state, record }
│   ├── currency.ts     currencies, number/money formatting, million/billion words
│   ├── history.ts      history + profile store (useSyncExternalStore)
│   ├── storage.ts      chrome.storage.local in the extension, localStorage on the web
│   ├── theme.ts        light / dark / system
│   ├── googleAuth.ts   Google sign-in (GIS on the web, chrome.identity in the extension)
│   ├── install.ts      "Install app" prompt + service-worker registration
│   └── env.ts          which surface we're on; Document PiP support
├── extension/
│   ├── background.ts   service worker: icon click → overlay or popup; desktop window
│   └── overlay.ts      on-page window (no imports: injected as one classic script)
├── pages/Index.tsx     the website
└── popup.tsx           extension page (overlay iframe / desktop window / popup)
public/manifest.json    Chrome extension manifest (Manifest V3)
public/manifest.webmanifest  web app manifest (install as an app)
public/sw.js            service worker: offline support for the website / installed app
vercel.json             Vercel build + security headers
```

## 4. The financial calculator

* **`finance.ts`** is plain functions with no UI. Sign convention: money received is positive, paid is negative.
  `solveRate()` (Newton, then a sign-change scan + bisection) powers I/Y, IRR and bond yield.
* **`finCalc.ts`** is a pure reducer. `press(state, key, ctx)` returns the next state and, when something was
  computed, a `record` for the history. Worksheets are lists of variables (`input`, `compute`, `both`, `auto`,
  `toggle`) built by `worksheetVars()`. `view()` turns state into what the LCD shows (label, text, hint).
* Because it's pure, keystrokes are testable directly. `src/lib/finCalc.test.ts` has a `run("…")` helper:

  ```ts
  run("2ND I/Y 12 ENTER 2ND CPT 360 N 6 I/Y 100000 PV 0 FV CPT PMT") // → PMT = −₹599.55
  ```

**Adding a worksheet:** add an id to `WorksheetId` and `WORKSHEET_NAME`, return its variables from
`worksheetVars()`, reset it in `clearWorksheet()`, give it a key (or a `SECOND` mapping), add the key to `KEYS` in
`FinancialCalculator.tsx`, and add tests.

## 5. Stored data

All data stays in the browser. Nothing is sent to a server.

| Key | Where | Contents |
|---|---|---|
| `floatcalci:history:v1` | `chrome.storage.local` / `localStorage` | `{ profile, entries[] }` (max 500 entries) |
| `floatcalci:fin:registers` | same | TVM, cash flows, worksheet values, memories |
| `floatcalci:fin:settings` | same | currency, decimals |
| `floatcalci:theme` | `localStorage` | `light` / `dark` / `system` |
| `floatcalci:lastCalc` | `localStorage` (extension page) | last calculator tab |
| `floatcalci:overlay:pos` | `chrome.storage.local` | on-page window position / tuck side |
| `floatWindowId` | `chrome.storage.session` | id of the desktop window (one at a time) |

Change a stored shape → bump the key's version (`…:v2`) or migrate in `fromSaved()` / `load()`.

## 6. The Chrome extension

### Build outputs
`vite.config.ts` builds four entries with **fixed file names** (the manifest refers to them):
`popup.html`, `index.html`, `assets/background.js`, `assets/overlay.js`.

* `overlay.ts` must stay **import-free**: `chrome.scripting.executeScript({files})` runs it as a classic script.
  Check after a build: `grep -c "^import" dist/assets/overlay.js` should print `0`.
* No remote code or fonts in extension pages (MV3 CSP is `script-src 'self'`), and no `eval` / `new Function`.

### Icon click flow (`background.ts`)
1. `chrome.action.onClicked` (no `default_popup` in the manifest, so the click reaches the worker).
2. Restricted URL (`chrome://`, `brave://`, new tab, Web Store…) → `setPopup` + `openPopup()` with a notice.
3. Otherwise `chrome.scripting.executeScript({ files: ["assets/overlay.js"] })` using **activeTab** (no host
   permissions). Running it again toggles the window (`window.__floatCalci.toggle()`).
4. If injection fails (e.g. `file://` without file access) → popup with a notice.

### Overlay ⇄ iframe messages
The overlay (content script) and the calculator iframe (extension page) talk with `postMessage`.
**Never put calculation data in these messages**: the page can see them.

| Direction | `type` | Payload |
|---|---|---|
| iframe → overlay | `floatcalci:ready` | – |
| iframe → overlay | `floatcalci:height` | `{ height }` (taller while a dialog is open) |
| iframe → overlay | `floatcalci:theme` | `{ dark }` |
| iframe → overlay | `floatcalci:calc` | `{ calc }` (for the green dot) |
| iframe → overlay | `floatcalci:close` | – (after the save prompt, if any) |
| overlay → iframe | `floatcalci:request-close` | – |

The overlay only accepts messages whose `source` is its own iframe; the iframe only accepts messages from its
parent window.

### Permissions
`storage`, `identity`, `activeTab`, `scripting`. No host permissions. `web_accessible_resources` (`popup.html`, `assets/*`, `icons/*`) are
exposed to all sites without `use_dynamic_url`: Chrome blocks dynamic URLs inside iframes, and the on-page overlay is an iframe.
Websites can therefore detect the extension by probing these files.

## 6b. The installable web app (PWA)

* `public/manifest.webmanifest` describes the app (start URL `/?app`, icons, shortcuts for each calculator).
  Don't confuse it with `public/manifest.json`, which is the **extension** manifest.
* `public/sw.js` caches only the site's own files: pages network-first (fresh, cached copy offline), assets
  stale-while-revalidate. It never touches other origins (Google sign-in goes straight to the network). Bump
  `CACHE` (`floatcalci-v2`…) if you change the caching strategy.
* `src/lib/install.ts` keeps the browser's `beforeinstallprompt` event so the site's **Install app** buttons can
  open the install dialog; it also registers the service worker (production only, never in the extension).
* `getSurface()` returns `"app"` when running installed (`display-mode: standalone`) or with `?app` in the URL;
  `main.tsx` then renders `CalculatorApp` instead of the landing page.
* Check installability in Chrome DevTools → Application → Manifest (or CDP `Page.getInstallabilityErrors`).

## 7. Testing

**Unit tests:** `npm test` (77 tests). Add a test for any maths or keystroke change.

**Manual checklist before a release**

- [ ] Website: open each calculator from **Try Calci**; drag; tuck into an edge (wait 5 s, hover 2 s, click tab)
- [ ] Scroll the page with a calculator open: it fades, then turns solid
- [ ] Close with unsaved calculations: save prompt; **Not now** doesn't ask again until a new calculation
- [ ] Phone width (375 px): ☰ menu opens calculators; nothing spills out of dialogs
- [ ] Extension: reload in `chrome://extensions`; click the icon on a normal site (drag, red/yellow/green dots)
- [ ] Click the icon on `chrome://extensions`: popup with the notice
- [ ] Desktop window (`Alt+Shift+F`): one set of window controls, height fits, **Pin** floats over other apps
- [ ] **Float it over everything** on the website opens the always-on-top window
- [ ] Production build (`npm run build && npm run preview`): DevTools shows the site as installable; reload offline works
- [ ] `/?app` shows just the calculator
- [ ] Dark mode everywhere

**Automating the extension:** Playwright can't click the toolbar icon, so give a *test copy* of `dist/` the
`"host_permissions": ["<all_urls>"]` permission and inject the overlay from the service worker:

```js
const [tab] = await chrome.tabs.query({ active: true });
await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["assets/overlay.js"] });
```

Never ship `host_permissions` in the real manifest.

## 8. Releasing

**Extension**
1. Bump `"version"` in `public/manifest.json`.
2. `npm test && npm run lint && npm run build`.
3. Zip the *contents* of `dist/` (you can leave out `index.html` and `og-image.png`).
4. Upload to the Chrome Web Store (needs a privacy policy page, because of `identity`).

**Website**: push to `main`; Vercel builds and deploys (see the README). If you add an external service (fonts,
analytics, an API), add its domain to the `Content-Security-Policy` in `vercel.json`, or the browser will block it.

## 9. Conventions

* User-facing text: plain English, sentence case, no jargon.
* Calculators record results with `recordCalculation(type, expression, result)`.
* Colours come from CSS variables in `src/index.css` (`--calc-*`, both themes); avoid hard-coded colours.
* Keep the extension popup under 600 px tall (Chrome's limit).
* Dialogs: the shared `DialogContent` already handles width, wrapping and scrolling; long text needs `min-w-0`
  and `[overflow-wrap:anywhere]` inside flex/grid containers.

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Extension shows old behaviour | `git pull && npm run build`, then ↻ reload in `chrome://extensions`, then reload the web page |
| Icon opens a popup instead of floating | You're on a page Chrome protects (`chrome://`, new tab, Web Store). Try a normal site |
| Nothing happens on a `file://` page | Turn on **Allow access to file URLs** for Float Calci |
| Google button greyed out | Set `VITE_GOOGLE_CLIENT_ID` and rebuild (see the extension guide) |
| A new external resource is blocked on the live site | Add it to the CSP in `vercel.json` |
