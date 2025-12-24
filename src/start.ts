import { createStart } from "@tanstack/react-start";
import { orgContextMiddleware } from "~/lib/auth/guards/org-context";
import { requestIdMiddleware } from "~/lib/server/request-id.middleware";

export const startInstance = createStart(() => ({
  functionMiddleware: [requestIdMiddleware, orgContextMiddleware],
}));
