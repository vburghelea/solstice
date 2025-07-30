import { useQuery } from "@tanstack/react-query";
import { getProviders } from "~/features/auth/auth.queries";
import { auth } from "~/lib/auth-client";
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";

export function LinkedAccounts() {
  const { data: providers } = useQuery({
    queryKey: ["auth-providers"],
    queryFn: getProviders,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Connect your social accounts to log in to the platform with a single click.
        </p>
        <div className="space-y-2">
          {providers?.map((providerId: string) => (
            <div key={providerId} className="flex items-center justify-between">
              <p className="font-medium">{providerId}</p>
              <Button
                variant="outline"
                onClick={() => auth.signIn.social({ provider: providerId })}
              >
                Link Account
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
