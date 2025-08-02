import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";

export const ServerRoute = createServerFileRoute("/api/logout").methods({
  POST: async ({ request }) => {
    try {
      // 1 - Tell the server to remove the session
      await auth.api.signOut({ headers: request.headers });
    } catch (error) {
      // Ignore errors - we're logging out anyway
      console.error("Logout error:", error);
    }

    // 2 - Return redirect response with clearing multiple cookie formats
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/auth/login",
        // Clear all possible session cookies
        "Set-Cookie": [
          "solstice.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
          "solstice.session.sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
          "better-auth.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
        ].join(", "),
      },
    });
  },
});
