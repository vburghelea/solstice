import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useState } from "react";
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

export const Route = createFileRoute("/dashboard/campaigns/create")({
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (data) => {
      if (data.success) {
        void navigate({ to: `/dashboard/campaigns/${data.data?.id}` } as never);
      } else {
        setServerError(data.errors?.[0]?.message || "Failed to create campaign");
      }
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create campaign");
    },
  });

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Create a New Campaign</CardTitle>
          <CardDescription>
            Set up your campaign and start inviting players
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 mb-4 flex items-start gap-3 rounded-lg border p-4">
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
            onCancelEdit={() => navigate({ to: "/dashboard/campaigns" } as never)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
