/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createServerRootRoute } from "@tanstack/react-start/server";

import { Route as rootRouteImport } from "./routes/__root";
import { Route as OnboardingRouteRouteImport } from "./routes/onboarding/route";
import { Route as DashboardRouteRouteImport } from "./routes/dashboard/route";
import { Route as AuthRouteRouteImport } from "./routes/auth/route";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as OnboardingIndexRouteImport } from "./routes/onboarding/index";
import { Route as DashboardIndexRouteImport } from "./routes/dashboard/index";
import { Route as DashboardTeamsRouteImport } from "./routes/dashboard/teams";
import { Route as DashboardProfileRouteImport } from "./routes/dashboard/profile";
import { Route as DashboardMembershipRouteImport } from "./routes/dashboard/membership";
import { Route as AuthSignupRouteImport } from "./routes/auth/signup";
import { Route as AuthLoginRouteImport } from "./routes/auth/login";
import { Route as DashboardTeamsIndexRouteImport } from "./routes/dashboard/teams/index";
import { Route as DashboardTeamsCreateRouteImport } from "./routes/dashboard/teams/create";
import { Route as DashboardTeamsBrowseRouteImport } from "./routes/dashboard/teams/browse";
import { Route as DashboardTeamsTeamIdRouteImport } from "./routes/dashboard/teams/$teamId";
import { Route as DashboardTeamsTeamIdMembersRouteImport } from "./routes/dashboard/teams/$teamId.members";
import { Route as DashboardTeamsTeamIdManageRouteImport } from "./routes/dashboard/teams/$teamId.manage";
import { ServerRoute as ApiHealthServerRouteImport } from "./routes/api/health";
import { ServerRoute as ApiWebhooksSquareServerRouteImport } from "./routes/api/webhooks/square";
import { ServerRoute as ApiAuthSplatServerRouteImport } from "./routes/api/auth/$";
import { ServerRoute as ApiPaymentsSquareCallbackServerRouteImport } from "./routes/api/payments/square/callback";
import { ServerRoute as ApiAuthActionProviderServerRouteImport } from "./routes/api/auth/$action/$provider";

const rootServerRouteImport = createServerRootRoute();

const OnboardingRouteRoute = OnboardingRouteRouteImport.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => rootRouteImport,
} as any);
const DashboardRouteRoute = DashboardRouteRouteImport.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => rootRouteImport,
} as any);
const AuthRouteRoute = AuthRouteRouteImport.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => rootRouteImport,
} as any);
const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
} as any);
const OnboardingIndexRoute = OnboardingIndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => OnboardingRouteRoute,
} as any);
const DashboardIndexRoute = DashboardIndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRouteRoute,
} as any);
const DashboardTeamsRoute = DashboardTeamsRouteImport.update({
  id: "/teams",
  path: "/teams",
  getParentRoute: () => DashboardRouteRoute,
} as any);
const DashboardProfileRoute = DashboardProfileRouteImport.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => DashboardRouteRoute,
} as any);
const DashboardMembershipRoute = DashboardMembershipRouteImport.update({
  id: "/membership",
  path: "/membership",
  getParentRoute: () => DashboardRouteRoute,
} as any);
const AuthSignupRoute = AuthSignupRouteImport.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => AuthRouteRoute,
} as any);
const AuthLoginRoute = AuthLoginRouteImport.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => AuthRouteRoute,
} as any);
const DashboardTeamsIndexRoute = DashboardTeamsIndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardTeamsRoute,
} as any);
const DashboardTeamsCreateRoute = DashboardTeamsCreateRouteImport.update({
  id: "/create",
  path: "/create",
  getParentRoute: () => DashboardTeamsRoute,
} as any);
const DashboardTeamsBrowseRoute = DashboardTeamsBrowseRouteImport.update({
  id: "/browse",
  path: "/browse",
  getParentRoute: () => DashboardTeamsRoute,
} as any);
const DashboardTeamsTeamIdRoute = DashboardTeamsTeamIdRouteImport.update({
  id: "/$teamId",
  path: "/$teamId",
  getParentRoute: () => DashboardTeamsRoute,
} as any);
const DashboardTeamsTeamIdMembersRoute =
  DashboardTeamsTeamIdMembersRouteImport.update({
    id: "/members",
    path: "/members",
    getParentRoute: () => DashboardTeamsTeamIdRoute,
  } as any);
