import type { AnyServerRouteWithTypes } from "@tanstack/start-server-core";

declare module "@tanstack/start-server-core" {
  interface ServerFileRoutesByPath {
    [routePath: string]: {
      parentRoute: AnyServerRouteWithTypes;
      id: string;
      path: string;
      fullPath: string;
      children: unknown;
    };
  }
}
