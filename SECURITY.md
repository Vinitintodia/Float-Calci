# Security & Privacy

## Summary

Float Calci has **no server and no accounts on a server**. Calculations, settings and your profile are stored
only in your browser on your device. Nothing is uploaded, so there is no shared database that could leak one
person's data to another, and nothing for bots to attack or spam.

## What is stored, and where

| Data | Where | Who can see it |
|---|---|---|
| Calculation history, financial values, settings | The extension's private storage (`chrome.storage.local`), or the website's `localStorage` | Only this browser profile on this device |
| Profile: a name, or Google name/email/photo | Same place | Same |
| Google access token | Never stored: used once to read your name/email, then discarded | – |

* Different devices, browsers and Chrome profiles never share data.
* Websites can't read the extension's storage, and other sites can't read the website's `localStorage`
  (browsers keep storage separate per site).

## Known limitation: shared computers

A **name profile is a label, not a password-protected account.** Anyone using the same browser profile can
type the same name and see those saved calculations (much like browser history). The app says so where you save
by name. On a shared computer:

* use **Sign out & delete my data** in the History panel when you're done, or
* use your own Chrome profile.

## Protections in place

**Calculations**
* No `eval()` or `new Function()`: expressions go through a small parser (`src/lib/evaluate.ts`), so typed text
  can never run as code.
* React escapes everything it displays; no user text is inserted as HTML.

**Chrome extension**
* Minimal permissions: `storage`, `identity`, `activeTab`, `scripting`. **No host permissions**: it can't read
  or change any website, and only runs on a tab when you click the icon (or press the shortcut).
* The on-page calculator runs in an **isolated frame** (a different origin) inside a closed shadow root, so the
  website can't read what you type or style the calculator, and the calculator can't read the page.
* Messages between the page window and the calculator frame carry no calculation data (only height, theme and
  which tab is open), and each side only accepts messages from the other.
* The extension's calculator page is loaded into the on-page frame as a normal web-accessible resource (no
  `use_dynamic_url`: Chrome blocks that setting inside iframes, so the floating calculator wouldn't load). This means
  a website that looks for the extension's files can tell Float Calci is installed.
* Strict extension CSP (`script-src 'self'`): no remote scripts or fonts.

**Installed app / offline support**
* The service worker (`public/sw.js`) caches only Float Calci's own files so it opens offline. It never
  intercepts requests to other sites, and stores no calculations (those stay in `localStorage`).

**Website (when deployed with `vercel.json`)**
* Content Security Policy: only the site's own scripts plus Google sign-in may run; no plugins; forms can't post
  elsewhere.
* `frame-ancestors 'none'` + `X-Frame-Options: DENY`: other sites can't embed it (clickjacking).
* `nosniff`, a strict referrer policy, HSTS, and a Permissions-Policy that turns off camera, microphone,
  location and payments.

**Google sign-in**
* Scopes are only `openid email profile`. The token is used once to read your name/email/photo and is not kept.
* The OAuth Client ID is public by design. Restrict it in Google Cloud Console to your own website origin and
  extension redirect URL, so no other site can use it.

**Dependencies**
* `npm audit --omit=dev` (everything that ships to users) reports **0 vulnerabilities**. Remaining advisories
  are in development tools (linting, testing, build) that never reach users.
* Unused libraries (router, form validation, data fetching) were removed to reduce what ships.

## Bots and abuse

There is no API, login server, database or form that submits anywhere, so there is nothing to brute-force,
scrape or spam. On Vercel the site is static files behind Vercel's CDN; on the free plan, extreme traffic pauses
the site rather than creating a bill.

## If you add a backend later (e.g. history sync)

* Authenticate on the server with Google ID tokens (verify the signature and `aud`); never trust a name.
* Scope every read and write to the signed-in user id, enforced on the server (or with database row-level
  security), so users can never see each other's data.
* Add rate limiting, and add the API's domain to the CSP `connect-src` in `vercel.json`.

## Reporting a problem

Please open a [GitHub issue](https://github.com/Vinitintodia/Float-Calci/issues) without exploit details,
or contact the maintainer privately first.
