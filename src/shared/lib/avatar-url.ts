export function normalizeUploadedAvatarPath(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith("/avatars/") ? path.replace("/avatars/", "/api/avatars/") : path;
}
