import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import CalculatorApp from "./components/CalculatorApp";
import { getSurface } from "./lib/env";
import { initInstall, registerServiceWorker } from "./lib/install";
import "./index.css";

initInstall();
registerServiceWorker();

// The installed app (or /?app) shows just the calculator; otherwise the website.
createRoot(document.getElementById("root")!).render(getSurface() === "app" ? <CalculatorApp /> : <App />);
