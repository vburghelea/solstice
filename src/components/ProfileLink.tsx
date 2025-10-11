import { cn } from "~/shared/lib/utils";

interface ProfileLinkProps {
  userId: string;
  username: string;
  className?: string;
}

export function ProfileLink({ userId, username, className }: ProfileLinkProps) {
  const href = `/profile/${encodeURIComponent(userId)}`;
  return (
    <a href={href} className={cn("text-primary font-medium hover:underline", className)}>
      {username}
    </a>
  );
}
