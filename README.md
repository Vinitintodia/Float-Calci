# 🧮 Float Calci

**The calculator that floats while you browse.** Basic, Scientific and Financial calculators that you can drag around a page, tuck into the edge of the screen, use in dark mode, keep a history of, and **pin on top of every app on your laptop**. Available as a website and as a Chrome extension (Manifest V3).

![Float Calci](docs/screenshots/hero.jpg)

## ✨ Features

- **Float on top of all apps**: the green window dot pins the calculator above Excel, PDFs, Zoom and everything else (Chrome / Edge 116+ on desktop)
- **Magnetic edge tuck**: drag a calculator off the side of the page and it tucks in. After a 5-second pause, hover near the tab for 2 seconds (or click it) and it slides back out
- **Financial calculator with exam-calculator keystrokes**: TVM (N, I/Y, PV, PMT, FV, CPT, 2ND), cash flows, NPV, IRR, payback, amortization, bonds, interest conversion and percent change
- **11 currencies**: ₹, $, €, £, ¥, AED, S$, A$, C$, CHF, CN¥ (or none), with big amounts written out in millions and billions
- **Chrome extension**: click the icon and a calculator floats over the page you're on (drag, minimise, close, tuck), plus a floating window and keyboard shortcuts
- **Dark theme**: follows your system setting by default and remembers your choice
- **Calculation history**: every result is saved; closing a calculator asks for your name or *Continue with Google* to keep them
- **Works on phones**: a menu to open any calculator, sized to fit the screen
- **Safe maths**: no `eval()`; expressions go through a small parser (`src/lib/evaluate.ts`)
- **Tested**: 77 automated tests for the maths and the keystroke engine (`npm test`)

| Financial calculator | Dark mode (cash flow → IRR) | On a phone |
|---|---|---|
| ![Financial calculator](docs/screenshots/financial.jpg) | ![Dark mode](docs/screenshots/dark-mode.jpg) | ![Mobile](docs/screenshots/mobile.jpg) |

**Edge tuck**: tucked into the side (left), then slid out after hovering near the tab (right)

![Edge tuck](docs/screenshots/edge-tuck.jpg)

## 🚀 Getting Started

```bash
git clone https://github.com/Vinitintodia/voice-calc-vision.git
cd voice-calc-vision
npm install
npm run dev
```

Open http://localhost:8080 and choose a calculator from **Try Calci**, or try them in the **Live demo** section.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 8080 |
| `npm run build` | Build the website **and** the Chrome extension into `dist/` |
| `npm test` | Run the test suite (Vitest) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## 🧩 Chrome Extension

1. `npm run build`
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `dist` folder.

| Action | How |
|---|---|
| Show / hide the calculator on the page | Toolbar icon or `Alt+Shift+C` |
| Move it | Drag the bar at the top |
| Close / minimise | Red / yellow dot |
| Tuck it into the edge | Drag it past the side of the page |
| Open the floating window | Green dot, or `Alt+Shift+F` |
| Keep it above all apps | **Pin** (or the green dot) in the floating window |

![Float Calci on a web page](docs/screenshots/extension.jpg)

Full guide (how floating over other apps works, Google sign-in, permissions, publishing): [CHROME_EXTENSION_GUIDE.md](CHROME_EXTENSION_GUIDE.md)

## 💰 Financial Calculator

It follows the keystroke workflow taught for finance exams, so what you practise here carries over to a handheld financial calculator.

**Sign convention:** money you receive is positive, money you pay is negative (a loan: `PV = +5,000,000`, `PMT` comes out negative).

### Time value of money

| Key | Meaning |
|---|---|
| `N` | Number of payments |
| `I/Y` | Annual interest rate, % |
| `PV` / `PMT` / `FV` | Present value, payment per period, future value |
| `CPT` | Compute: press it, then the key you want solved |
| `2ND` `I/Y` (P/Y) | Payments per year (also sets compounding per year, C/Y) |
| `2ND` `PMT` (BGN) | Payments at the end (END) or beginning (BGN) of each period |
| `2ND` `N` (xP/Y) | Multiply the display by P/Y (30 years → 360 months) |
| `2ND` `FV` (CLR TVM) | Clear the five TVM values |

**Example: EMI on a ₹50 lakh home loan, 8.5% for 30 years**

```
2ND I/Y  12 ENTER  2ND CPT      (P/Y = 12, back to the calculator)
360 N   8.5 I/Y   5000000 PV   0 FV
CPT PMT                          → PMT = −₹38,445.67
```

### Worksheets

Open a worksheet, move with `↑` `↓`, type a value and press `ENTER`, or press `CPT` to compute. `2ND CPT` (QUIT) goes back to the standard calculator. The chips under the display jump straight to any variable.

| Worksheet | Open with | Variables |
|---|---|---|
| Cash flows | `CF` | CF0, C01/F01, C02/F02 … (`2ND ↑` deletes, `2ND ↓` inserts a flow) |
| NPV | `NPV` | I (rate) → NPV, NFV, PB (payback), DPB (discounted payback) |
| IRR | `IRR` | IRR (press `CPT`) |
| Amortization | `2ND PV` | P1, P2 → BAL, PRN, INT |
| Bond | `BOND` | RV, CPN, YRS, FREQ (`2ND ENTER` switches 2/Y and 1/Y) → YLD ⇄ PRI, DUR, MDUR |
| Interest conversion | `2ND %` | NOM ⇄ EFF, C/Y |
| Percent change | `Δ%` | OLD, NEW, %CH, #PD (solve any one) |

