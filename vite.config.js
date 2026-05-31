/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.API_FOOTBALL_KEY ?? env.VITE_API_FOOTBALL_KEY ?? "";

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
              "[football-api proxy] API_FOOTBALL_KEY is missing — add it to .env (not .env.example)",
            );
          }
        });
      },
    },
  };

  return {
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
