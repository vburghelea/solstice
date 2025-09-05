import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";
import { getBlocklist } from "~/features/social";

export const ServerRoute = createServerFileRoute("/api/social/blocklist").methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const page = url.searchParams.get("page");
      const pageSize = url.searchParams.get("pageSize");
      const data = z
        .object({
          page: z.coerce.number().int().min(1).optional(),
          pageSize: z.coerce.number().int().min(1).max(100).optional(),
        })
        .parse({ page, pageSize });
      const result = await getBlocklist({ data });
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("/api/social/blocklist error", error);
      return new Response(
        JSON.stringify({
          success: false,
          errors: [{ code: "SERVER_ERROR", message: "Failed to fetch blocklist" }],
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
