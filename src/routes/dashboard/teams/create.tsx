import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedColorPicker } from "~/components/form-fields/ValidatedColorPicker";
import { ValidatedCombobox } from "~/components/form-fields/ValidatedCombobox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
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
import { createTeam } from "~/features/teams/teams.mutations";
import type { CreateTeamInput } from "~/features/teams/teams.schemas";
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

export const Route = createFileRoute("/dashboard/teams/create")({
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createTeamMutation = useMutation({
    mutationFn: (payload: CreateTeamInput) =>
      unwrapServerFnResult(createTeam({ data: payload })),
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

      // Validate required fields
      if (!value.name) {
        setServerError("Team name is required");
        return;
      }

      try {
        // Generate slug from name if not provided
        const slug = value.slug || value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        await createTeamMutation.mutateAsync({
          name: value.name,
          slug,
          description: value.description || undefined,
          city: value.city || undefined,
          province: value.province || undefined,
          primaryColor: value.primaryColor || undefined,
          secondaryColor: value.secondaryColor || undefined,
          foundedYear: value.foundedYear || undefined,
          website: value.website || undefined,
        });
      } catch (error) {
        console.error("Form submission error:", error);
        setServerError(error instanceof Error ? error.message : "Failed to create team");
      }
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
              <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Error creating team</p>
                  <p className="mt-1 text-sm">{serverError}</p>
                </div>
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
                    placeholder="uvic-valkyries"
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

                <form.Field
                  name="province"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !PROVINCES.some((p) => p.value === value)) {
                        return "Please select a valid province";
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedCombobox
                      field={field}
                      label="Province"
                      placeholder="Select a province..."
                      options={PROVINCES}
                      searchPlaceholder="Search provinces..."
                      emptyText="No province found."
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
                    <ValidatedColorPicker
                      field={field}
                      label="Primary Color"
                      description="Used for jerseys, branding, and team identity"
                    />
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

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link to="/dashboard/teams">Cancel</Link>
              </Button>
              <FormSubmitButton
                isSubmitting={form.state.isSubmitting}
                loadingText="Creating team..."
              >
                Create Team
              </FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
