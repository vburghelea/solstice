import { createServerFileRoute } from "@tanstack/react-start/server";
import { z, ZodError } from "zod";
import { getBlocklist } from "~/features/social";

export async function handleBlocklist(input: unknown): Promise<Response> {
  try {
    const data = z
      .object({
        page: z.coerce.number().int().min(1).optional(),
        pageSize: z.coerce.number().int().min(1).max(100).optional(),
      })
      .parse(typeof input === "object" && input !== null ? input : {});
    const result = await getBlocklist({ data });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("/api/social/blocklist error", error);
    const status = error instanceof ZodError ? 400 : 500;
    const message =
      error instanceof ZodError ? "Invalid request" : "Failed to fetch blocklist";
    return new Response(
      JSON.stringify({ success: false, errors: [{ code: "BAD_REQUEST", message }] }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const ServerRoute = createServerFileRoute("/api/social/blocklist").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");
    return handleBlocklist({ page, pageSize });
  },
});
