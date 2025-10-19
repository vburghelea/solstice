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
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
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
  const { t } = useCampaignsTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data) => {
      if (data.success) {
        void navigate({ to: `${basePath}/${data.data?.id}` } as never);
      } else {
        setServerError(
          data.errors?.[0]?.message || t("errors.failed_to_create_campaign"),
        );
      }
    },
    onError: (error) => {
      setServerError(error.message || t("errors.failed_to_create_campaign"));
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
            <CardTitle className="text-foreground">{t("create.title")}</CardTitle>
            <CardDescription>{t("create.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4">
                <div className="flex-1">
                  <p className="font-medium">{t("create.error_title")}</p>
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
  const { t } = useCampaignsTranslation();

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>{t("create.tips.title")}</CardTitle>
        <CardDescription>{t("create.tips.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-4 text-sm">
        <div>
          <p className="text-foreground font-medium">
            {t("create.tips.clarify_experience.title")}
          </p>
          <p className="mt-1">{t("create.tips.clarify_experience.description")}</p>
        </div>
        <div>
          <p className="text-foreground font-medium">
            {t("create.tips.set_limits_early.title")}
          </p>
          <p className="mt-1">{t("create.tips.set_limits_early.description")}</p>
        </div>
        <div>
          <p className="text-foreground font-medium">
            {t("create.tips.plan_onboarding.title")}
          </p>
          <p className="mt-1">{t("create.tips.plan_onboarding.description")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCampaignPage() {
  return <CampaignCreateView basePath="/gm/campaigns" tips={<CampaignTipsCard />} />;
}
