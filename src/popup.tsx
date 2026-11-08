// Chrome extension page. The same page is used in three places:
//   popup.html?mode=overlay -> the calculator floating over a web page
//                              (inside the iframe drawn by extension/overlay.ts)
//   popup.html?mode=window  -> a small separate window that can be pinned
//                              "on top of all apps" (Document Picture-in-Picture)
//   popup.html?notice=...   -> the toolbar popup, on pages Chrome protects
import { createRoot } from "react-dom/client";
import "./index.css";
import CalculatorApp from "./components/CalculatorApp";

createRoot(document.getElementById("root")!).render(<CalculatorApp />);
