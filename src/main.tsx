import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// No <StrictMode>: in development it mounts every component twice, which here
// means TWO WebGL renderers downloading, decoding and compiling the 3D model at
// the same time — the dev loading screen crawled because of it.
createRoot(document.getElementById("root")!).render(<App />);
