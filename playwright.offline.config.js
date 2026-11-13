import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testDir: "./tests/offline",
  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
