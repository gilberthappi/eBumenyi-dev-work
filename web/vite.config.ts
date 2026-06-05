import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
    hmr: {
      host: "localhost",
      port: 4173,
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});