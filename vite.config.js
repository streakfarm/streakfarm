import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // 👈 YE LINE CRITICAL HAI
  plugins: [react()],
});
