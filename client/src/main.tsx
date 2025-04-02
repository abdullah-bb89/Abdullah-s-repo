import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Polyfill for CSS custom properties for flip animation
document.documentElement.style.setProperty("--primary-color", "hsl(var(--primary))");

createRoot(document.getElementById("root")!).render(<App />);
