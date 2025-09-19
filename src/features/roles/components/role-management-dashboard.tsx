import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { assignRoleToUser, removeRoleAssignment } from "~/features/roles/roles.mutations";
import {
  getRoleManagementData,
  searchRoleEligibleUsers,
} from "~/features/roles/roles.queries";
import type {
  RoleAssignmentRow,
  RoleManagementData,
  RoleSummary,
  RoleUserSearchResult,
} from "~/features/roles/roles.types";

function useRoleManagementData() {
  return useQuery<RoleManagementData>({
    queryKey: ["role-management"],
    queryFn: async () => {
      const result = await getRoleManagementData();
      if (!result.success || !result.data) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to load role management data",
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
  });
}

function useRoleAssignmentForm(
  roles: RoleSummary[],
  onSuccess: (assignment: RoleAssignmentRow) => void,
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
          throw new Error(result.errors?.[0]?.message || "Failed to assign role");
        }

        onSuccess(result.data);
        form.reset();
        toast.success("Role assigned successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to assign role";
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

export function RoleManagementDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useRoleManagementData();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userResults, setUserResults] = useState<RoleUserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<RoleAssignmentRow | null>(
    null,
  );

  const removeMutation = useMutation({
    mutationFn: removeRoleAssignment,
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toast.error(result.errors?.[0]?.message || "Failed to remove role assignment");
        return;
      }

      toast.success("Role assignment removed");
      queryClient.invalidateQueries({ queryKey: ["role-management"] });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to remove role assignment";
      toast.error(message);
    },
    onSettled: () => {
      setAssignmentToRemove(null);
    },
  });

  const { form, scopeType } = useRoleAssignmentForm(data?.roles ?? [], () => {
    queryClient.invalidateQueries({ queryKey: ["role-management"] });
    setAssignDialogOpen(false);
    setUserSearchTerm("");
    setUserResults([]);
    setUserSearchOpen(false);
  });

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
      (data?.roles ?? []).map((role) => ({
        value: role.id,
        label: role.name,
      })),
    [data?.roles],
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
        toast.error(result.errors?.[0]?.message || "Failed to search users");
      }
    } catch (searchError) {
      const message =
        searchError instanceof Error ? searchError.message : "Failed to search users";
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading role management data...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Could not load roles</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Unknown error. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const assignments = data.assignments;

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground mt-1">
              Assign and revoke administrator access across Solstice and teams.
            </p>
          </div>
          <Dialog open={assignDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Assign a Role</DialogTitle>
                <DialogDescription>
                  Search for a user and grant them a role. Scoped roles require either a
                  team or event context.
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
                    onChange: ({ value }) => (!value ? "Select a user" : undefined),
                  }}
                >
                  {(field) => {
                    const selected =
                      userResults.find((user) => user.id === field.state.value) ??
                      selectedUser;

                    return (
                      <div className="space-y-2">
                        <Label>User</Label>
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
                                  Search by name or email
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
                                placeholder="Search users..."
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
                                    ...userResults.filter((item) => item.id !== user.id),
                                  ]);
                                  setUserSearchOpen(false);
                                }}
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
                    onChange: ({ value }) => (!value ? "Select a role" : undefined),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="role-select">Role</Label>
                      <select
                        id="role-select"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        disabled={form.state.isSubmitting}
                      >
                        <option value="" disabled>
                          Select a role
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
                        <Label htmlFor="role-team">Team Scope</Label>
                        <Input
                          id="role-team"
                          placeholder="Team ID"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          disabled={form.state.isSubmitting || scopeType !== "team"}
                        />
                        <FieldHint>
                          Use for assigning <strong>Team Admin</strong>. Leave blank for
                          global roles.
                        </FieldHint>
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="eventId">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="role-event">Event Scope</Label>
                        <Input
                          id="role-event"
                          placeholder="Event ID"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          disabled={form.state.isSubmitting || scopeType !== "event"}
                        />
                        <FieldHint>
                          Use for assigning <strong>Event Admin</strong>. Leave blank for
                          global roles.
                        </FieldHint>
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="expiresAt">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="role-expiration">Expiration</Label>
                      <Input
                        id="role-expiration"
                        type="datetime-local"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        disabled={form.state.isSubmitting}
                      />
                      <FieldHint>Optional — leave blank for no expiration.</FieldHint>
                    </div>
                  )}
                </form.Field>

                <form.Field name="notes">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="role-notes">Notes</Label>
                      <Textarea
                        id="role-notes"
                        placeholder="Add context for this assignment (optional)"
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
                    Assign Role
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <RoleSummaryGrid roles={data.roles} />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Current Role Assignments</CardTitle>
            <CardDescription>
              Audit log of who has access, when it was granted, and by whom.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {assignments.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-6 text-sm">
                <UsersRound className="h-4 w-4" />
                No role assignments yet. Use “Assign Role” to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
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
                          <Badge variant="outline">Team: {assignment.teamId}</Badge>
                        ) : assignment.eventId ? (
                          <Badge variant="outline">Event: {assignment.eventId}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Global</span>
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
                          <span className="text-muted-foreground text-xs">System</span>
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
                            No expiration
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
                            <Button variant="destructive" size="sm">
                              <XCircle className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Remove role assignment</DialogTitle>
                              <DialogDescription>
                                This will revoke “{assignment.roleName}” from{" "}
                                {assignment.userName}. This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setAssignmentToRemove(null)}
                              >
                                Cancel
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
                                Remove access
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RoleSummaryGrid({ roles }: { roles: RoleSummary[] }) {
  if (!roles.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{role.name}</CardTitle>
            <Badge variant="outline">{role.assignmentCount} assigned</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground text-sm">
              {role.description || "No description provided."}
            </p>
            <div>
              <p className="text-muted-foreground mb-1 text-xs uppercase">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(role.permissions).length === 0 ? (
                  <Badge variant="secondary">None configured</Badge>
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
}: {
  isSearching: boolean;
  results: RoleUserSearchResult[];
  onSelect: (result: RoleUserSearchResult) => void;
}) {
  return (
    <CommandList className="relative">
      <CommandEmpty>
        {isSearching ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching users...
          </div>
        ) : (
          "No users found."
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
