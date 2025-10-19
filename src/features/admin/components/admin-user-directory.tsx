import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import {
  AlertTriangleIcon,
  DownloadIcon,
  FilterIcon,
  KeyRoundIcon,
  Loader2,
  PlusIcon,
  Search,
  ShieldCheckIcon,
  ShieldOffIcon,
  Trash2Icon,
  UserX,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNowLocalized } from "~/lib/i18n/utils";

import { Alert, AlertDescription } from "~/components/ui/alert";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { DataTable } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/shared/lib/utils";

import {
  assignRoleToUser,
  getRoleManagementData,
  removeRoleAssignment,
  searchRoleEligibleUsers,
  type RoleAssignmentRow,
  type RoleManagementData,
  type RoleSummary,
  type RoleUserSearchResult,
} from "~/features/roles";
import { canDeleteUsers } from "~/features/roles/permission.service";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";
import type { SupportedLanguage } from "~/lib/i18n/config";
import {
  useAdminUserDirectory,
  useExportComplianceReport,
  type AdminMembershipStatus,
  type AdminUserFiltersInput,
  type AdminUserRecord,
} from "../users/admin-user-directory.queries";

const membershipTone: Record<AdminMembershipStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-amber-500/10 text-amber-600",
  canceled: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

const getMembershipLabels = (
  t: (key: string) => string,
): Record<AdminMembershipStatus, string> => ({
  active: t("user_directory.membership.status.active"),
  expired: t("user_directory.membership.status.expired"),
  canceled: t("user_directory.membership.status.canceled"),
  none: t("user_directory.membership.status.none"),
});

