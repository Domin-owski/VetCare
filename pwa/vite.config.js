import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["vetcare.svg"],
      manifest: {
        name: "VetCare",
        short_name: "VetCare",
        description: "Zarządzanie zwierzętami i wizytami weterynaryjnymi",
        theme_color: "#2563eb",
        background_color: "#f4f7fb",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/vetcare.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
});