const DashboardTeamsTeamIdManageRoute =
  DashboardTeamsTeamIdManageRouteImport.update({
    id: "/manage",
    path: "/manage",
    getParentRoute: () => DashboardTeamsTeamIdRoute,
  } as any);
const ApiHealthServerRoute = ApiHealthServerRouteImport.update({
  id: "/api/health",
  path: "/api/health",
  getParentRoute: () => rootServerRouteImport,
} as any);
const ApiWebhooksSquareServerRoute = ApiWebhooksSquareServerRouteImport.update({
  id: "/api/webhooks/square",
  path: "/api/webhooks/square",
  getParentRoute: () => rootServerRouteImport,
} as any);
const ApiAuthSplatServerRoute = ApiAuthSplatServerRouteImport.update({
  id: "/api/auth/$",
  path: "/api/auth/$",
  getParentRoute: () => rootServerRouteImport,
} as any);
const ApiPaymentsSquareCallbackServerRoute =
  ApiPaymentsSquareCallbackServerRouteImport.update({
    id: "/api/payments/square/callback",
    path: "/api/payments/square/callback",
    getParentRoute: () => rootServerRouteImport,
  } as any);
const ApiAuthActionProviderServerRoute =
  ApiAuthActionProviderServerRouteImport.update({
    id: "/api/auth/$action/$provider",
    path: "/api/auth/$action/$provider",
    getParentRoute: () => rootServerRouteImport,
  } as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRouteRouteWithChildren;
  "/dashboard": typeof DashboardRouteRouteWithChildren;
  "/onboarding": typeof OnboardingRouteRouteWithChildren;
  "/auth/login": typeof AuthLoginRoute;
  "/auth/signup": typeof AuthSignupRoute;
  "/dashboard/membership": typeof DashboardMembershipRoute;
  "/dashboard/profile": typeof DashboardProfileRoute;
  "/dashboard/teams": typeof DashboardTeamsRouteWithChildren;
  "/dashboard/": typeof DashboardIndexRoute;
  "/onboarding/": typeof OnboardingIndexRoute;
  "/dashboard/teams/$teamId": typeof DashboardTeamsTeamIdRouteWithChildren;
  "/dashboard/teams/browse": typeof DashboardTeamsBrowseRoute;
  "/dashboard/teams/create": typeof DashboardTeamsCreateRoute;
  "/dashboard/teams/": typeof DashboardTeamsIndexRoute;
  "/dashboard/teams/$teamId/manage": typeof DashboardTeamsTeamIdManageRoute;
  "/dashboard/teams/$teamId/members": typeof DashboardTeamsTeamIdMembersRoute;
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRouteRouteWithChildren;
  "/auth/login": typeof AuthLoginRoute;
  "/auth/signup": typeof AuthSignupRoute;
  "/dashboard/membership": typeof DashboardMembershipRoute;
  "/dashboard/profile": typeof DashboardProfileRoute;
  "/dashboard": typeof DashboardIndexRoute;
  "/onboarding": typeof OnboardingIndexRoute;
  "/dashboard/teams/$teamId": typeof DashboardTeamsTeamIdRouteWithChildren;
  "/dashboard/teams/browse": typeof DashboardTeamsBrowseRoute;
  "/dashboard/teams/create": typeof DashboardTeamsCreateRoute;
  "/dashboard/teams": typeof DashboardTeamsIndexRoute;
  "/dashboard/teams/$teamId/manage": typeof DashboardTeamsTeamIdManageRoute;
  "/dashboard/teams/$teamId/members": typeof DashboardTeamsTeamIdMembersRoute;
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/auth": typeof AuthRouteRouteWithChildren;
  "/dashboard": typeof DashboardRouteRouteWithChildren;
  "/onboarding": typeof OnboardingRouteRouteWithChildren;
  "/auth/login": typeof AuthLoginRoute;
  "/auth/signup": typeof AuthSignupRoute;
  "/dashboard/membership": typeof DashboardMembershipRoute;
  "/dashboard/profile": typeof DashboardProfileRoute;
  "/dashboard/teams": typeof DashboardTeamsRouteWithChildren;
  "/dashboard/": typeof DashboardIndexRoute;
  "/onboarding/": typeof OnboardingIndexRoute;
  "/dashboard/teams/$teamId": typeof DashboardTeamsTeamIdRouteWithChildren;
  "/dashboard/teams/browse": typeof DashboardTeamsBrowseRoute;
  "/dashboard/teams/create": typeof DashboardTeamsCreateRoute;
  "/dashboard/teams/": typeof DashboardTeamsIndexRoute;
  "/dashboard/teams/$teamId/manage": typeof DashboardTeamsTeamIdManageRoute;
  "/dashboard/teams/$teamId/members": typeof DashboardTeamsTeamIdMembersRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths:
    | "/"
    | "/auth"
    | "/dashboard"
    | "/onboarding"
    | "/auth/login"
    | "/auth/signup"
    | "/dashboard/membership"
    | "/dashboard/profile"
    | "/dashboard/teams"
    | "/dashboard/"
    | "/onboarding/"
    | "/dashboard/teams/$teamId"
    | "/dashboard/teams/browse"
    | "/dashboard/teams/create"
    | "/dashboard/teams/"
    | "/dashboard/teams/$teamId/manage"
    | "/dashboard/teams/$teamId/members";
  fileRoutesByTo: FileRoutesByTo;
  to:
    | "/"
    | "/auth"
    | "/auth/login"
    | "/auth/signup"
    | "/dashboard/membership"
    | "/dashboard/profile"
    | "/dashboard"
    | "/onboarding"
    | "/dashboard/teams/$teamId"
    | "/dashboard/teams/browse"
    | "/dashboard/teams/create"
    | "/dashboard/teams"
    | "/dashboard/teams/$teamId/manage"
    | "/dashboard/teams/$teamId/members";
  id:
    | "__root__"
    | "/"
    | "/auth"
    | "/dashboard"
    | "/onboarding"
    | "/auth/login"
    | "/auth/signup"
    | "/dashboard/membership"
    | "/dashboard/profile"
    | "/dashboard/teams"
    | "/dashboard/"
    | "/onboarding/"
    | "/dashboard/teams/$teamId"
    | "/dashboard/teams/browse"
    | "/dashboard/teams/create"
    | "/dashboard/teams/"
    | "/dashboard/teams/$teamId/manage"
    | "/dashboard/teams/$teamId/members";
  fileRoutesById: FileRoutesById;
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  AuthRouteRoute: typeof AuthRouteRouteWithChildren;
  DashboardRouteRoute: typeof DashboardRouteRouteWithChildren;
  OnboardingRouteRoute: typeof OnboardingRouteRouteWithChildren;
}
export interface FileServerRoutesByFullPath {
  "/api/health": typeof ApiHealthServerRoute;
  "/api/auth/$": typeof ApiAuthSplatServerRoute;
  "/api/webhooks/square": typeof ApiWebhooksSquareServerRoute;
  "/api/auth/$action/$provider": typeof ApiAuthActionProviderServerRoute;
  "/api/payments/square/callback": typeof ApiPaymentsSquareCallbackServerRoute;
}
export interface FileServerRoutesByTo {
  "/api/health": typeof ApiHealthServerRoute;
  "/api/auth/$": typeof ApiAuthSplatServerRoute;
  "/api/webhooks/square": typeof ApiWebhooksSquareServerRoute;
  "/api/auth/$action/$provider": typeof ApiAuthActionProviderServerRoute;
  "/api/payments/square/callback": typeof ApiPaymentsSquareCallbackServerRoute;
}
export interface FileServerRoutesById {
  __root__: typeof rootServerRouteImport;
  "/api/health": typeof ApiHealthServerRoute;
  "/api/auth/$": typeof ApiAuthSplatServerRoute;
  "/api/webhooks/square": typeof ApiWebhooksSquareServerRoute;
  "/api/auth/$action/$provider": typeof ApiAuthActionProviderServerRoute;
  "/api/payments/square/callback": typeof ApiPaymentsSquareCallbackServerRoute;
}
export interface FileServerRouteTypes {
  fileServerRoutesByFullPath: FileServerRoutesByFullPath;
  fullPaths:
    | "/api/health"
    | "/api/auth/$"
    | "/api/webhooks/square"
    | "/api/auth/$action/$provider"
    | "/api/payments/square/callback";
  fileServerRoutesByTo: FileServerRoutesByTo;
  to:
    | "/api/health"
    | "/api/auth/$"
    | "/api/webhooks/square"
    | "/api/auth/$action/$provider"
    | "/api/payments/square/callback";
  id:
    | "__root__"
    | "/api/health"
    | "/api/auth/$"
    | "/api/webhooks/square"
    | "/api/auth/$action/$provider"
    | "/api/payments/square/callback";
  fileServerRoutesById: FileServerRoutesById;
}
export interface RootServerRouteChildren {
  ApiHealthServerRoute: typeof ApiHealthServerRoute;
  ApiAuthSplatServerRoute: typeof ApiAuthSplatServerRoute;
  ApiWebhooksSquareServerRoute: typeof ApiWebhooksSquareServerRoute;
  ApiAuthActionProviderServerRoute: typeof ApiAuthActionProviderServerRoute;
  ApiPaymentsSquareCallbackServerRoute: typeof ApiPaymentsSquareCallbackServerRoute;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/onboarding": {
      id: "/onboarding";
      path: "/onboarding";
      fullPath: "/onboarding";
      preLoaderRoute: typeof OnboardingRouteRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/dashboard": {
      id: "/dashboard";
      path: "/dashboard";
      fullPath: "/dashboard";
      preLoaderRoute: typeof DashboardRouteRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/auth": {
      id: "/auth";
      path: "/auth";
      fullPath: "/auth";
      preLoaderRoute: typeof AuthRouteRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/onboarding/": {
      id: "/onboarding/";
      path: "/";
      fullPath: "/onboarding/";
      preLoaderRoute: typeof OnboardingIndexRouteImport;
      parentRoute: typeof OnboardingRouteRoute;
    };
    "/dashboard/": {
      id: "/dashboard/";
      path: "/";
      fullPath: "/dashboard/";
      preLoaderRoute: typeof DashboardIndexRouteImport;
      parentRoute: typeof DashboardRouteRoute;
    };
    "/dashboard/teams": {
      id: "/dashboard/teams";
      path: "/teams";
      fullPath: "/dashboard/teams";
      preLoaderRoute: typeof DashboardTeamsRouteImport;
      parentRoute: typeof DashboardRouteRoute;
    };
    "/dashboard/profile": {
      id: "/dashboard/profile";
      path: "/profile";
      fullPath: "/dashboard/profile";
      preLoaderRoute: typeof DashboardProfileRouteImport;
      parentRoute: typeof DashboardRouteRoute;
    };
    "/dashboard/membership": {
      id: "/dashboard/membership";
      path: "/membership";
      fullPath: "/dashboard/membership";
      preLoaderRoute: typeof DashboardMembershipRouteImport;
      parentRoute: typeof DashboardRouteRoute;
    };
    "/auth/signup": {
      id: "/auth/signup";
      path: "/signup";
      fullPath: "/auth/signup";
      preLoaderRoute: typeof AuthSignupRouteImport;
      parentRoute: typeof AuthRouteRoute;
    };
    "/auth/login": {
      id: "/auth/login";
      path: "/login";
      fullPath: "/auth/login";
      preLoaderRoute: typeof AuthLoginRouteImport;
      parentRoute: typeof AuthRouteRoute;
    };
    "/dashboard/teams/": {
      id: "/dashboard/teams/";
      path: "/";
      fullPath: "/dashboard/teams/";
      preLoaderRoute: typeof DashboardTeamsIndexRouteImport;
      parentRoute: typeof DashboardTeamsRoute;
    };
    "/dashboard/teams/create": {
      id: "/dashboard/teams/create";
      path: "/create";
      fullPath: "/dashboard/teams/create";
      preLoaderRoute: typeof DashboardTeamsCreateRouteImport;
      parentRoute: typeof DashboardTeamsRoute;
    };
    "/dashboard/teams/browse": {
      id: "/dashboard/teams/browse";
      path: "/browse";
      fullPath: "/dashboard/teams/browse";
      preLoaderRoute: typeof DashboardTeamsBrowseRouteImport;
      parentRoute: typeof DashboardTeamsRoute;
    };
    "/dashboard/teams/$teamId": {
      id: "/dashboard/teams/$teamId";
      path: "/$teamId";
      fullPath: "/dashboard/teams/$teamId";
      preLoaderRoute: typeof DashboardTeamsTeamIdRouteImport;
      parentRoute: typeof DashboardTeamsRoute;
    };
    "/dashboard/teams/$teamId/members": {
      id: "/dashboard/teams/$teamId/members";
      path: "/members";
      fullPath: "/dashboard/teams/$teamId/members";
      preLoaderRoute: typeof DashboardTeamsTeamIdMembersRouteImport;
      parentRoute: typeof DashboardTeamsTeamIdRoute;
    };
    "/dashboard/teams/$teamId/manage": {
      id: "/dashboard/teams/$teamId/manage";
      path: "/manage";
      fullPath: "/dashboard/teams/$teamId/manage";
      preLoaderRoute: typeof DashboardTeamsTeamIdManageRouteImport;
      parentRoute: typeof DashboardTeamsTeamIdRoute;
    };
  }
}
declare module "@tanstack/react-start/server" {
  interface ServerFileRoutesByPath {
    "/api/health": {
      id: "/api/health";
      path: "/api/health";
      fullPath: "/api/health";
      preLoaderRoute: typeof ApiHealthServerRouteImport;
      parentRoute: typeof rootServerRouteImport;
    };
    "/api/webhooks/square": {
      id: "/api/webhooks/square";
      path: "/api/webhooks/square";
      fullPath: "/api/webhooks/square";
      preLoaderRoute: typeof ApiWebhooksSquareServerRouteImport;
      parentRoute: typeof rootServerRouteImport;
    };
    "/api/auth/$": {
      id: "/api/auth/$";
      path: "/api/auth/$";
      fullPath: "/api/auth/$";
      preLoaderRoute: typeof ApiAuthSplatServerRouteImport;
      parentRoute: typeof rootServerRouteImport;
    };
    "/api/payments/square/callback": {
      id: "/api/payments/square/callback";
      path: "/api/payments/square/callback";
      fullPath: "/api/payments/square/callback";
      preLoaderRoute: typeof ApiPaymentsSquareCallbackServerRouteImport;
      parentRoute: typeof rootServerRouteImport;
    };
    "/api/auth/$action/$provider": {
      id: "/api/auth/$action/$provider";
      path: "/api/auth/$action/$provider";
      fullPath: "/api/auth/$action/$provider";
      preLoaderRoute: typeof ApiAuthActionProviderServerRouteImport;
      parentRoute: typeof rootServerRouteImport;
    };
  }
}

