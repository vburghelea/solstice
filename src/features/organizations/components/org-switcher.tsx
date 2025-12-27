import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useOrgContext } from "~/features/organizations/org-context";
import { setActiveOrganization } from "~/features/organizations/organizations.mutations";

interface OrgSwitcherProps {
  /** Callback when organization is successfully selected */
  onSuccess?: (organizationId: string | null) => void;
}

export function OrgSwitcher({ onSuccess }: OrgSwitcherProps = {}) {
  const {
    accessibleOrganizations,
    activeOrganizationId,
    setActiveOrganizationId,
    isLoading,
  } = useOrgContext();

  const mutation = useMutation({
    mutationFn: (organizationId: string | null) =>
      setActiveOrganization({ data: { organizationId } }),
    onSuccess: (result) => {
      if (!result?.success) {
        const message = result?.errors?.[0]?.message ?? "Failed to update organization";
        toast.error(message);
        return;
      }

      const newOrgId = result.data?.organizationId ?? null;
      setActiveOrganizationId(newOrgId);
      onSuccess?.(newOrgId);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update organization",
      );
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading organizations…</div>;
  }

  if (accessibleOrganizations.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No organizations available for your account.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Select
        value={activeOrganizationId ?? ""}
        onValueChange={(value) => {
          const nextId = value === "__none__" ? null : value;
          mutation.mutate(nextId);
        }}
        disabled={mutation.isPending}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {activeOrganizationId ? (
            <SelectItem value="__none__">Clear selection</SelectItem>
          ) : null}
          {accessibleOrganizations.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mutation.isPending ? (
        <Button variant="outline" disabled className="w-fit">
          Updating…
        </Button>
      ) : null}
    </div>
  );
}
