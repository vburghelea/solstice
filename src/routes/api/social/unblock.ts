import { createServerFileRoute } from "@tanstack/react-start/server";
import { z, ZodError } from "zod";
import { unblockUser } from "~/features/social";

const bodySchema = z.object({
  userId: z.string().min(1),
  uiSurface: z.string().min(1).max(50).optional(),
});

export async function handleUnblock(body: unknown): Promise<Response> {
  try {
    const data = bodySchema.parse(body);
    const { getWebRequest } = await import("@tanstack/react-start/server");
    const uiHeader = getWebRequest().headers.get("x-ui-surface") || undefined;
    const result = await unblockUser({
      data: { ...data, uiSurface: data.uiSurface ?? uiHeader },
    });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("/api/social/unblock error", error);
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? "Invalid request" : "Failed to unblock";
    return new Response(
      JSON.stringify({ success: false, errors: [{ code: "BAD_REQUEST", message }] }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const ServerRoute = createServerFileRoute("/api/social/unblock").methods({
  POST: async ({ request }) => {
    const body = await request.json();
    return handleUnblock(body);
  },
});