interface AuthRouteRouteChildren {
  AuthLoginRoute: typeof AuthLoginRoute;
  AuthSignupRoute: typeof AuthSignupRoute;
}

const AuthRouteRouteChildren: AuthRouteRouteChildren = {
  AuthLoginRoute: AuthLoginRoute,
  AuthSignupRoute: AuthSignupRoute,
};

const AuthRouteRouteWithChildren = AuthRouteRoute._addFileChildren(
  AuthRouteRouteChildren,
);

interface DashboardTeamsTeamIdRouteChildren {
  DashboardTeamsTeamIdManageRoute: typeof DashboardTeamsTeamIdManageRoute;
  DashboardTeamsTeamIdMembersRoute: typeof DashboardTeamsTeamIdMembersRoute;
}

const DashboardTeamsTeamIdRouteChildren: DashboardTeamsTeamIdRouteChildren = {
  DashboardTeamsTeamIdManageRoute: DashboardTeamsTeamIdManageRoute,
  DashboardTeamsTeamIdMembersRoute: DashboardTeamsTeamIdMembersRoute,
};

const DashboardTeamsTeamIdRouteWithChildren =
  DashboardTeamsTeamIdRoute._addFileChildren(DashboardTeamsTeamIdRouteChildren);

interface DashboardTeamsRouteChildren {
  DashboardTeamsTeamIdRoute: typeof DashboardTeamsTeamIdRouteWithChildren;
  DashboardTeamsBrowseRoute: typeof DashboardTeamsBrowseRoute;
  DashboardTeamsCreateRoute: typeof DashboardTeamsCreateRoute;
  DashboardTeamsIndexRoute: typeof DashboardTeamsIndexRoute;
}

