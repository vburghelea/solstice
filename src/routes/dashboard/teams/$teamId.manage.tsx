import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { deactivateTeam, updateTeam } from "~/features/teams/teams.mutations";
import { getTeam } from "~/features/teams/teams.queries";
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
} from "~/shared/ui/alert-dialog";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";
import { AlertCircle, ArrowLeftIcon } from "~/shared/ui/icons";
import { Label } from "~/shared/ui/label";
import { Textarea } from "~/shared/ui/textarea";

export const Route = createFileRoute("/dashboard/teams/$teamId/manage")({
  loader: async ({ params }) => {
    const team = await getTeam({ data: { teamId: params.teamId } });
    if (!team) throw new Error("Team not found");
    return { team };
  },
  component: ManageTeamPage,
});

function ManageTeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teamId } = Route.useParams();
  const { team: teamData } = Route.useLoaderData();
  const { team } = teamData;
  const [serverError, setServerError] = useState<string | null>(null);

  const updateTeamMutation = useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      navigate({ to: "/dashboard/teams/$teamId", params: { teamId } });
    },
    onError: (error) => {
      setServerError(error.message || "Failed to update team");
    },
  });

  const deactivateTeamMutation = useMutation({
    mutationFn: deactivateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTeams"] });
      navigate({ to: "/dashboard/teams" });
    },
    onError: (error) => {
      setServerError(error.message || "Failed to deactivate team");
    },
  });

  const form = useForm({
    defaultValues: {
      name: team.name,
      description: team.description || "",
      city: team.city || "",
      province: team.province || "",
      primaryColor: team.primaryColor || "#000000",
      secondaryColor: team.secondaryColor || "#ffffff",
      foundedYear: team.foundedYear || new Date().getFullYear().toString(),
      website: team.website || "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await updateTeamMutation.mutateAsync({
        teamId,
        ...value,
        description: value.description || undefined,
        city: value.city || undefined,
        province: value.province || undefined,
        website: value.website || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Type assertion workaround for TanStack Start type inference issue
    },
  });

  const handleDeactivate = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await deactivateTeamMutation.mutateAsync({ teamId } as any); // Type assertion workaround
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/teams/$teamId" params={{ teamId }}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Team
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Team Settings</CardTitle>
          <CardDescription>Update your team profile and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            {serverError && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {serverError}
              </div>
            )}

            <div className="grid gap-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (!value ? "Team name is required" : undefined),
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="Team Name"
                    placeholder="Windsor Witches"
                  />
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Tell us about your team..."
                      rows={4}
                    />
                  </div>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput field={field} label="City" placeholder="Windsor" />
                  )}
                </form.Field>

                <form.Field
                  name="province"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && value.length > 2) {
                        return "Province/State should be 2 characters (e.g., ON)";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Province/State"
                      placeholder="Ontario"
                      maxLength={2}
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="primaryColor"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
                        return "Color must be in hex format (e.g., #FF0000)";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <ValidatedInput
                          field={field}
                          label=""
                          placeholder="#FF0000"
                          maxLength={7}
                        />
                        <div
                          className="h-10 w-10 rounded border"
                          style={{ backgroundColor: field.state.value }}
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="secondaryColor"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
                        return "Color must be in hex format (e.g., #0000FF)";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <ValidatedInput
                          field={field}
                          label=""
                          placeholder="#0000FF"
                          maxLength={7}
                        />
                        <div
                          className="h-10 w-10 rounded border"
                          style={{ backgroundColor: field.state.value }}
                        />
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="foundedYear"
                  validators={{
                    onChange: ({ value }) => {
                      if (
                        value &&
                        (!/^\d{4}$/.test(value) ||
                          parseInt(value) > new Date().getFullYear())
                      ) {
                        return "Enter a valid year";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Founded Year"
                      placeholder="2010"
                      maxLength={4}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="website"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !value.startsWith("http")) {
                        return "Website must start with http:// or https://";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Website"
                      placeholder="https://windsorwitches.com"
                      type="url"
                    />
                  )}
                </form.Field>
              </div>
            </div>

            <div className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Deactivate Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deactivate your team and hide it from public view. You can
                      reactivate it later, but all members will need to rejoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate}>
                      Deactivate Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/teams/$teamId" params={{ teamId }}>
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={form.state.isSubmitting}>
                  {form.state.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
