import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ValidatedColorPicker } from "~/components/form-fields/ValidatedColorPicker";
import { ValidatedCombobox } from "~/components/form-fields/ValidatedCombobox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
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
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AlertCircle, ArrowLeftIcon } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { deactivateTeam, updateTeam } from "~/features/teams/teams.mutations";
import { getTeam } from "~/features/teams/teams.queries";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";

// Canadian provinces and territories
const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

export const Route = createFileRoute("/dashboard/teams/$teamId/manage")({
  loader: async ({ params }) => {
    const teamData = await getTeam({ data: { teamId: params.teamId } });
    if (!teamData) throw new Error("Team not found");
    return { teamData };
  },
  component: ManageTeamPage,
});

function ManageTeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teamId } = Route.useParams();
  const { teamData } = Route.useLoaderData();
  console.log("ManageTeamPage - teamData:", teamData);
  const { team } = teamData || {};
  const [serverError, setServerError] = useState<string | null>(null);

  const updateTeamMutation = useMutation({
    mutationFn: (payload: { teamId: string; data: any }) =>
      unwrapServerFnResult(updateTeam({ data: payload })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      navigate({ to: "/dashboard/teams/$teamId", params: { teamId } });
    },
    onError: (error) => {
      setServerError(error.message || "Failed to update team");
    },
  });

  const deactivateTeamMutation = useMutation({
    mutationFn: (teamId: string) =>
      unwrapServerFnResult(deactivateTeam({ data: { teamId } })),
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
      name: team?.name || "",
      description: team?.description || "",
      city: team?.city || "",
      province: team?.province || "",
      primaryColor: team?.primaryColor || "#000000",
      secondaryColor: team?.secondaryColor || "#ffffff",
      foundedYear: team?.foundedYear || new Date().getFullYear().toString(),
      website: team?.website || "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await updateTeamMutation.mutateAsync({
        teamId,
        data: {
          ...value,
          description: value.description || undefined,
          city: value.city || undefined,
          province: value.province || undefined,
          website: value.website || undefined,
        },
      });
    },
  });

  const handleDeactivate = async () => {
    await deactivateTeamMutation.mutateAsync(teamId);
  };

  if (!team) {
    return <div>Team not found (teamData: {JSON.stringify(teamData)})</div>;
  }

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
                    placeholder="UVic Valkyries"
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
                    <ValidatedInput field={field} label="City" placeholder="Victoria" />
                  )}
                </form.Field>

                <form.Field name="province">
                  {(field) => (
                    <ValidatedCombobox
                      field={field}
                      label="Province"
                      placeholder="Select a province"
                      options={PROVINCES}
                      searchPlaceholder="Search provinces..."
                      emptyText="No province found."
                    />
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="primaryColor">
                  {(field) => (
                    <ValidatedColorPicker
                      field={field}
                      label="Primary Color"
                      description="Used for jerseys, branding, and team identity"
                    />
                  )}
                </form.Field>

                <form.Field name="secondaryColor">
                  {(field) => (
                    <ValidatedColorPicker
                      field={field}
                      label="Secondary Color"
                      description="Accent color for team materials and website"
                    />
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
                      placeholder="https://uvicvalkyries.com"
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
