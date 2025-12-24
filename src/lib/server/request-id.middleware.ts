import { createMiddleware } from "@tanstack/react-start";
import { runWithRequestContext } from "~/lib/server/request-context";
import { resolveRequestId } from "~/lib/server/request-id";

export const requestIdMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getRequest, setResponseHeader } =
      await import("@tanstack/react-start/server");

    const request = getRequest();
    const requestId = resolveRequestId(request.headers);

    setResponseHeader("x-request-id", requestId);

    return runWithRequestContext({ requestId, headers: request.headers }, () =>
      next({ context: { requestId } }),
    );
  },
);
