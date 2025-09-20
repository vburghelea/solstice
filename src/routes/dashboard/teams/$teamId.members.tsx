import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeftIcon, UserPlus, XCircle } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { TeamMemberRole } from "~/db/schema";
import {
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
} from "~/features/teams/teams.mutations";
import { getTeam, getTeamMembers } from "~/features/teams/teams.queries";

export const Route = createFileRoute("/dashboard/teams/$teamId/members")({
  loader: async ({ params }) => {
    const [team, members] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getTeamMembers({ data: { teamId: params.teamId } }),
    ]);
    if (!team) throw new Error("Team not found");
    return { team, members };
  },
  component: TeamMembersPage,
});

function TeamMembersPage() {
  const { teamId } = Route.useParams();
  const { team: teamData, members: initialMembers } = Route.useLoaderData();
  const { team } = teamData;
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: members } = useSuspenseQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: async () => getTeamMembers({ data: { teamId } }),
    initialData: initialMembers,
  });

  const pendingMembers = members.filter((entry) => entry.member.status === "pending");

  const addMemberMutation = useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
      setShowAddMember(false);
      form.reset();
    },
    onError: (error) => {
      setServerError(error.message || "Failed to add member");
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: updateTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", teamId] });
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      role: "player" as TeamMemberRole,
      jerseyNumber: "",
      position: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await addMemberMutation.mutateAsync({
        data: {
          teamId,
          ...value,
          jerseyNumber: value.jerseyNumber || undefined,
          position: value.position || undefined,
        },
      });
    },
  });

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/teams/$teamId" params={{ teamId }}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Team
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{team.name} Members</h1>
          <p className="text-muted-foreground">
            Manage your team roster and member roles
          </p>
          {pendingMembers.length > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs uppercase">
              {pendingMembers.length} pending invite
              {pendingMembers.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowAddMember(!showAddMember)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {showAddMember && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Member</CardTitle>
            <CardDescription>Invite a new member to join your team</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {serverError && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {serverError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => (!value ? "Email is required" : undefined),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Email Address</Label>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="player@example.com"
                      />
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-destructive text-sm">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="role">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Role</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as TeamMemberRole)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="captain">Captain</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="substitute">Substitute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="jerseyNumber">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Jersey Number</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="42"
                        maxLength={3}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="position">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Position</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Chaser"
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddMember(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.state.isSubmitting}>
                  {form.state.isSubmitting ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {members.map(({ member, user, invitedBy }) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || user.email}
                    />
                    <AvatarFallback>
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name || user.email}</h3>
                      <Badge
                        variant={member.status === "active" ? "default" : "secondary"}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex gap-4 text-sm">
                      <span className="capitalize">{member.role}</span>
                      {member.jerseyNumber && <span>#{member.jerseyNumber}</span>}
                      {member.position && <span>{member.position}</span>}
                    </div>
                    {member.status === "pending" && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        {member.requestedAt
                          ? `Join request received ${formatDistanceToNow(
                              new Date(member.requestedAt),
                              { addSuffix: true },
                            )}.`
                          : member.invitedAt
                            ? `Invitation sent ${formatDistanceToNow(
                                new Date(member.invitedAt),
                                { addSuffix: true },
                              )}${invitedBy?.name ? ` by ${invitedBy.name}` : ""}.`
                            : "Pending response."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      updateMemberMutation.mutate({
                        data: {
                          teamId,
                          memberId: member.id,
                          role: value as TeamMemberRole,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="captain">Captain</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="substitute">Substitute</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {user.name || user.email} from the team. They
                          can be re-invited later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            removeMemberMutation.mutate({
                              data: {
                                teamId,
                                memberId: member.id,
                              },
                            })
                          }
                        >
                          Remove Member
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
