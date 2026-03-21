import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions: {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
  },
  webServer: [
    {
      command: "mkdir -p .tmp && rm -f .tmp/e2e-pocketbase.json && DAFUWENG_FIXED_DICE=3,3 DAFUWENG_POCKETBASE_DATA_PATH=.tmp/e2e-pocketbase.json go run ./cmd/api",
      cwd: "../backend",
      url: "http://127.0.0.1:8080/healthz",
      reuseExistingServer: true,
      timeout: 120000
    },
    {
      command: "pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      timeout: 120000
    }
  ]
});
