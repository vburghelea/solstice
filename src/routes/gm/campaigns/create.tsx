import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { createCampaign } from "~/features/campaigns/campaigns.mutations";
import { createCampaignInputSchema } from "~/features/campaigns/campaigns.schemas";
import { CampaignForm } from "~/features/campaigns/components/CampaignForm";
import { cn } from "~/shared/lib/utils";

export const Route = createFileRoute("/gm/campaigns/create")({
  component: CreateCampaignPage,
});
type CampaignCreateViewProps = {
  readonly basePath: string;
  readonly tips?: ReactNode;
};

export function CampaignCreateView({ basePath, tips }: CampaignCreateViewProps) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data) => {
      if (data.success) {
        void navigate({ to: `${basePath}/${data.data?.id}` } as never);
      } else {
        setServerError(data.errors?.[0]?.message || "Failed to create campaign");
      }
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create campaign");
    },
  });

  const gridClass = tips
    ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-[minmax(0,2fr)_minmax(0,20rem)]"
    : "grid gap-6 mx-auto max-w-3xl";

  return (
    <div className="space-y-6">
      <div className={gridClass}>
        <Card className={cn(tips ? "md:col-span-1" : "")}>
          <CardHeader>
            <CardTitle className="text-foreground">Create a New Campaign</CardTitle>
            <CardDescription>
              Set up your campaign and start inviting players
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4">
                <div className="flex-1">
                  <p className="font-medium">Error creating campaign</p>
                  <p className="mt-1 text-sm">{serverError}</p>
                </div>
              </div>
            )}

            <CampaignForm
              onSubmit={async (values) => {
                setServerError(null);
                await createCampaignMutation.mutateAsync({
                  data: values as z.infer<typeof createCampaignInputSchema>,
                });
              }}
              isSubmitting={createCampaignMutation.isPending}
              onCancelEdit={() => navigate({ to: basePath } as never)}
            />
          </CardContent>
        </Card>
        {tips ? <>{tips}</> : null}
      </div>
    </div>
  );
}

export function CampaignTipsCard() {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Campaign tips</CardTitle>
        <CardDescription>
          Quick reminders to help your table feel prepared from day one.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-4 text-sm">
        <div>
          <p className="text-foreground font-medium">Clarify the experience</p>
          <p className="mt-1">
            Use your description to outline tone, cadence, and expectations so players
            know if the campaign fits their style.
          </p>
        </div>
        <div>
          <p className="text-foreground font-medium">Set table limits early</p>
          <p className="mt-1">
            Minimums and maximums help players self-select. Share what safety tools you
            are using and call out any recurring logistics.
          </p>
        </div>
        <div>
          <p className="text-foreground font-medium">Plan for onboarding</p>
          <p className="mt-1">
            If you run a session zero, mention what you cover and any prep work. It keeps
            everyone aligned before the first roll.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCampaignPage() {
  return <CampaignCreateView basePath="/gm/campaigns" tips={<CampaignTipsCard />} />;
}
