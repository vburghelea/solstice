import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { acceptPolicy } from "../privacy.mutations";
import { getLatestPolicyDocument, listUserPolicyAcceptances } from "../privacy.queries";

interface OnboardingPolicyStepProps {
  onComplete: () => void;
}

export function OnboardingPolicyStep({ onComplete }: OnboardingPolicyStepProps) {
  const queryClient = useQueryClient();
  const [acknowledged, setAcknowledged] = useState(false);

  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ["privacy", "policy", "latest"],
    queryFn: () => getLatestPolicyDocument({ data: "privacy_policy" }),
  });

  const { data: acceptances = [], isLoading: acceptancesLoading } = useQuery({
    queryKey: ["privacy", "policy", "acceptances"],
    queryFn: () => listUserPolicyAcceptances(),
  });

  const hasAccepted = policy
    ? acceptances.some((acceptance) => acceptance.policyId === policy.id)
    : false;

  const acceptMutation = useMutation({
    mutationFn: (policyId: string) => acceptPolicy({ data: { policyId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privacy", "policy"] });
      void queryClient.invalidateQueries({
        queryKey: ["privacy", "policy", "acceptances"],
      });
      onComplete();
    },
  });

  const handleAccept = () => {
    if (!policy?.id) return;
    acceptMutation.mutate(policy.id);
  };

  const isLoading = policyLoading || acceptancesLoading;
  const canProceed = policy?.id && acknowledged && !acceptMutation.isPending;

  // If already accepted, auto-proceed
  if (hasAccepted && !isLoading) {
    onComplete();
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Policy</CardTitle>
        <CardDescription>
          Please review and accept our privacy policy to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading policy...</div>
          </div>
        ) : policy ? (
          <>
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">Privacy Policy</span>
                <span className="text-muted-foreground text-sm">
                  Version {policy.version}
                </span>
              </div>
              <p className="text-muted-foreground mb-3 text-sm">
                Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
              </p>
              {policy.contentUrl ? (
                <a
                  href={policy.contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm underline"
                >
                  View full policy document
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">
                  This policy outlines how we collect, use, and protect your personal
                  information. By accepting, you agree to our data handling practices.
                </p>
              )}
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <Label
                htmlFor="acknowledge"
                className="cursor-pointer text-sm leading-relaxed"
              >
                I have read and agree to the Privacy Policy. I understand how my data will
                be collected, used, and protected.
              </Label>
            </div>

            {acceptMutation.isError && (
              <p className="text-destructive text-sm">
                Failed to accept policy. Please try again.
              </p>
            )}

            <Button onClick={handleAccept} disabled={!canProceed} className="w-full">
              {acceptMutation.isPending ? "Accepting..." : "Accept and Continue"}
            </Button>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No privacy policy is currently published. You may continue without
              accepting.
            </p>
            <Button onClick={onComplete} className="mt-4">
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
