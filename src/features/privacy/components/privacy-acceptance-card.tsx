import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { acceptPolicy } from "../privacy.mutations";
import { getLatestPolicyDocument, listUserPolicyAcceptances } from "../privacy.queries";

export function PrivacyAcceptanceCard() {
  const queryClient = useQueryClient();

  const { data: policy } = useQuery({
    queryKey: ["privacy", "policy", "latest"],
    queryFn: () => getLatestPolicyDocument({ data: "privacy_policy" }),
  });

  const { data: acceptances = [] } = useQuery({
    queryKey: ["privacy", "policy", "acceptances"],
    queryFn: () => listUserPolicyAcceptances(),
  });

  const hasAccepted = policy
    ? acceptances.some((acceptance) => acceptance.policyId === policy.id)
    : true;

  const acceptMutation = useMutation({
    mutationFn: () => acceptPolicy({ data: { policyId: policy?.id ?? "" } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privacy", "policy"] });
      void queryClient.invalidateQueries({
        queryKey: ["privacy", "policy", "acceptances"],
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {policy ? (
          <>
            <p>
              Current version: <strong>{policy.version}</strong>
            </p>
            <p className="text-muted-foreground">
              Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
            </p>
            {policy.contentUrl ? (
              <a
                href={policy.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View policy document
              </a>
            ) : null}
            <Button
              type="button"
              disabled={hasAccepted || acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              {hasAccepted
                ? "Policy accepted"
                : acceptMutation.isPending
                  ? "Accepting..."
                  : "Accept policy"}
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">No policy document published.</p>
        )}
      </CardContent>
    </Card>
  );
}