**Example: NPV and IRR of a project**

```
CF  1000000 +/- ENTER  ↓  300000 ENTER  ↓  4 ENTER    (−10 lakh, then 3 lakh for 4 years)
NPV  10 ENTER  ↓  CPT                                  → NPV at 10%
IRR  CPT                                               → IRR = 7.71%
```

The standard calculator chains left to right (`2 + 3 × 4 = 20`), and has `%`, `yˣ`, `√x`, `x²`, `1/x`, `LN`, `eˣ`, `STO`/`RCL` 0–9 memories, and `2ND +/-` (RESET, asks first). Your values are kept between sessions, like a real calculator's memory.

The bond worksheet works in whole coupon periods (years to maturity), not settlement dates.

## 🔢 Basic & Scientific

**Basic**: arithmetic, percent, plus/minus, decimals and backspace. After `=`, typing a number starts a new calculation, while an operator carries on from the result.

**Scientific**: `sin` `cos` `tan` (degrees), `log`, `ln`, `√`, powers (`^`, `x²`, `x³`), brackets, `π`, `e`, `EXP` (`1.5 EXP 3` = 1500), `×10^`, and `Ans` (the last answer). Implicit multiplication such as `2π` or `3(4+1)` works, and missing closing brackets are added for you.

## ⌨️ Keyboard Shortcuts

| Calculator | Keys |
|---|---|
| Basic | `0–9` `+ - * / . %` · `Enter` = · `Backspace` delete · `Esc` clear |
| Scientific | `0–9` `+ - * / ^ ( )` · `s` sin · `c` cos · `t` tan · `l` log · `r` √ · `p` π · `Space` close bracket · `Backspace` delete · `Esc` clear · `Enter` = |
| Financial | `0–9` `.` `+ - * / ^ %` · `n` N · `i` I/Y · `p` PV · `m` PMT · `f` FV · `c` CPT · `s` 2ND · `↑ ↓` move · `Enter` ENTER (or = outside a worksheet) · `Backspace` delete · `Esc` CE/C |

On the landing page, the demo calculators only take the keyboard after you click them, so arrow keys still scroll the page.

## 💾 History & Sign-in

- Results are stored on your device: `localStorage` on the website, `chrome.storage.local` in the extension.
- When you close a calculator with unsaved calculations, you can save them under your **name** or with **Google**. After that, new results save to your profile automatically.
- Signing out keeps your saved calculations on the device; they come back when you sign in again.

**Enabling Google sign-in** (optional): create an OAuth Client ID in Google Cloud Console, then copy `.env.example` to `.env` and set:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

The step-by-step setup is in the [extension guide](CHROME_EXTENSION_GUIDE.md#setting-up-continue-with-google). Without a client ID, saving by name still works.

## 🛠️ Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) · Lucide icons · Vitest · Chrome Extension Manifest V3 · Document Picture-in-Picture API · Google Identity Services

## 📁 Project Structure

```
src/
├── components/
│   ├── calculator/
│   │   ├── CalculatorShell.tsx   # shared window: drag, edge tuck, keyboard, float-on-top
│   │   └── CalculatorHost.tsx    # floating (website) vs docked (demo, extension)
│   ├── FloatingCalculator.tsx    # Basic
│   ├── ScientificCalculator.tsx
│   ├── FinancialCalculator.tsx   # financial keypad, display and currency picker
│   ├── AppDemo.tsx               # live demo on the landing page
│   ├── HistoryPanel.tsx
│   ├── SaveCalculationsDialog.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── finance.ts                # TVM, NPV, IRR, amortization, bonds… (pure maths)
│   ├── finCalc.ts                # financial keystroke engine (2ND, CPT, worksheets)
│   ├── currency.ts               # currencies and number formatting
│   ├── evaluate.ts               # safe expression parser
│   ├── history.ts                # history + profile store
│   ├── storage.ts                # chrome.storage / localStorage
│   ├── theme.ts                  # light / dark / system
│   ├── googleAuth.ts             # Google sign-in (web + extension)
│   └── *.test.ts                 # tests
├── extension/
│   ├── background.ts             # extension service worker (icon click, floating window)
│   └── overlay.ts                # the calculator drawn over a web page
├── pages/Index.tsx               # website
└── popup.tsx                     # extension calculator (on-page frame + floating window)
public/manifest.json              # Manifest V3
```

## 🗺️ Roadmap

- Sync history across devices (Firebase or Supabase, keyed by Google account)
- Live currency conversion when you switch currency
- Date-based bond pricing (settlement and maturity dates), depreciation and statistics worksheets
- Publish to the Chrome Web Store
- Desktop app (Tauri) so it can float even with Chrome closed

## 🤝 Contributing

Pull requests are welcome. Run `npm test` and `npm run lint` before opening one. For bigger changes, please open an issue first to discuss what you'd like to change.
