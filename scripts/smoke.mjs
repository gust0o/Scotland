// Render smoke-test: bundles the app and server-renders <App/> to catch runtime
// errors (e.g. a hook used without importing it) that `vite build` cannot detect.
// Run: node scripts/smoke.mjs
import { build } from "esbuild";
import { renderToString } from "react-dom/server";
import React from "react";
import { join } from "path";
import { unlinkSync } from "fs";

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
// Emit inside node_modules so the bundle's external `import "react"` resolves.
const out = join(process.cwd(), "node_modules", ".scozia-smoke." + process.pid + ".mjs");
await build({
  entryPoints: ["src/App.jsx"], bundle: true, format: "esm", outfile: out,
  loader: { ".json": "json" }, jsx: "automatic", logLevel: "silent",
  external: ["react", "react-dom", "react/jsx-runtime", "react-dom/server"],
});
try {
  const { default: App } = await import("file://" + out);
  const html = renderToString(React.createElement(App));
  if (!html || html.length < 1000) throw new Error("rendered too little HTML (" + (html ? html.length : 0) + ")");
  if (!/SCOZIA|Oggi|Programma|Checklist/.test(html)) throw new Error("rendered HTML missing expected content");
  console.log("✓ smoke OK — App renders (" + html.length + " chars)");
} catch (e) {
  console.error("✗ smoke FAIL:", e.message);
  process.exitCode = 1;
} finally {
  try { unlinkSync(out); } catch {}
}
