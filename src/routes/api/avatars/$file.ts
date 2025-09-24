import { createServerFileRoute } from "@tanstack/react-start/server";

export async function getAvatarResponse(
  fileParam: string | undefined,
): Promise<Response> {
  try {
    const file = fileParam;
    if (!file || !/^[a-zA-Z0-9._-]+$/.test(file)) {
      return new Response("Bad Request", { status: 400 });
    }
    const { readAvatar } = await import("~/lib/storage/avatars");
    const result = await readAvatar(file);
    if (!result) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    headers.set("Content-Type", result.contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    const full = result.data;
    const buf = full.buffer as ArrayBuffer;
    const ab =
      full.byteOffset === 0 && full.byteLength === buf.byteLength
        ? buf
        : buf.slice(full.byteOffset, full.byteOffset + full.byteLength);
    return new Response(ab, { status: 200, headers });
  } catch (e) {
    console.error("avatar serve error", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export const ServerRoute = createServerFileRoute("/api/avatars/$file").methods({
  GET: async ({ params }: { params: { file?: string } }) =>
    getAvatarResponse(params.file),
});
