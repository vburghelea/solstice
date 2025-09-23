declare module "vite-plugin-pwa" {
  import type { PluginOption } from "vite";

  export function VitePWA(options?: Record<string, unknown>): PluginOption;
}
