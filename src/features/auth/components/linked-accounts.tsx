import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getProviders } from "~/features/auth/auth.queries";
import { useAuthTranslation } from "~/hooks/useTypedTranslation";
import { auth } from "~/lib/auth-client";

export function LinkedAccounts({ embedded = false }: { embedded?: boolean }) {
  const { t } = useAuthTranslation();
  const { data: providers } = useQuery({
    queryKey: ["auth-providers"],
    queryFn: getProviders,
  });

  const body = (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t("linked_accounts.subtitle")}</p>
      <div className="space-y-2">
        {providers?.map((providerId: string) => (
          <div key={providerId} className="flex items-center justify-between">
            <p className="font-medium capitalize">{providerId}</p>
            <Button
              variant="outline"
              onClick={() => auth.signIn.social({ provider: providerId })}
            >
              {t("linked_accounts.actions.link_account")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <section className="space-y-4">
        <h3 className="text-base font-medium">{t("linked_accounts.title")}</h3>
        {body}
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("linked_accounts.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
