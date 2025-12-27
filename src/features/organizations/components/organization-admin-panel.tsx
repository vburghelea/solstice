import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  approveOrganizationMember,
  createDelegatedAccess,
  createOrganization,
  inviteOrganizationMember,
  removeOrganizationMember,
  revokeDelegatedAccess,
  updateOrganizationMemberRole,
} from "../organizations.mutations";
import {
  listAllOrganizations,
  listDelegatedAccess,
  listOrganizationMembers,
} from "../organizations.queries";

const organizationTypes = [
  { value: "governing_body", label: "Governing body" },
  { value: "pso", label: "PSO" },
  { value: "league", label: "League" },
  { value: "club", label: "Club" },
  { value: "affiliate", label: "Affiliate" },
];

const organizationRoles = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "reporter", label: "Reporter" },
  { value: "viewer", label: "Viewer" },
  { value: "member", label: "Member" },
];

const delegatedScopes = [
  { value: "reporting", label: "Reporting" },
  { value: "analytics", label: "Analytics" },
  { value: "admin", label: "Admin" },
];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function OrganizationAdminPanel() {
  const queryClient = useQueryClient();
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations", "admin"],
    queryFn: () => listAllOrganizations({ data: { includeArchived: true } }),
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgType, setOrgType] = useState(organizationTypes[0]?.value ?? "club");
  const [parentOrgId, setParentOrgId] = useState<string | null>(null);
  const [slugDirty, setSlugDirty] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const [delegateUserId, setDelegateUserId] = useState("");
  const [delegateScope, setDelegateScope] = useState("reporting");
  const [delegateExpiresAt, setDelegateExpiresAt] = useState("");
  const [delegateNotes, setDelegateNotes] = useState("");

  const resolvedOrgId = selectedOrgId ?? organizations[0]?.id ?? null;

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === resolvedOrgId) ?? null,
    [organizations, resolvedOrgId],
  );

  const { data: members = [] } = useQuery({
    queryKey: ["organizations", "members", resolvedOrgId],
    queryFn: () =>
      listOrganizationMembers({
        data: { organizationId: resolvedOrgId ?? "" },
      }),
    enabled: Boolean(resolvedOrgId),
  });

  const { data: delegatedAccess = [] } = useQuery({
    queryKey: ["organizations", "delegated", resolvedOrgId],
    queryFn: () =>
      listDelegatedAccess({
        data: { organizationId: resolvedOrgId ?? "" },
      }),
    enabled: Boolean(resolvedOrgId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganization({
        data: {
          name: orgName,
          slug: orgSlug,
          type: orgType as "governing_body" | "pso" | "league" | "club" | "affiliate",
          parentOrgId: parentOrgId ?? undefined,
        },
      }),
    onSuccess: (result) => {
      if (!result?.success) {
        setOrgError(result?.errors?.[0]?.message ?? "Failed to create organization");
        return;
      }
      const created = result.data;
      setOrgError(null);
      setOrgName("");
      setOrgSlug("");
      setSlugDirty(false);
      setParentOrgId(null);
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
      if (created?.id) {
        setSelectedOrgId(created.id);
      }
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      inviteOrganizationMember({
        data: {
          organizationId: resolvedOrgId ?? "",
          email: inviteEmail,
          role: inviteRole as "owner" | "admin" | "reporter" | "viewer" | "member",
        },
      }),
    onSuccess: () => {
      setInviteEmail("");
      void queryClient.invalidateQueries({ queryKey: ["organizations", "members"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (membershipId: string) =>
      approveOrganizationMember({ data: { membershipId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organizations", "members"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { membershipId: string; role: string }) =>
      updateOrganizationMemberRole({
        data: {
          membershipId: payload.membershipId,
          role: payload.role as "owner" | "admin" | "reporter" | "viewer" | "member",
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organizations", "members"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (membershipId: string) =>
      removeOrganizationMember({ data: { membershipId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organizations", "members"] });
    },
  });

  const delegateMutation = useMutation({
    mutationFn: () =>
      createDelegatedAccess({
        data: {
          organizationId: resolvedOrgId ?? "",
          delegateUserId,
          scope: delegateScope as "reporting" | "analytics" | "admin",
          expiresAt: delegateExpiresAt
            ? new Date(delegateExpiresAt).toISOString()
            : undefined,
          notes: delegateNotes || undefined,
        },
      }),
    onSuccess: () => {
      setDelegateUserId("");
      setDelegateExpiresAt("");
      setDelegateNotes("");
      void queryClient.invalidateQueries({ queryKey: ["organizations", "delegated"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (accessId: string) => revokeDelegatedAccess({ data: { accessId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organizations", "delegated"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Organization name"
              value={orgName}
              onChange={(event) => {
                const nextName = event.target.value;
                setOrgName(nextName);
                if (!slugDirty) {
                  setOrgSlug(slugify(nextName));
                }
              }}
            />
            <Input
              placeholder="Slug"
              value={orgSlug}
              onChange={(event) => {
                setOrgSlug(event.target.value);
                setSlugDirty(true);
              }}
            />
            <Select value={orgType} onValueChange={setOrgType}>
              <SelectTrigger>
                <SelectValue placeholder="Organization type" />
              </SelectTrigger>
              <SelectContent>
                {organizationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={parentOrgId ?? "__none__"}
              onValueChange={(value) =>
                setParentOrgId(value === "__none__" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Parent organization (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No parent</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {orgError ? <p className="text-destructive text-sm">{orgError}</p> : null}
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={!orgName || !orgSlug || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No organizations yet.</p>
          ) : (
            <div className="grid gap-3">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    resolvedOrgId === org.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedOrgId(org.id)}
                >
                  <div>
                    <p className="text-sm font-semibold">{org.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {org.type} • {org.status}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">{org.slug}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrg ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Member email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {organizationRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? "Inviting..." : "Send invite"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delegated access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Delegate user ID"
                value={delegateUserId}
                onChange={(event) => setDelegateUserId(event.target.value)}
              />
              <Select value={delegateScope} onValueChange={setDelegateScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  {delegatedScopes.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={delegateExpiresAt}
                onChange={(event) => setDelegateExpiresAt(event.target.value)}
              />
              <Input
                placeholder="Notes (optional)"
                value={delegateNotes}
                onChange={(event) => setDelegateNotes(event.target.value)}
              />
              <Button
                type="button"
                onClick={() => delegateMutation.mutate()}
                disabled={!delegateUserId || delegateMutation.isPending}
              >
                {delegateMutation.isPending ? "Granting..." : "Grant access"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedOrg ? (
        <Card>
          <CardHeader>
            <CardTitle>Members for {selectedOrg.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm">
                      No members yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {member.userName || member.userEmail}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {member.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value) =>
                            updateRoleMutation.mutate({
                              membershipId: member.id,
                              role: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {organizationRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">{member.status}</TableCell>
                      <TableCell className="space-x-2">
                        {member.status === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => approveMutation.mutate(member.id)}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeMutation.mutate(member.id)}
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {selectedOrg ? (
        <Card>
          <CardHeader>
            <CardTitle>Delegated access history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegatedAccess.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm">
                      No delegated access entries.
                    </TableCell>
                  </TableRow>
                ) : (
                  delegatedAccess.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {access.delegateEmail ?? access.delegateUserId}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {access.delegateUserId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{access.scope}</TableCell>
                      <TableCell className="text-xs">
                        {access.revokedAt ? "revoked" : "active"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => revokeMutation.mutate(access.id)}
                          disabled={revokeMutation.isPending || Boolean(access.revokedAt)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