function DirectorySkeleton() {
  return (
    <div className="token-stack-lg">
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="token-stack-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Role management hooks and components

function useRoleAssignmentForm(
  roles: RoleSummary[],
  onSuccess: (assignment: RoleAssignmentRow) => void,
  adminT: (key: string) => string,
) {
  const form = useForm({
    defaultValues: {
      userId: "",
      roleId: "",
      teamId: "",
      eventId: "",
      notes: "",
      expiresAt: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await assignRoleToUser({
          data: {
            userId: value.userId,
            roleId: value.roleId,
            teamId: value.teamId || undefined,
            eventId: value.eventId || undefined,
            notes: value.notes || undefined,
            expiresAt: value.expiresAt
              ? new Date(value.expiresAt).toISOString()
              : undefined,
          },
        });

        if (!result.success || !result.data) {
          throw new Error(
            result.errors?.[0]?.message ||
              adminT("user_directory.errors.assign_role_failed"),
          );
        }

        onSuccess(result.data);
        form.reset();
        toast.success(adminT("user_directory.messages.role_assigned_success"));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : adminT("user_directory.errors.assign_role_failed");
        toast.error(message);
      }
    },
  });

  const selectedRoleId = useStore(form.store, (state) => state.values.roleId);
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  const scopeType = useMemo(() => {
    if (!selectedRole) return "none" as const;
    if (selectedRole.name === "Team Admin") return "team" as const;
    if (selectedRole.name === "Event Admin") return "event" as const;
    return "none" as const;
  }, [selectedRole]);

  return { form, selectedRole, scopeType };
}

function RiskBadge({
  message,
  type,
  adminT,
}: {
  message: string;
  type: "security" | "compliance";
  adminT: (key: string) => string;
}) {
  const tone =
    type === "security"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-destructive/10 text-destructive";

  const translatedMessage = adminT(`user_directory.risk_flags.${message}`);

  return (
    <Badge variant="outline" className={cn("border-transparent", tone)}>
      {translatedMessage}
    </Badge>
  );
}

function translateAuditTrailLabel(
  label: string,
  adminT: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (label.startsWith("role_granted:")) {
    const roleName = label.replace("role_granted:", "");
    return adminT("user_directory.audit_trail.role_granted", { roleName });
  }
  if (label.startsWith("membership_status:")) {
    const status = label.replace("membership_status:", "");
    return adminT("user_directory.audit_trail.membership_status", { status });
  }
  if (label === "last_active") {
    return adminT("user_directory.audit_trail.last_active");
  }
  return label; // fallback for any unexpected labels
}

function buildColumns(
  canDeleteUser: boolean,
  setUserToDelete: (user: AdminUserRecord) => void,
  adminT: (key: string, options?: Record<string, unknown>) => string,
  currentLanguage: string,
): ColumnDef<AdminUserRecord>[] {
  return [
    {
      accessorKey: "name",
      header: adminT("user_directory.tables.headers.user"),
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              className="h-10 w-10"
              name={record.name}
              email={record.email}
              src={record.uploadedAvatarPath || record.image || null}
              profileHref={`/profile/${record.id}`}
              linkProps={{
                target: "_blank",
                rel: "noopener noreferrer",
              }}
            />
            <div className="token-stack-xs">
              <span className="text-body-sm text-foreground font-semibold">
                {record.name}
              </span>
              <span className="text-body-xs text-muted-foreground px-2">
                {record.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "membershipStatus",
      header: adminT("user_directory.tables.headers.membership"),
      cell: ({ row }) => {
        const record = row.original;
        const tone = membershipTone[record.membershipStatus];
        const membershipLabels = getMembershipLabels(adminT);
        return (
          <div className="token-stack-xs">
            <Badge variant="outline" className={cn("border-transparent", tone)}>
              {membershipLabels[record.membershipStatus]}
            </Badge>
            {record.membershipExpiresAt ? (
              <span className="text-body-xs text-muted-foreground">
                {adminT("user_directory.membership.expires").replace(
                  "{{time}}",
                  formatDistanceToNowLocalized(
                    record.membershipExpiresAt,
                    currentLanguage as SupportedLanguage,
                  ),
                )}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "roles",
      header: adminT("user_directory.tables.headers.roles"),
      cell: ({ row }) => {
        const record = row.original;
        if (record.roles.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">
              {adminT("user_directory.roles.no_assignments")}
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {record.roles.map((role) => (
              <div key={role.id} className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {role.name}
                </Badge>
                {role.scope && (
                  <Badge variant="outline" className="text-[10px]">
                    {role.scope}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "roleAssignedAt",
      header: adminT("user_directory.tables.headers.role_assigned"),
      cell: ({ row }) => {
        const record = row.original;
        if (record.roles.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">
              {adminT("user_directory.activity.no_activity")}
            </span>
          );
        }
        // Get the most recent role assignment
        const mostRecentRole = record.roles.reduce((latest, current) =>
          new Date(current.assignedAt) > new Date(latest.assignedAt) ? current : latest,
        );
        return (
          <span className="text-body-xs text-muted-foreground">
            {formatDistanceToNowLocalized(
              new Date(mostRecentRole.assignedAt),
              currentLanguage as SupportedLanguage,
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "mfaEnrolled",
      header: adminT("user_directory.tables.headers.mfa"),
      cell: ({ row }) => {
        const { mfaEnrolled } = row.original;
        return (
          <span className="text-body-sm flex items-center gap-1">
            {mfaEnrolled ? (
              <ShieldCheckIcon aria-hidden className="size-4 text-emerald-600" />
            ) : (
              <ShieldOffIcon aria-hidden className="text-destructive size-4" />
            )}
            {mfaEnrolled
              ? adminT("user_directory.mfa.enforced")
              : adminT("user_directory.mfa.missing")}
          </span>
        );
      },
    },
    {
      accessorKey: "lastActiveAt",
      header: adminT("user_directory.tables.headers.last_active"),
      cell: ({ row }) => {
        const { lastActiveAt } = row.original;
        return (
          <span className="text-body-sm text-muted-foreground">
            {lastActiveAt
              ? formatDistanceToNowLocalized(
                  lastActiveAt,
                  currentLanguage as SupportedLanguage,
                )
              : adminT("user_directory.activity.no_activity")}
          </span>
        );
      },
    },
    {
      accessorKey: "riskFlags",
      header: adminT("user_directory.tables.headers.risk"),
      cell: ({ row }) => {
        const { riskFlags } = row.original;
        if (riskFlags.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">
              {adminT("user_directory.risk.clear")}
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {riskFlags.map((flag) => (
              <RiskBadge
                key={`${flag.type}-${flag.message}`}
                type={flag.type}
                message={flag.message}
                adminT={adminT}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "auditTrail",
      header: adminT("user_directory.tables.headers.latest_activity"),
      cell: ({ row }) => {
        const { auditTrail } = row.original;
        if (auditTrail.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">
              {adminT("user_directory.activity.no_recent_events")}
            </span>
          );
        }
        const [latest] = auditTrail;
        const translatedLabel = translateAuditTrailLabel(latest.label, adminT);
        return (
          <div className="token-stack-xs">
            <span className="text-body-sm text-foreground">{translatedLabel}</span>
            <span className="text-body-xs text-muted-foreground px-2">
              {formatDistanceToNowLocalized(
                latest.timestamp,
                currentLanguage as SupportedLanguage,
              )}
            </span>
          </div>
        );
      },
    },
    ...(canDeleteUser
      ? [
          {
            id: "actions",
            header: adminT("user_directory.tables.headers.actions"),
            cell: ({ row }: { row: { original: AdminUserRecord } }) => {
              const record = row.original;
              return (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setUserToDelete(record)}
                  className="flex items-center gap-1"
                >
                  <UserX className="h-4 w-4" />
                  {adminT("user_directory.buttons.delete")}
                </Button>
              );
            },
          },
        ]
      : []),
  ];
}

interface AdminUserDirectoryProps {
  currentUser: { id: string } | null;
}

export function AdminUserDirectory({ currentUser }: AdminUserDirectoryProps) {
  const { t: adminT, currentLanguage } = useAdminTranslation();

  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<"all" | AdminMembershipStatus>(
    "all",
  );
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [requireMfa, setRequireMfa] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const pageSize = 20;

  // Role management state
  const queryClient = useQueryClient();
  const [isClient, setIsClient] = useState(false);

  // Role management query - only enabled on client side to prevent hydration mismatch
  const { data: roleData } = useQuery({
    queryKey: ["role-management"],
    queryFn: async () => {
      const result = await getRoleManagementData();
      if (!result.success || !result.data) {
        throw new Error(
          result.errors?.[0]?.message ||
            adminT("user_directory.errors.load_role_management_data_failed"),
        );
      }

      const normalized: RoleManagementData = {
        roles: result.data.roles.map((role) => ({
          ...role,
          assignmentCount: Number(role.assignmentCount),
        })),
        assignments: result.data.assignments.map((assignment) => ({
          ...assignment,
          assignedAt: new Date(assignment.assignedAt),
          expiresAt: assignment.expiresAt ? new Date(assignment.expiresAt) : null,
        })),
      };

      return normalized;
    },
    enabled: isClient,
  });

  // Prevent hydration mismatch by only running role management queries on client
  useEffect(() => {
    if (!isClient) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsClient(true);
    }
  }, [isClient]); // isClient only changes once, safe for hydration detection
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userResults, setUserResults] = useState<RoleUserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<RoleAssignmentRow | null>(
    null,
  );
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  const filters = useMemo<AdminUserFiltersInput>(
    () => ({
      search: deferredSearch ? deferredSearch : undefined,
      membershipStatus: membershipFilter === "all" ? undefined : membershipFilter,
      roleId: roleFilter === "all" ? undefined : roleFilter,
      requireMfa: requireMfa ? true : undefined,
      page: pageIndex + 1,
      pageSize,
    }),
    [deferredSearch, membershipFilter, roleFilter, requireMfa, pageIndex, pageSize],
  );

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useAdminUserDirectory(filters);
  const exportMutation = useExportComplianceReport();

  const removeMutation = useMutation({
    mutationFn: removeRoleAssignment,
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toast.error(
          result.errors?.[0]?.message ||
            adminT("user_directory.errors.remove_role_assignment_failed"),
        );
        return;
      }

      toast.success(adminT("user_directory.messages.role_assignment_removed"));
      queryClient.invalidateQueries({ queryKey: ["role-management"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : adminT("user_directory.errors.remove_role_assignment_failed");
      toast.error(message);
    },
    onSettled: () => {
      setAssignmentToRemove(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log(`[FRONTEND] Starting user deletion for userId: ${userId}`);
      // Import the actual deleteUser function
      const { deleteUser } = await import(
        "~/features/admin/users/admin-user-deletion.mutations"
      );
      console.log(`[FRONTEND] Imported delete function, calling server`);
      const result = await deleteUser({ data: { userId } });
      console.log(`[FRONTEND] Server returned result:`, result);
      return result;
    },
    onSuccess: () => {
      toast.success(adminT("user_directory.messages.user_permanently_deleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setUserToDelete(null);
      setDeleteConfirmationInput("");
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : adminT("user_directory.errors.delete_user_failed");
      toast.error(message);
    },
    onSettled: () => {
      setUserToDelete(null);
      setDeleteConfirmationInput("");
    },
  });

  const { form, scopeType } = useRoleAssignmentForm(
    roleData?.roles ?? [],
    () => {
      queryClient.invalidateQueries({ queryKey: ["role-management"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setAssignDialogOpen(false);
      setUserSearchTerm("");
      setUserResults([]);
      setUserSearchOpen(false);
    },
    adminT,
  );

  const handleExport = async () => {
    try {
      const { page: _omitPage, pageSize: _omitPageSize, ...exportFilters } = filters;
      void _omitPage;
      void _omitPageSize;
      const url = await exportMutation.mutateAsync(exportFilters);
      const link = document.createElement("a");
      link.href = url;
      link.download = `platform-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(adminT("user_directory.messages.compliance_report_exported"));
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : adminT("user_directory.errors.export_compliance_report_failed");
      toast.error(message);
    }
  };

  const canDeleteUser = useMemo(() => {
    // Check if current user can delete users using the permission service
    if (!isClient || !roleData || !currentUser) return false;

    // Create a user object with roles for the permission service
    const userWithRoles = {
      roles: roleData.assignments
        .filter((assignment) => assignment.userId === currentUser.id)
        .map((assignment) => ({
          role: { name: assignment.roleName },
          teamId: assignment.teamId,
          eventId: assignment.eventId,
        })),
    };

    // Check if user can delete other users (Super Admin or Platform Admin only)
    return canDeleteUsers(userWithRoles);
  }, [isClient, roleData, currentUser]);

  const columns = useMemo(
    () => buildColumns(canDeleteUser, setUserToDelete, adminT, currentLanguage),
    [canDeleteUser, setUserToDelete, adminT, currentLanguage],
  );

  const handleDialogOpenChange = (open: boolean) => {
    setAssignDialogOpen(open);
    if (!open) {
      form.reset();
      setUserSearchTerm("");
      setUserResults([]);
      setUserSearchOpen(false);
    }
  };

  const roleOptions = useMemo(
    () =>
      isClient && roleData?.roles
        ? roleData.roles.map((role) => ({
            value: role.id,
            label: role.name,
          }))
        : [],
    [isClient, roleData?.roles],
  );

  const selectedUserId = useStore(form.store, (state) => state.values.userId);
  const selectedUser = useMemo(
    () => userResults.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, userResults],
  );

  async function runUserSearch(term: string) {
    if (term.trim().length < 2) {
      setUserResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const result = await searchRoleEligibleUsers({ data: { query: term.trim() } });
      if (result.success && result.data) {
        setUserResults(result.data);
      } else {
        toast.error(
          result.errors?.[0]?.message ||
            adminT("user_directory.errors.search_users_failed"),
        );
      }
    } catch (searchError) {
      const message =
        searchError instanceof Error
          ? searchError.message
          : adminT("user_directory.errors.search_users_failed");
      toast.error(message);
    } finally {
      setIsSearchingUsers(false);
    }
  }

  function handleUserSearchChange(term: string) {
    setUserSearchTerm(term);
    if (term.trim().length >= 2) {
      void runUserSearch(term);
    } else {
      setUserResults([]);
    }
  }

  if (isLoading && !data) {
    return <DirectorySkeleton />;
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader className="token-stack-sm">
          <div className="token-gap-xs flex items-center gap-2">
            <AlertTriangleIcon className="text-destructive size-5" aria-hidden />
            <CardTitle className="text-heading-sm">
              {adminT("user_directory.errors.load_failed")}
            </CardTitle>
          </div>
          <CardDescription className="text-body-sm text-destructive">
            {error?.message ?? adminT("user_directory.errors.service_unavailable")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            {adminT("user_directory.form.buttons.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* User Directory Section */}
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="token-stack-xs">
              <CardTitle className="text-heading-sm">
                {adminT("user_directory.title")}
              </CardTitle>
              <CardDescription className="text-body-sm text-muted-strong">
                {adminT("user_directory.subtitle")}
              </CardDescription>
            </div>
            {isClient && (
              <Dialog open={assignDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {adminT("user_directory.buttons.assign_role")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {adminT("user_directory.dialogs.assign_role.title")}
                    </DialogTitle>
                    <DialogDescription>
                      {adminT("user_directory.dialogs.assign_role.description")}
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    className="space-y-5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      form.handleSubmit();
                    }}
                  >
                    <form.Field
                      name="userId"
                      validators={{
                        onChange: ({ value }) =>
                          !value
                            ? adminT(
                                "user_directory.form.assign_role.validation.select_user",
                              )
                            : undefined,
                      }}
                    >
                      {(field) => {
                        const selected =
                          userResults.find((user) => user.id === field.state.value) ??
                          selectedUser;

                        return (
                          <div className="space-y-2">
                            <Label>
                              {adminT("user_directory.form.assign_role.fields.user")}
                            </Label>
                            <Popover
                              open={userSearchOpen}
                              onOpenChange={(open) => setUserSearchOpen(open)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={userSearchOpen}
                                  className="w-full justify-between"
                                  disabled={form.state.isSubmitting}
                                >
                                  {selected ? (
                                    <span>
                                      {selected.name}
                                      <span className="text-muted-foreground ml-1 text-xs">
                                        ({selected.email})
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {adminT("user_directory.search.placeholder")}
                                    </span>
                                  )}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[--radix-popover-trigger-width] p-0"
                                align="start"
                              >
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder={adminT(
                                      "user_directory.form.assign_role.placeholders.search_users",
                                    )}
                                    value={userSearchTerm}
                                    onValueChange={handleUserSearchChange}
                                  />
                                  <CommandListWithResults
                                    isSearching={isSearchingUsers}
                                    results={userResults}
                                    onSelect={(user) => {
                                      field.handleChange(user.id);
                                      setUserResults([
                                        user,
                                        ...userResults.filter(
                                          (item) => item.id !== user.id,
                                        ),
                                      ]);
                                      setUserSearchOpen(false);
                                    }}
                                    adminT={adminT}
                                  />
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {field.state.meta.isTouched &&
                              field.state.meta.errors.length > 0 && (
                                <p className="text-destructive text-sm font-medium">
                                  {field.state.meta.errors.join(", ")}
                                </p>
                              )}
                          </div>
                        );
                      }}
                    </form.Field>

                    <form.Field
                      name="roleId"
                      validators={{
                        onChange: ({ value }) =>
                          !value
                            ? adminT(
                                "user_directory.form.assign_role.validation.select_role",
                              )
                            : undefined,
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="role-select">
                            {adminT("user_directory.form.assign_role.fields.role")}
                          </Label>
                          <select
                            id="role-select"
                            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            disabled={form.state.isSubmitting}
                          >
                            <option value="" disabled>
                              {adminT("user_directory.form.select_role_placeholder")}
                            </option>
                            {roleOptions.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                          {field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0 && (
                              <p className="text-destructive text-sm font-medium">
                                {field.state.meta.errors.join(", ")}
                              </p>
                            )}
                        </div>
                      )}
                    </form.Field>

                    <div className="grid gap-4 md:grid-cols-2">
                      <form.Field name="teamId">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor="role-team">
                              {adminT(
                                "user_directory.form.assign_role.fields.team_scope",
                              )}
                            </Label>
                            <Input
                              id="role-team"
                              placeholder={adminT(
                                "user_directory.form.assign_role.placeholders.team_id",
                              )}
                              value={field.state.value}
                              onChange={(event) => field.handleChange(event.target.value)}
                              disabled={form.state.isSubmitting || scopeType !== "team"}
                            />
                            <FieldHint>
                              {adminT("user_directory.form.assign_role.hints.team_scope")}
                            </FieldHint>
                          </div>
                        )}
                      </form.Field>

                      <form.Field name="eventId">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor="role-event">
                              {adminT(
                                "user_directory.form.assign_role.fields.event_scope",
                              )}
                            </Label>
                            <Input
                              id="role-event"
                              placeholder={adminT(
                                "user_directory.form.assign_role.placeholders.event_id",
                              )}
                              value={field.state.value}
                              onChange={(event) => field.handleChange(event.target.value)}
                              disabled={form.state.isSubmitting || scopeType !== "event"}
                            />
                            <FieldHint>
                              {adminT(
                                "user_directory.form.assign_role.hints.event_scope",
                              )}
                            </FieldHint>
                          </div>
                        )}
                      </form.Field>
                    </div>

                    <form.Field name="expiresAt">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="role-expiration">
                            {adminT("user_directory.form.assign_role.fields.expiration")}
                          </Label>
                          <Input
                            id="role-expiration"
                            type="datetime-local"
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            disabled={form.state.isSubmitting}
                          />
                          <FieldHint>
                            {adminT("user_directory.form.assign_role.hints.expiration")}
                          </FieldHint>
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="notes">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="role-notes">
                            {adminT("user_directory.form.assign_role.fields.notes")}
                          </Label>
                          <Textarea
                            id="role-notes"
                            placeholder={adminT(
                              "user_directory.form.assign_role.placeholders.add_context",
                            )}
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            disabled={form.state.isSubmitting}
                          />
                        </div>
                      )}
                    </form.Field>

                    <DialogFooter>
                      <Button type="submit" disabled={form.state.isSubmitting}>
                        {form.state.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {adminT("user_directory.form.assign_role.buttons.assign_role")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-md min-w-[260px]">
              <Input
                value={search}
                onChange={(event) => {
                  setPageIndex(0);
                  setSearch(event.target.value);
                }}
                placeholder={adminT("user_directory.search.placeholder")}
                className="pl-9"
              />
              <FilterIcon
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
            </div>
            <Select
              value={membershipFilter}
              onValueChange={(value) => {
                setMembershipFilter(value as typeof membershipFilter);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={adminT("user_directory.form.filters.membership")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {adminT("user_directory.form.filters.all_memberships")}
                </SelectItem>
                <SelectItem value="active">
                  {adminT("user_directory.membership.status.active")}
                </SelectItem>
                <SelectItem value="expired">
                  {adminT("user_directory.membership.status.expired")}
                </SelectItem>
                <SelectItem value="canceled">
                  {adminT("user_directory.membership.status.canceled")}
                </SelectItem>
                <SelectItem value="none">
                  {adminT("user_directory.membership.status.none")}
                </SelectItem>
              </SelectContent>
            </Select>
            {isClient && (
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue
                    placeholder={adminT("user_directory.form.filters.filter_by_role")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {adminT("user_directory.form.filters.all_roles")}
                  </SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant={requireMfa ? "default" : "outline"}
              onClick={() => {
                setRequireMfa((previous) => !previous);
                setPageIndex(0);
              }}
              className="flex items-center gap-2"
            >
              <KeyRoundIcon className="size-4" aria-hidden />
              {requireMfa
                ? adminT("user_directory.buttons.mfa_enforced")
                : adminT("user_directory.buttons.require_mfa")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => void handleExport()}
              disabled={exportMutation.isPending}
            >
              <DownloadIcon className="size-4" aria-hidden />
              {exportMutation.isPending
                ? adminT("user_directory.export.pending")
                : adminT("user_directory.buttons.export_csv")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching
                ? adminT("user_directory.loading.refreshing")
                : adminT("user_directory.buttons.refresh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data ? (
            <DataTable
              columns={columns}
              data={data.items}
              manualPagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPageChange={(index) => setPageIndex(index)}
              pageSize={pageSize}
              isLoading={isLoading || isRefetching}
            />
          ) : (
            <Skeleton className="h-[480px] w-full" />
          )}
        </CardContent>
      </Card>

      {/* Role Summary Cards */}
      {isClient && roleData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              {adminT("user_directory.sections.role_summary.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {adminT("user_directory.sections.role_summary.description")}
            </p>
          </div>
          <RoleSummaryGrid roles={roleData.roles} adminT={adminT} />
        </div>
      )}

      {/* Role Assignments Table */}
      {isClient && roleData && roleData.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {adminT("user_directory.sections.current_assignments.title")}
            </CardTitle>
            <CardDescription>
              {adminT("user_directory.sections.current_assignments.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{adminT("user_directory.tables.headers.user")}</TableHead>
                  <TableHead>{adminT("user_directory.tables.headers.role")}</TableHead>
                  <TableHead>{adminT("user_directory.tables.headers.scope")}</TableHead>
                  <TableHead>
                    {adminT("user_directory.tables.headers.assigned_by")}
                  </TableHead>
                  <TableHead>
                    {adminT("user_directory.tables.headers.assigned_at")}
                  </TableHead>
                  <TableHead>{adminT("user_directory.tables.headers.expires")}</TableHead>
                  <TableHead>{adminT("user_directory.tables.headers.notes")}</TableHead>
                  <TableHead className="w-[120px] text-right">
                    {adminT("user_directory.tables.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleData.assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.userName}</span>
                        <span className="text-muted-foreground text-xs">
                          {assignment.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{assignment.roleName}</Badge>
                      {assignment.roleDescription && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {assignment.roleDescription}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.teamId ? (
                        <Badge variant="outline">
                          {adminT("user_directory.scope.team", {
                            teamId: assignment.teamId,
                          })}
                        </Badge>
                      ) : assignment.eventId ? (
                        <Badge variant="outline">
                          {adminT("user_directory.scope.event", {
                            eventId: assignment.eventId,
                          })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {adminT("user_directory.scope.global")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.assignedByName ? (
                        <div className="flex flex-col">
                          <span>{assignment.assignedByName}</span>
                          <span className="text-muted-foreground text-xs">
                            {assignment.assignedByEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {adminT("user_directory.assigned_by.system")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <time dateTime={assignment.assignedAt.toISOString()}>
                        {new Date(assignment.assignedAt).toLocaleString()}
                      </time>
                    </TableCell>
                    <TableCell>
                      {assignment.expiresAt ? (
                        <time dateTime={assignment.expiresAt.toISOString()}>
                          {new Date(assignment.expiresAt).toLocaleString()}
                        </time>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {adminT("user_directory.misc.no_expiration")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm whitespace-pre-line">
                      {assignment.notes || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog
                        open={assignmentToRemove?.id === assignment.id}
                        onOpenChange={(open) =>
                          open
                            ? setAssignmentToRemove(assignment)
                            : setAssignmentToRemove(null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            {adminT("user_directory.misc.remove_access")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {adminT("user_directory.dialogs.remove_assignment.title")}
                            </DialogTitle>
                            <DialogDescription>
                              {adminT(
                                "user_directory.dialogs.remove_assignment.description",
                                {
                                  roleName: assignment.roleName,
                                  userName: assignment.userName,
                                },
                              )}
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setAssignmentToRemove(null)}
                            >
                              {adminT("common.buttons.cancel")}
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={removeMutation.isPending}
                              onClick={() => {
                                setAssignmentToRemove(assignment);
                                removeMutation.mutate({
                                  data: { assignmentId: assignment.id },
                                });
                              }}
                            >
                              {removeMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {adminT(
                                "user_directory.dialogs.remove_assignment.buttons.remove_access",
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* User Deletion Confirmation Dialog */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
            setDeleteConfirmationInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              {adminT("user_directory.dialogs.delete_user.title")}
            </DialogTitle>
            <DialogDescription>
              {adminT("user_directory.dialogs.delete_user.warning")}
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="space-y-4">
              <Alert className="border-destructive bg-destructive/5">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {adminT("user_directory.dialogs.delete_user.warning_text", {
                    userName: userToDelete.name,
                    userEmail: userToDelete.email,
                  })}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">
                  {adminT(
                    "user_directory.dialogs.delete_user.sections.data_to_delete_title",
                  )}
                </h4>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.profile",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.memberships",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.games",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.events",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.campaigns",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.teams",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.notifications",
                    )}
                  </li>
                  <li>
                    {adminT(
                      "user_directory.dialogs.delete_user.sections.data_to_delete.roles",
                    )}
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-destructive font-medium">
                  {adminT("user_directory.dialogs.delete_user.sections.impact_title")}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {adminT(
                    "user_directory.dialogs.delete_user.sections.impact_description",
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">
                  {adminT(
                    "user_directory.dialogs.delete_user.sections.confirmation_title",
                  )}
                </h4>
                <p className="text-sm">
                  {adminT("user_directory.dialogs.delete_user.confirmation.instruction", {
                    email: `<code className="bg-muted rounded px-1 text-xs">${userToDelete.email}</code>`,
                  })}
                </p>
                <Input
                  placeholder={adminT(
                    "user_directory.dialogs.delete_user.confirmation.placeholder",
                  )}
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUserToDelete(null);
                setDeleteConfirmationInput("");
              }}
            >
              {adminT("common.buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteUserMutation.isPending ||
                deleteConfirmationInput !== userToDelete?.email
              }
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.id);
                }
              }}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {adminT("user_directory.dialogs.delete_user.buttons.delete_permanently")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleSummaryGrid({
  roles,
  adminT,
}: {
  roles: RoleSummary[];
  adminT: (key: string) => string;
}) {
  if (!roles.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{role.name}</CardTitle>
            <Badge variant="outline">{`${role.assignmentCount} ${adminT("user_directory.roles.assigned")}`}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground text-sm">
              {role.description || adminT("user_directory.descriptions.no_description")}
            </p>
            <div>
              <p className="text-muted-foreground mb-1 text-xs uppercase">
                {adminT("user_directory.misc.permissions")}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(role.permissions).length === 0 ? (
                  <Badge variant="secondary">
                    {adminT("user_directory.permissions.none_configured")}
                  </Badge>
                ) : (
                  Object.keys(role.permissions)
                    .filter((key) => role.permissions[key])
                    .map((key) => (
                      <Badge key={key} variant="secondary">
                        {key}
                      </Badge>
                    ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs">{children}</p>;
}

function CommandListWithResults({
  isSearching,
  results,
  onSelect,
  adminT,
}: {
  isSearching: boolean;
  results: RoleUserSearchResult[];
  onSelect: (result: RoleUserSearchResult) => void;
  adminT: (key: string) => string;
}) {
  return (
    <CommandList className="relative">
      <CommandEmpty>
        {isSearching ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />{" "}
            {adminT("user_directory.search.searching_users")}
          </div>
        ) : (
          adminT("user_directory.search.no_users_found")
        )}
      </CommandEmpty>
      <CommandGroup>
        {results.map((result) => (
          <CommandItem
            key={result.id}
            value={`${result.name} ${result.email}`}
            onSelect={() => onSelect(result)}
          >
            <div className="flex flex-col">
              <span className="font-medium">{result.name}</span>
              <span className="text-muted-foreground text-xs">{result.email}</span>
              {result.roleNames.length > 0 && (
                <span className="text-muted-foreground text-[11px]">
                  Roles: {result.roleNames.join(", ")}
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );
}
