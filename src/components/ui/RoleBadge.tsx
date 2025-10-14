import type { ParticipantRole, ParticipantStatus } from "~/shared/types/participants";
import { Badge } from "./badge";

interface RoleBadgeProps {
  role: ParticipantRole;
  status?: ParticipantStatus;
  className?: string;
  compact?: boolean;
}

export function RoleBadge({
  role,
  status,
  className = "",
  compact = false,
}: RoleBadgeProps) {
  const getRoleVariant = (role: ParticipantRole) => {
    switch (role) {
      case "owner":
        return "default" as const;
      case "player":
        return "secondary" as const;
      case "invited":
        return "outline" as const;
      case "applicant":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getRoleLabel = (role: ParticipantRole, status?: ParticipantStatus) => {
    switch (role) {
      case "owner":
        return "Organizer";
      case "player":
        return status === "approved" ? "Participant" : "Pending";
      case "invited":
        return "Invitee";
      case "applicant":
        return status === "pending" ? "Requested" : "Applicant";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: ParticipantRole) => {
    switch (role) {
      case "owner":
        return "👑";
      case "player":
        return "🎭";
      case "invited":
        return "📧";
      case "applicant":
        return "📝";
      default:
        return "";
    }
  };

  if (compact) {
    return (
      <Badge variant={getRoleVariant(role)} className={className} role="status">
        {getRoleIcon(role)} {getRoleLabel(role, status)}
      </Badge>
    );
  }

  return (
    <Badge variant={getRoleVariant(role)} className={className} role="status">
      <span className="mr-1">{getRoleIcon(role)}</span>
      {getRoleLabel(role, status)}
    </Badge>
  );
}
