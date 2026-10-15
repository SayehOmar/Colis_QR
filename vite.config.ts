import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vercel exposes only prefixed vars to the browser. Production uses
  // GRAPHQL_URI and GOOGLE_CLIENT_ID; VITE_* remains valid locally.
  envPrefix: ["VITE_", "GRAPHQL_", "GOOGLE_", "API_", "SITE_"],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    // Avoid COOP isolating the page from Google's auth UI
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
});
