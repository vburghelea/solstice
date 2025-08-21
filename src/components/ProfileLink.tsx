import { TypedLink as Link } from "~/components/ui/TypedLink";
import { cn } from "~/shared/lib/utils";

interface ProfileLinkProps {
  userId: string;
  username: string;
  className?: string;
}

export function ProfileLink({ userId, username, className }: ProfileLinkProps) {
  return (
    <Link
      to="/dashboard/profile/$userId"
      params={{ userId }}
      className={cn("text-primary font-medium hover:underline", className)}
    >
      {username}
    </Link>
  );
}