const DashboardTeamsRouteChildren: DashboardTeamsRouteChildren = {
  DashboardTeamsTeamIdRoute: DashboardTeamsTeamIdRouteWithChildren,
  DashboardTeamsBrowseRoute: DashboardTeamsBrowseRoute,
  DashboardTeamsCreateRoute: DashboardTeamsCreateRoute,
  DashboardTeamsIndexRoute: DashboardTeamsIndexRoute,
};

const DashboardTeamsRouteWithChildren = DashboardTeamsRoute._addFileChildren(
  DashboardTeamsRouteChildren,
);

interface DashboardRouteRouteChildren {
  DashboardMembershipRoute: typeof DashboardMembershipRoute;
  DashboardProfileRoute: typeof DashboardProfileRoute;
  DashboardTeamsRoute: typeof DashboardTeamsRouteWithChildren;
  DashboardIndexRoute: typeof DashboardIndexRoute;
}

const DashboardRouteRouteChildren: DashboardRouteRouteChildren = {
  DashboardMembershipRoute: DashboardMembershipRoute,
  DashboardProfileRoute: DashboardProfileRoute,
  DashboardTeamsRoute: DashboardTeamsRouteWithChildren,
  DashboardIndexRoute: DashboardIndexRoute,
};

const DashboardRouteRouteWithChildren = DashboardRouteRoute._addFileChildren(
  DashboardRouteRouteChildren,
);

