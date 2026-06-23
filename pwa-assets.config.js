import {
  defineConfig,
  minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

// Generates pwa-192/512, apple-touch-icon, favicon from public/icon.svg.
export default defineConfig({
  preset: minimal2023Preset,
  images: ["public/icon.svg"],
});
