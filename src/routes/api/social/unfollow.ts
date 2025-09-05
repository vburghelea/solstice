import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";
import { unfollowUser } from "~/features/social";

const bodySchema = z.object({ followingId: z.string().min(1) });

export const ServerRoute = createServerFileRoute("/api/social/unfollow").methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const data = bodySchema.parse(body);
      const result = await unfollowUser({ data });
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("/api/social/unfollow error", error);
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to unfollow" }],
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
