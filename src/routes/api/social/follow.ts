import { createServerFileRoute } from "@tanstack/react-start/server";
import { z, ZodError } from "zod";
import { followUser } from "~/features/social";

const bodySchema = z.object({
  followingId: z.string().min(1),
  uiSurface: z.string().min(1).max(50).optional(),
});

export async function handleFollow(body: unknown): Promise<Response> {
  try {
    const data = bodySchema.parse(body);
    const { getWebRequest } = await import("@tanstack/react-start/server");
    const uiHeader = getWebRequest().headers.get("x-ui-surface") || undefined;
    const result = await followUser({
      data: { ...data, uiSurface: data.uiSurface ?? uiHeader },
    });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("/api/social/follow error", error);
    const status = error instanceof ZodError ? 400 : 500;
    const message = error instanceof ZodError ? "Invalid request" : "Failed to follow";
    return new Response(
      JSON.stringify({ success: false, errors: [{ code: "BAD_REQUEST", message }] }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const ServerRoute = createServerFileRoute("/api/social/follow").methods({
  POST: async ({ request }: { request: Request }) => {
    const body = await request.json();
    return handleFollow(body);
  },
});
