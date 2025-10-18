import type { ComponentType } from "react";
import { Badge } from "~/components/ui/badge";
import { AlertCircle, XCircle } from "~/components/ui/icons";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
import type { AdminSystemStatusFlag } from "../game-systems-admin.types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type FlagConfig = {
  label: string;
  variant: BadgeVariant;
  icon: ComponentType<{ className?: string }> | null;
};

const getFlagConfig = (
  t: (key: string) => string,
): Record<AdminSystemStatusFlag, FlagConfig> => ({
  "missing-summary": {
    label: t("status_labels.missing_summary"),
    variant: "secondary",
    icon: AlertCircle,
  },
  "missing-hero": {
    label: t("status_labels.hero_missing"),
    variant: "destructive",
    icon: XCircle,
  },
  "hero-unmoderated": {
    label: t("status_labels.hero_needs_review"),
    variant: "outline",
    icon: AlertCircle,
  },
  "taxonomy-empty": {
    label: t("status_labels.taxonomy_empty"),
    variant: "outline",
    icon: AlertCircle,
  },
  "cms-unapproved": {
    label: t("status_labels.awaiting_approval"),
    variant: "outline",
    icon: AlertCircle,
  },
  unpublished: {
    label: t("status_labels.unpublished"),
    variant: "outline",
    icon: AlertCircle,
  },
  "unmoderated-media": {
    label: t("status_labels.media_unmoderated"),
    variant: "outline",
    icon: AlertCircle,
  },
  "crawl-partial": {
    label: t("status_labels.crawl_partial"),
    variant: "secondary",
    icon: AlertCircle,
  },
});

interface SystemStatusPillProps {
  flag: AdminSystemStatusFlag;
}

export function SystemStatusPill({ flag }: SystemStatusPillProps) {
  const { t } = useGameSystemsTranslation();
  const flagConfig = getFlagConfig(t);
  const config = flagConfig[flag];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
      {config.label}
    </Badge>
  );
}
