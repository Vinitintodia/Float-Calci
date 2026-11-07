# Float Calci – Chrome Extension Guide (Manifest V3)

Float Calci runs in three places, all from the same code:

| Where | How you open it | What it's for |
|---|---|---|
| **Toolbar popup** | Click the extension icon, or `Alt+Shift+C` | Quick sums |
| **Floating window** | **Float** button in the popup, or `Alt+Shift+F` | A small calculator window of its own |
| **On top of all apps** | **Pin on top** in the floating window (or its green dot) | Stays above every app on your laptop: Excel, PDFs, Zoom… |

## How "float over the whole laptop" works

A normal Chrome extension can only draw inside Chrome. To float above *other apps*, Float Calci uses
Chrome's **Document Picture-in-Picture** API (Chrome / Edge 116+ on Windows, macOS, Linux and ChromeOS).
It works like video picture-in-picture, but for any web page: Chrome opens a small window that is always
on top, and React renders the same calculator into it with a portal, so nothing you typed is lost.

Why it needs the separate floating window first: the toolbar popup closes as soon as it loses focus, and
the always-on-top window closes with the page that opened it. So the popup opens the floating window
(via the background service worker), and the floating window opens the always-on-top one. While
it is pinned, the floating window minimises itself out of the way. Close the pinned window and it comes back.

On the website, the green dot on any calculator opens the always-on-top window directly.

> If you ever want it to float with Chrome completely closed, the next step is a desktop wrapper such as
> **Tauri** or **Electron** (`alwaysOnTop: true`). The React code here can be reused as-is.

## Install (load unpacked)

```bash
npm install
npm run build
```

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose the **`dist`** folder.
3. Pin Float Calci from the puzzle-piece menu.

After changing code: `npm run build`, then press the ↻ reload button on the extension card.
(`public/manifest.json` and `public/icons` are copied into `dist` automatically by Vite.)

Shortcuts can be changed at `chrome://extensions/shortcuts`.

## Calculation history and saving

* Every result (pressing **=**, **x²**, **x³**, or **Calc** on the financial calculator) is stored right away:
  in `chrome.storage.local` in the extension, and in `localStorage` on the website.
* When you close a calculator (red dot) with unsaved calculations, a popup asks for your **name** or
  **Continue with Google**. Your calculations are then attached to that profile, and future ones save automatically.
* Browsers don't allow custom popups when a *tab* or the toolbar popup is closed. In that case nothing is lost:
  the calculations stay on the device as "unsaved" and the prompt appears the next time you close a calculator.
* Open the **History** (clock icon) to see, copy, delete or save calculations, or to sign out.

Storage is per device/browser for now. Syncing across devices needs a backend (for example Firebase or
Supabase keyed by the Google account id).

## Setting up "Continue with Google"

Google sign-in needs an OAuth Client ID. Without one, the button is disabled and saving by name still works.

1. Go to <https://console.cloud.google.com/apis/credentials>, create a project, and configure the
   **OAuth consent screen** (External, add yourself as a test user).
2. **Create credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins** add `http://localhost:8080` (and your deployed site's URL).
4. Under **Authorized redirect URIs** add `https://<your-extension-id>.chromiumapp.org/`
   (the ID is shown on the extension's card in `chrome://extensions`).
5. Copy the Client ID into a `.env` file in the project root (see `.env.example`):

   ```
   VITE_GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   ```
6. Restart `npm run dev`, or `npm run build` and reload the extension.

The website uses Google Identity Services. The extension uses `chrome.identity.launchWebAuthFlow`,
because Manifest V3 doesn't allow loading Google's remote script inside extension pages. Both read only
your name, email and photo.

> The unpacked extension ID changes if you load it from a different folder. To keep it fixed, add a
> `"key"` to `manifest.json` (Chrome docs: "Keep a consistent extension ID").

## Permissions

* **storage**: saves calculation history and your profile on this device.
* **identity**: the Google sign-in window.

Nothing is sent anywhere except Google's sign-in, and only if you choose it.

## Why the calculators no longer use `eval`

Manifest V3 blocks `eval()` / `new Function()` in extensions, so the old code showed **Error** for every
calculation in the extension. Expressions are now evaluated by a small parser in `src/lib/evaluate.ts`
(safer too, because user text is never run as code).

## Publishing to the Chrome Web Store (optional)

1. Zip the **contents** of `dist` (not the folder itself).
2. Create a developer account at the [Chrome Web Store dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5).
3. Upload the zip, add screenshots, a description and a privacy policy (needed because of the `identity` permission), then submit.
