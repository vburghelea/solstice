import { json } from "@tanstack/react-start";
import { auth } from "~/lib/auth";
import { getClientIp, rateLimit } from "~/lib/security";

/**
 * Example of how to implement rate limiting in an auth endpoint
 * This is a reference implementation - adapt to your specific needs
 */
export const APIRoute = {
  POST: async ({ request }: { request: Request }) => {
    try {
      // Apply rate limiting based on client IP
      const clientIp = getClientIp(request.headers);
      await rateLimit("auth", clientIp);

      // Parse request body
      const body = await request.json();
      const { email, password } = body;

      // Perform authentication
      const session = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });

      // Return response
      return session;
    } catch (error) {
      // Handle rate limit errors
      if (error instanceof Error && error.message.includes("Too many")) {
        return json(
          { error: error.message },
          {
            status: 429,
            headers: {
              "Retry-After": "900", // 15 minutes in seconds
            },
          },
        );
      }

      // Handle other errors
      return json({ error: "Authentication failed" }, { status: 401 });
    }
  },
};
