import { Calendar } from "lucide-react";
import { LanguageTag } from "~/components/LanguageTag";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { RoleBadge } from "~/components/ui/RoleBadge";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

type LinkPrimitive = string | number | boolean;

export type CampaignCardLinkConfig = {
  readonly to: string;
  readonly params?: Record<string, LinkPrimitive>;
  readonly search?: Record<string, LinkPrimitive | undefined>;
  readonly from?: string;
  readonly label?: string;
};

interface CampaignCardProps {
  readonly campaign: CampaignListItem;
  readonly viewLink?: CampaignCardLinkConfig;
}

export function CampaignCard({ campaign, viewLink }: CampaignCardProps) {
  const { t } = useCampaignsTranslation();
  const resolvedLink: CampaignCardLinkConfig = {
    to: viewLink?.to ?? "/player/campaigns/$campaignId",
    params: viewLink?.params ?? { campaignId: campaign.id },
    from: viewLink?.from ?? "/player/campaigns",
    label: viewLink?.label ?? t("default_labels.view_campaign"),
    ...(viewLink?.search ? { search: viewLink.search } : {}),
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 text-xl">{campaign.name}</CardTitle>
          {campaign.userRole && (
            <RoleBadge
              role={campaign.userRole.role}
              {...(campaign.userRole.status ? { status: campaign.userRole.status } : {})}
              className="shrink-0"
            />
          )}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center text-sm">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{campaign.recurrence}</span>
        </div>
        {campaign.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {campaign.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {campaign.owner && (
            <div className="flex items-center gap-2">
              <Avatar
                name={campaign.owner.name}
                email={campaign.owner.email}
                srcUploaded={campaign.owner.uploadedAvatarPath ?? null}
                srcProvider={campaign.owner.image ?? null}
                userId={campaign.owner.id}
                className="h-6 w-6"
              />
              <ProfileLink
                userId={campaign.owner.id}
                username={campaign.owner.name || campaign.owner.email}
                className="font-medium"
              />
              <span className="text-muted-foreground">•</span>
              <ThumbsScore value={campaign.owner.gmRating ?? null} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.game_system")}</span>
            <span className="font-medium">{campaign.gameSystem.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.language")}</span>
            <LanguageTag language={campaign.language} className="text-[0.7rem]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.time_of_day")}</span>
            <span className="font-medium">{campaign.timeOfDay}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.session_duration")}</span>
            <span className="font-medium">{campaign.sessionDuration}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.visibility")}</span>
            {campaign.visibility === "protected" ? (
              <Badge variant="secondary">{t("status.connections_teammates")}</Badge>
            ) : (
              <span className="font-medium capitalize">{campaign.visibility}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.participants")}</span>
            <span className="font-medium">{campaign.participantCount}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <LocalizedButtonLink
            variant="outline"
            size="sm"
            className="flex-1"
            to={resolvedLink.to}
            {...(resolvedLink.params ? { params: resolvedLink.params } : {})}
            {...(resolvedLink.search
              ? {
                  search: resolvedLink.search as Record<
                    string,
                    string | number | boolean
                  >,
                }
              : {})}
            {...(resolvedLink.from ? { from: resolvedLink.from } : {})}
            translationKey="links.campaign_management.view_campaign_details"
            translationNamespace="navigation"
          />
        </div>
      </CardContent>
    </Card>
  );
}
