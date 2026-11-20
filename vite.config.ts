import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Projects on a Windows drive mounted in WSL (/mnt/c/...) don't deliver file
// change events to Linux, so Vite would keep serving stale code and miss new
// files in /public. Poll in that case.
declare const process: { cwd(): string };
const onWindowsMount = process.cwd().startsWith("/mnt/");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: onWindowsMount ? { usePolling: true, interval: 300 } : undefined,
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        // Split big, rarely-changing libraries into their own long-cacheable chunks
        manualChunks: {
          three: ["three"],
          gsap: ["gsap", "@gsap/react"],
          r3f: ["@react-three/fiber", "@react-three/drei"],
          physics: ["@react-three/rapier"],
          postfx: ["@react-three/postprocessing"],
        },
      },
    },
  },
});
