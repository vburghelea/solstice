import { createFileRoute } from "@tanstack/react-router";
import { z, ZodError } from "zod";
import { getRelationshipSnapshot } from "~/features/social";

export async function handleRelationship(input: unknown): Promise<Response> {
  try {
    const data = z
      .object({ userId: z.string().min(1) })
      .parse(typeof input === "object" && input !== null ? input : {});
    const result = await getRelationshipSnapshot({ data });
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("/api/social/relationship error", error);
    const status = error instanceof ZodError ? 400 : 500;
    const message =
      error instanceof ZodError ? "Invalid request" : "Failed to fetch relationship";
    return new Response(
      JSON.stringify({ success: false, errors: [{ code: "BAD_REQUEST", message }] }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/social/relationship")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        return handleRelationship({ userId });
      },
    },
  },
});
