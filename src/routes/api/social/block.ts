import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";
import { blockUser } from "~/features/social";

const bodySchema = z.object({
  userId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const ServerRoute = createServerFileRoute("/api/social/block").methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const data = bodySchema.parse(body);
      const result = await blockUser({ data });
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("/api/social/block error", error);
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to block" }],
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
