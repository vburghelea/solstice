import type { AnyServerRouteWithTypes, ServerRoute } from "@tanstack/start-server-core";

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

declare module "@tanstack/react-start/server" {
  export function createFileRoute(): ServerRoute<
    AnyServerRouteWithTypes,
    string,
    string,
    string,
    unknown
  >;
}
