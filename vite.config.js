/// <reference types="vitest/config" />
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const scssVariables = fs.readFileSync(
  path.resolve(rootDir, "src/styles/variables.scss"),
  "utf8",
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const apiKey = env.API_FOOTBALL_KEY ?? process.env.API_FOOTBALL_KEY ?? "";

  const footballApiProxy = {
    "/football-api": {
      target: "https://v3.football.api-sports.io",
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/football-api/, ""),
      configure: (proxy) => {
        proxy.on("proxyReq", (proxyReq) => {
          if (apiKey) {
            proxyReq.setHeader("x-apisports-key", apiKey);
          } else {
            console.warn(
              "[football-api proxy] API_FOOTBALL_KEY is missing — add it to `.env` locally or Netlify env vars in production",
            );
          }
        });
      },
    },
  };

  return {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `${scssVariables}\n`,
        },
      },
    },
    plugins: [
      react({
        include: "**/*.{js,jsx,ts,tsx}",
      }),
    ],
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { ".js": "jsx" },
      },
    },
    server: {
      proxy: footballApiProxy,
    },
    preview: {
      proxy: footballApiProxy,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/setupTests.js",
    },
  };
});
