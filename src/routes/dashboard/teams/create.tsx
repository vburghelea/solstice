import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { createTeam } from "~/features/teams/teams.mutations";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";
import { ArrowLeftIcon } from "~/shared/ui/icons";
import { Label } from "~/shared/ui/label";
import { Textarea } from "~/shared/ui/textarea";

export const Route = createFileRoute("/dashboard/teams/create")({
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (team) => {
      navigate({ to: "/dashboard/teams/$teamId", params: { teamId: team.id } });
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create team");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      city: "",
      province: "",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      foundedYear: new Date().getFullYear().toString(),
      website: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      // Generate slug from name if not provided
      const slug = value.slug || value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      await createTeamMutation.mutateAsync({
        ...value,
        slug,
        description: value.description || undefined,
        city: value.city || undefined,
        province: value.province || undefined,
        website: value.website || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Type assertion workaround for TanStack Start type inference issue
    },
  });

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/teams">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a New Team</CardTitle>
          <CardDescription>
            Set up your team profile and start inviting members
          </CardDescription>
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

              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return undefined;
                    if (!/^[a-z0-9-]+$/.test(value)) {
                      return "Slug can only contain lowercase letters, numbers, and hyphens";
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="URL Slug"
                    placeholder="windsor-witches"
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

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link to="/dashboard/teams">Cancel</Link>
              </Button>
              <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
