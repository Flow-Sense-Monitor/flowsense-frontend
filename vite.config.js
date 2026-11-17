import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento (npm run dev), as chamadas para /api são repassadas ao backend local,
// assim o navegador fala com um único endereço e não precisa de CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // O Recharts sozinho tem ~400 kB; para um dashboard de página única isso é aceitável.
    build: { chunkSizeWarningLimit: 700 },
    server: {
      proxy: {
        "/api": env.VITE_PROXY_BACKEND || "http://localhost:8080",
      },
    },
  };
});
