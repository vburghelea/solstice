import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { normalizeUploadedAvatarPath } from "~/shared/lib/avatar-url";
import { cn } from "~/shared/lib/utils";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  srcUploaded?: string | null;
  srcProvider?: string | null;
  className?: string;
  alt?: string;
}

export function UserAvatar({
  name,
  email,
  srcUploaded,
  srcProvider,
  className,
  alt,
}: UserAvatarProps) {
  const letter = (name || email || "?").charAt(0).toUpperCase();
  const normalized = normalizeUploadedAvatarPath(srcUploaded || undefined);
  const src = normalized || srcProvider || undefined;
  const ariaLabel = alt || name || email || "User avatar";
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={src} alt={ariaLabel} />
      <AvatarFallback>{letter}</AvatarFallback>
    </Avatar>
  );
}
