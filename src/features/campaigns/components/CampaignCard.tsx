import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

interface CampaignCardProps {
  campaign: CampaignListItem;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{campaign.name}</CardTitle>
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
            <span className="text-muted-foreground">Game System</span>
            <span className="font-medium">{campaign.gameSystem.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Time of Day</span>
            <span className="font-medium">{campaign.timeOfDay}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Session Duration</span>
            <span className="font-medium">{campaign.sessionDuration}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Visibility</span>
            {campaign.visibility === "protected" ? (
              <Badge variant="secondary">Connections-only</Badge>
            ) : (
              <span className="font-medium capitalize">{campaign.visibility}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium">{campaign.participantCount}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              from="/dashboard/campaigns"
              to="/dashboard/campaigns/$campaignId"
              params={{ campaignId: campaign.id }}
            >
              View Campaign
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
