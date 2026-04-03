import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["react-is", "recharts"],
  },
  resolve: {
    alias: {
      // It was likely trying to run this line below that caused the crash
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
