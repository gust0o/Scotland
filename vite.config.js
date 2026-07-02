import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Build-time version marker (git short SHA) — baked into the bundle as
// __APP_VERSION__ AND written to dist/version.json (fetched at runtime,
// no-store, to detect when a newer build is live). Falls back to "dev" when
// git isn't available (shouldn't happen in CI, but keeps `vite dev` working
// in a detached/shallow checkout).
const APP_VERSION = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();

// Taccuino Scozia 2026 — offline-first PWA.
// The whole point of this app is consultation with no network (plane/metro),
// so the service worker precaches the full app shell and the fonts.
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    {
      // .json isn't in the workbox globPatterns below, so this file is never
      // precached — every fetch (with cache:"no-store") hits the network.
      name: "write-version-json",
      writeBundle(options) {
        writeFileSync(resolve(options.dir || "dist", "version.json"), JSON.stringify({ version: APP_VERSION }));
      },
    },
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Taccuino Scozia 2026",
        short_name: "Scozia",
        description:
          "Guida da campo offline per un viaggio in Scozia (Londra → Edimburgo).",
        lang: "it",
        dir: "ltr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0E1542",
        theme_color: "#0E1542",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        // Cache Google Fonts so the app's typography survives offline once seen.
        runtimeCaching: [
          {
            // Venue photos: bundled but not precached (keeps the install small);
            // cached on first view so they're available offline afterwards.
            urlPattern: ({ url }) => url.pathname.endsWith(".webp"),
            handler: "CacheFirst",
            options: {
              cacheName: "venue-photos",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 140, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
