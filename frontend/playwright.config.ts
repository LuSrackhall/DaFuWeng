import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

const localChromeExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const frontendPort = process.env.DAFUWENG_E2E_FRONTEND_PORT ?? "4173";
const backendPort = process.env.DAFUWENG_E2E_BACKEND_PORT ?? "8080";
const apiBaseUrl = process.env.DAFUWENG_E2E_API_BASE_URL ?? `http://127.0.0.1:${backendPort}`;
const pocketBaseDataPath = process.env.DAFUWENG_E2E_POCKETBASE_DATA_PATH ?? ".tmp/e2e-pocketbase.json";
const fixedDice = process.env.DAFUWENG_E2E_FIXED_DICE ?? "3,3";
const reuseExistingServer = process.env.DAFUWENG_E2E_REUSE_SERVER !== "false";

const launchOptions = process.env.CI || !existsSync(localChromeExecutablePath)
  ? undefined
  : {
      executablePath: localChromeExecutablePath,
    };

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    launchOptions
  },
  webServer: [
    {
      command: `mkdir -p .tmp && rm -f ${pocketBaseDataPath} && DAFUWENG_FIXED_DICE=${fixedDice} DAFUWENG_HTTP_ADDR=:${backendPort} DAFUWENG_POCKETBASE_DATA_PATH=${pocketBaseDataPath} go run ./cmd/api`,
      cwd: "../backend",
      url: `http://127.0.0.1:${backendPort}/healthz`,
      reuseExistingServer,
      timeout: 120000
    },
    {
      command: `VITE_API_BASE_URL=${apiBaseUrl} pnpm build && VITE_API_BASE_URL=${apiBaseUrl} pnpm exec vite preview --host 127.0.0.1 --port ${frontendPort}`,
      url: `http://127.0.0.1:${frontendPort}`,
      reuseExistingServer,
      timeout: 120000
    }
  ]
});
