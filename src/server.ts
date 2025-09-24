import type { Register } from "@tanstack/react-start";
import type { RequestHandler } from "@tanstack/react-start/server";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

const fetch = createStartHandler(defaultStreamHandler);

export default {
  fetch: fetch as RequestHandler<Register>,
};
