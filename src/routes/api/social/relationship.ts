import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";
import { getRelationshipSnapshot } from "~/features/social";

export const ServerRoute = createServerFileRoute("/api/social/relationship").methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      const data = z.object({ userId: z.string().min(1) }).parse({ userId });
      const result = await getRelationshipSnapshot({ data });
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("/api/social/relationship error", error);
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to fetch relationship" }],
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
