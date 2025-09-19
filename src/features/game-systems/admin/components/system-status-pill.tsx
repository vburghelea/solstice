import type { ComponentType } from "react";
import { Badge } from "~/shared/ui/badge";
import { AlertCircle, XCircle } from "~/shared/ui/icons";
import type { AdminSystemStatusFlag } from "../game-systems-admin.types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type FlagConfig = {
  label: string;
  variant: BadgeVariant;
  icon: ComponentType<{ className?: string }> | null;
};

const FLAG_CONFIG: Record<AdminSystemStatusFlag, FlagConfig> = {
  "missing-summary": {
    label: "Missing summary",
    variant: "secondary",
    icon: AlertCircle,
  },
  "missing-hero": {
    label: "Hero missing",
    variant: "destructive",
    icon: XCircle,
  },
  "hero-unmoderated": {
    label: "Hero needs review",
    variant: "outline",
    icon: AlertCircle,
  },
  "taxonomy-empty": {
    label: "Taxonomy empty",
    variant: "outline",
    icon: AlertCircle,
  },
  "cms-unapproved": {
    label: "Awaiting approval",
    variant: "outline",
    icon: AlertCircle,
  },
  unpublished: {
    label: "Unpublished",
    variant: "outline",
    icon: AlertCircle,
  },
  "unmoderated-media": {
    label: "Media unmoderated",
    variant: "outline",
    icon: AlertCircle,
  },
  "crawl-partial": {
    label: "Crawl partial",
    variant: "secondary",
    icon: AlertCircle,
  },
};

interface SystemStatusPillProps {
  flag: AdminSystemStatusFlag;
}

export function SystemStatusPill({ flag }: SystemStatusPillProps) {
  const config = FLAG_CONFIG[flag];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
      {config.label}
    </Badge>
  );
}
