// Injected into the current tab when you click the Float Calci icon (or press
// Alt+Shift+C). Draws a calculator window over the page that you can drag,
// minimise, close, and tuck into the edge of the screen.
//
// The calculator itself runs in an iframe (the extension page
// popup.html?mode=overlay), so the website's CSS can't break it and the
// calculator can't read the page. This file has no imports on purpose: it is
// injected as a single classic script.

interface FloatCalciOverlay {
  toggle: () => void;
}

(() => {
  const w = window as unknown as { __floatCalci?: FloatCalciOverlay };
  if (w.__floatCalci) {
    w.__floatCalci.toggle();
    return;
  }

  const WIDTH = 380;
  const BAR = 34; // drag bar height
  const TAB = 28; // width left on screen when tucked
  const MAGNET = 60; // how close the cursor must come to a tucked calculator
  const LEAVE = 40;
  // After it tucks away, the cursor can't pull it out for 5 s (so you can get on
  // with your work); after that, hover near the tab for 2 s to bring it out.
  // Clicking the tab always brings it out straight away.
  const COOLDOWN = 5000;
  const DWELL = 2000;
  const POS_KEY = "floatcalci:overlay:pos";

  // ---- DOM (inside a closed shadow root so page CSS can't touch it) ----------
  const host = document.createElement("div");
  host.setAttribute("data-float-calci", "");
  host.style.cssText = "all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      .win {
        position: fixed; width: ${WIDTH}px; border-radius: 14px; overflow: hidden;
        box-shadow: 0 18px 50px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.12);
        background: var(--bg); font: 500 13px -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif;
        transition: left .28s cubic-bezier(.2,.9,.3,1.15), top .2s ease, opacity .2s ease, transform .2s ease;
        --bg: #f5f5f5; --bar: #f0f8ff; --text: #555; --line: #ddd; --tab: #4da6ff;
      }
      .win.dark { --bg: #0f121a; --bar: #1f2533; --text: #a3acbd; --line: #313a4d; --tab: #2f8fe8; }
      .win.dragging { transition: opacity .2s ease; }
      .win.hidden { opacity: 0; transform: scale(.96); pointer-events: none; }
      .win.scrolling:not(.hover):not(.dragging) { opacity: .3; }
      .bar {
        height: ${BAR}px; display: flex; align-items: center; gap: 8px; padding: 0 12px;
        background: var(--bar); border-bottom: 1px solid var(--line); cursor: grab; user-select: none; touch-action: none;
      }
      .win.dragging .bar { cursor: grabbing; }
      .dot { width: 12px; height: 12px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; flex: none; }
      .dot:focus-visible { outline: 2px solid var(--tab); outline-offset: 2px; }
      .red { background: #ff5f57; } .yellow { background: #febc2e; } .green { background: #28c840; }
      .title { flex: 1; text-align: center; color: var(--text); font-size: 12px; margin-right: 52px; pointer-events: none; }
      iframe { display: block; width: 100%; border: 0; background: var(--bg); color-scheme: normal; }
      .win.min iframe { display: none; }
      .win.min .bar { border-bottom: 0; }
      .tab {
        position: absolute; top: 0; bottom: 0; width: ${TAB}px; display: none; align-items: center; justify-content: center;
        background: var(--tab); color: #fff; font-size: 18px; font-weight: 700; cursor: pointer; overflow: hidden;
      }
      .tab .fill { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: rgba(255,255,255,.4); transition: height .15s ease; }
      .tab.charging .fill { height: 100%; transition: height ${DWELL}ms linear; }
      .tab .arrow { position: relative; }
      .win.tucked .tab { display: flex; }
      .win.tucked.left .tab { right: 0; }
      .win.tucked.right .tab { left: 0; }
    </style>
    <div class="win hidden" role="dialog" aria-label="Float Calci">
      <div class="bar">
        <button class="dot red" title="Close" aria-label="Close"></button>
        <button class="dot yellow" title="Minimise" aria-label="Minimise"></button>
        <button class="dot green" title="Float on top of all apps" aria-label="Float on top of all apps"></button>
        <span class="title">Float Calci</span>
      </div>
      <iframe title="Float Calci calculator" allow="clipboard-write"></iframe>
      <div class="tab" title="Click, or hover here for 2 seconds, to bring the calculator back"><span class="fill"></span><span class="arrow"></span></div>
    </div>`;

  const win = root.querySelector(".win") as HTMLDivElement;
  const bar = root.querySelector(".bar") as HTMLDivElement;
  const frame = root.querySelector("iframe") as HTMLIFrameElement;
  const tabEl = root.querySelector(".tab") as HTMLDivElement;
  const arrowEl = root.querySelector(".tab .arrow") as HTMLSpanElement;
  const [red, yellow, green] = Array.from(root.querySelectorAll(".dot")) as HTMLButtonElement[];

  // ---- State -----------------------------------------------------------------
  let x = window.innerWidth - WIDTH - 24;
  let y = 80;
  let contentH = 480;
  let visible = false;
  let minimized = false;
  let tuck: "left" | "right" | null = null;
  let peek = false;
  let frameReady = false;
  let calc = "basic";
  let unpeekTimer: number | undefined;
  let dwellTimer: number | undefined;
  let cooldownUntil = 0;

  const cancelDwell = () => {
    clearTimeout(dwellTimer);
    dwellTimer = undefined;
    tabEl.classList.remove("charging");
  };
  /** Slide (back) into the edge and start the 5 s cool-down. */
  const tuckAway = () => {
    cancelDwell();
    peek = false;
    cooldownUntil = Date.now() + COOLDOWN;
    render();
  };

  const height = () => (minimized ? BAR : Math.min(BAR + contentH, window.innerHeight - 16));

  const clampY = (v: number) => Math.max(0, Math.min(v, Math.max(0, window.innerHeight - height())));
  const clampX = (v: number) => Math.max(0, Math.min(v, window.innerWidth - WIDTH));

  const render = () => {
    const shownX = !tuck ? x : tuck === "left" ? (peek ? 8 : -WIDTH + TAB) : peek ? window.innerWidth - WIDTH - 8 : window.innerWidth - TAB;
    win.style.left = `${shownX}px`;
    win.style.top = `${y}px`;
    frame.style.height = `${height() - BAR}px`;
    win.classList.toggle("min", minimized);
    win.classList.toggle("tucked", !!tuck && !peek);
    win.classList.toggle("left", tuck === "left");
    win.classList.toggle("right", tuck === "right");
    arrowEl.textContent = tuck === "left" ? "›" : "‹";
    yellow.title = minimized ? "Expand" : "Minimise";
  };

  const savePos = () => {
    try {
      void chrome.storage.local.set({ [POS_KEY]: { x, y, tuck } });
    } catch {
      /* extension reloaded; ignore */
    }
  };

  // ---- Show / hide -------------------------------------------------------------
  const show = () => {
    if (!frame.src) frame.src = chrome.runtime.getURL("popup.html?mode=overlay");
    visible = true;
    win.classList.remove("hidden");
    render();
    setTimeout(() => frame.focus(), 50);
  };

  const hide = () => {
    visible = false;
    win.classList.add("hidden");
    frame.blur();
  };

  /** Close: lets the calculator ask to save unsaved calculations first. */
  const requestClose = () => {
    if (!frameReady || !frame.contentWindow) return hide();
    frame.contentWindow.postMessage({ type: "floatcalci:request-close" }, "*");
  };

  const toggle = () => (visible ? requestClose() : show());

  // ---- Messages from the calculator iframe ---------------------------------------
  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow || !String(e.origin).startsWith("chrome-extension://")) return;
    const data = e.data as { type?: string; height?: number; dark?: boolean; calc?: string };
    switch (data?.type) {
      case "floatcalci:ready":
        frameReady = true;
        break;
      case "floatcalci:height":
        if (typeof data.height === "number" && data.height > 0) {
          contentH = Math.ceil(data.height);
          y = clampY(y);
          render();
        }
        break;
      case "floatcalci:theme":
        win.classList.toggle("dark", !!data.dark);
        break;
      case "floatcalci:calc":
        if (data.calc) calc = data.calc;
        break;
      case "floatcalci:close":
        hide();
        break;
    }
  });

  // ---- Buttons --------------------------------------------------------------------
  red.addEventListener("click", requestClose);
  yellow.addEventListener("click", () => {
    minimized = !minimized;
    y = clampY(y);
    render();
  });
  green.addEventListener("click", () => {
    // The separate window can be pinned above every app (Document Picture-in-Picture)
    void chrome.runtime.sendMessage({ type: "open-floating-window", calc });
    hide();
  });
  for (const b of [red, yellow, green]) b.addEventListener("pointerdown", (e) => e.stopPropagation());

  // ---- Dragging + edge tuck ----------------------------------------------------------
  let drag: { dx: number; dy: number; id: number } | null = null;

  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const r = win.getBoundingClientRect();
    if (tuck) {
      x = r.left; // pick it up from where it is shown
      tuck = null;
      peek = false;
      cancelDwell();
    }
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
    bar.setPointerCapture(e.pointerId);
    win.classList.add("dragging");
    frame.style.pointerEvents = "none";
    e.preventDefault();
  });

  bar.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    x = Math.max(-WIDTH + TAB, Math.min(e.clientX - drag.dx, window.innerWidth - TAB));
    y = clampY(e.clientY - drag.dy);
    render();
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    win.classList.remove("dragging");
    frame.style.pointerEvents = "";
    if (x < -WIDTH * 0.35) tuck = "left";
    else if (x + WIDTH > window.innerWidth + WIDTH * 0.35) tuck = "right";
    else {
      tuck = null;
      x = clampX(x);
    }
    if (tuck) tuckAway();
    else render();
    savePos();
  };
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);

  // Magnet: slide a tucked calculator out when the cursor comes near
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!visible || !tuck || drag || e.pointerType === "touch") return;
      const r = win.getBoundingClientRect();
      const nearY = e.clientY > r.top - MAGNET && e.clientY < r.bottom + MAGNET;
      if (!peek) {
        const nearX = tuck === "left" ? e.clientX < TAB + MAGNET : e.clientX > window.innerWidth - TAB - MAGNET;
        const near = nearX && nearY && Date.now() >= cooldownUntil;
        if (near && dwellTimer === undefined) {
          // Fill the tab; slide out if the cursor stays for DWELL ms
          tabEl.classList.add("charging");
          dwellTimer = window.setTimeout(() => {
            dwellTimer = undefined;
            tabEl.classList.remove("charging");
            clearTimeout(unpeekTimer);
            peek = true;
            render();
          }, DWELL);
        } else if (!near && dwellTimer !== undefined) {
          cancelDwell();
        }
        return;
      }
      const inside = e.clientX > r.left - LEAVE && e.clientX < r.right + LEAVE && e.clientY > r.top - LEAVE && e.clientY < r.bottom + LEAVE;
      clearTimeout(unpeekTimer);
      if (!inside) unpeekTimer = window.setTimeout(tuckAway, 600);
    },
    true,
  );
  // The cursor over the calculator itself (iframe) doesn't reach the page: keep it out
  win.addEventListener("pointerenter", () => clearTimeout(unpeekTimer));

  // Touch: tap the tab to bring it out, tap the page to tuck it away
  tabEl.addEventListener("click", () => {
    cancelDwell();
    peek = true;
    render();
  });
  // Cursor left the browser window: stop filling the tab
  document.documentElement.addEventListener("pointerleave", cancelDwell);
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (tuck && peek && !e.composedPath().includes(host)) tuckAway();
    },
    true,
  );

  // See-through while the page scrolls (so you can read what's underneath),
  // solid again shortly after scrolling stops or when the cursor is on it
  let scrollTimer: number | undefined;
  window.addEventListener(
    "scroll",
    () => {
      if (!visible) return;
      win.classList.add("scrolling");
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => win.classList.remove("scrolling"), 450);
    },
    { capture: true, passive: true },
  );
  win.addEventListener("pointerenter", () => win.classList.add("hover"));
  win.addEventListener("pointerleave", () => win.classList.remove("hover"));

  // Never lost: stay on screen when the window is resized
  window.addEventListener("resize", () => {
    if (!tuck) x = clampX(x);
    y = clampY(y);
    render();
  });

  // ---- Start --------------------------------------------------------------------------
  (document.body ?? document.documentElement).appendChild(host);
  w.__floatCalci = { toggle };

  const start = (saved?: { x?: number; y?: number; tuck?: "left" | "right" | null }) => {
    if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
      x = saved.x;
      y = saved.y;
      tuck = saved.tuck ?? null;
    }
    if (!tuck) x = clampX(x);
    y = clampY(y);
    show();
  };

  try {
    chrome.storage.local.get(POS_KEY, (res) => start(res?.[POS_KEY]));
  } catch {
    start();
  }
})();