interface OnboardingRouteRouteChildren {
  OnboardingIndexRoute: typeof OnboardingIndexRoute;
}

const OnboardingRouteRouteChildren: OnboardingRouteRouteChildren = {
  OnboardingIndexRoute: OnboardingIndexRoute,
};

const OnboardingRouteRouteWithChildren = OnboardingRouteRoute._addFileChildren(
  OnboardingRouteRouteChildren,
);

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthRouteRoute: AuthRouteRouteWithChildren,
  DashboardRouteRoute: DashboardRouteRouteWithChildren,
  OnboardingRouteRoute: OnboardingRouteRouteWithChildren,
};
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
const rootServerRouteChildren: RootServerRouteChildren = {
  ApiHealthServerRoute: ApiHealthServerRoute,
  ApiAuthSplatServerRoute: ApiAuthSplatServerRoute,
  ApiWebhooksSquareServerRoute: ApiWebhooksSquareServerRoute,
  ApiAuthActionProviderServerRoute: ApiAuthActionProviderServerRoute,
  ApiPaymentsSquareCallbackServerRoute: ApiPaymentsSquareCallbackServerRoute,
};
export const serverRouteTree = rootServerRouteImport
  ._addFileChildren(rootServerRouteChildren)
  ._addFileTypes<FileServerRouteTypes>();
