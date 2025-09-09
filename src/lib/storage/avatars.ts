// Server-only avatar storage abstraction supporting local FS (dev) and Netlify Blobs (prod)
// Import only inside server handlers or server routes.

export type StoredAvatar = {
  path: string; // public path to use as <img src>, e.g. /api/avatars/<file>
  contentType: string;
};

const AVATAR_STORE_NAME = "avatars";
const CONTENT_TYPE_WEBP = "image/webp";

function isNetlifyRuntime() {
  try {
    return Boolean(process.env["NETLIFY"] || process.env["NETLIFY_CONTEXT"]);
  } catch {
    return false;
  }
}

export async function saveAvatar(filename: string, data: Buffer): Promise<StoredAvatar> {
  if (isNetlifyRuntime()) {
    try {
      const moduleName: string = "@netlify/blobs";
      // Dynamic import using variable to avoid type resolution at build
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blobsMod: any = await import(moduleName);
      const store = blobsMod.getStore
        ? blobsMod.getStore(AVATAR_STORE_NAME)
        : // Backwards compatibility if API differs
          blobsMod.store?.(AVATAR_STORE_NAME);
      if (!store) throw new Error("Netlify Blobs store not available");
      await store.set(filename, data, { contentType: CONTENT_TYPE_WEBP });
      return { path: `/api/avatars/${filename}`, contentType: CONTENT_TYPE_WEBP };
    } catch {
      // Fallback to local FS if Netlify Blobs is not available
      // no-op, flow continues to local save
    }
  }

  // Local dev: save into public/avatars
  const [{ writeFile, mkdir }, { dirname }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const relPath = `public/${AVATAR_STORE_NAME}/${filename}`;
  await mkdir(dirname(relPath), { recursive: true });
  await writeFile(relPath, data);
  return { path: `/api/avatars/${filename}`, contentType: CONTENT_TYPE_WEBP };
}

export async function readAvatar(
  filename: string,
): Promise<{ data: Uint8Array; contentType: string } | null> {
  if (isNetlifyRuntime()) {
    try {
      const moduleName: string = "@netlify/blobs";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blobsMod: any = await import(moduleName);
      const store = blobsMod.getStore
        ? blobsMod.getStore(AVATAR_STORE_NAME)
        : blobsMod.store?.(AVATAR_STORE_NAME);
      if (!store) throw new Error("Netlify Blobs store not available");
      const blob = await store.get(filename, { type: "arrayBuffer" });
      if (!blob) return null;
      const arr = new Uint8Array(blob as ArrayBuffer);
      return { data: arr, contentType: CONTENT_TYPE_WEBP };
    } catch {
      // Fallback to local FS
    }
  }

  try {
    const [{ readFile }] = await Promise.all([import("node:fs/promises")]);
    const relPath = `public/${AVATAR_STORE_NAME}/${filename}`;
    const buf = await readFile(relPath);
    return { data: new Uint8Array(buf), contentType: CONTENT_TYPE_WEBP };
  } catch {
    return null;
  }
}

export function normalizeUploadedAvatarPath(
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  // Normalize older stored paths like /avatars/<file> to /api/avatars/<file>
  return path.startsWith("/avatars/") ? path.replace("/avatars/", "/api/avatars/") : path;
}
