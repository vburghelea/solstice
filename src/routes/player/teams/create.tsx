import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedColorPicker } from "~/components/form-fields/ValidatedColorPicker";
import { ValidatedCountryCombobox } from "~/components/form-fields/ValidatedCountryCombobox";
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
import { useTeamsTranslation } from "~/hooks/useTypedTranslation";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";
import { COUNTRIES } from "~/shared/hooks/useCountries";

export const Route = createFileRoute("/player/teams/create")({
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const { t } = useTeamsTranslation();
  const teamsTranslation = useTranslation("teams");
  const { ready } = teamsTranslation;
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createTeamMutation = useMutation({
    mutationFn: (payload: CreateTeamInput) =>
      unwrapServerFnResult(createTeam({ data: payload })),
    onSuccess: (team) => {
      navigate({ to: "/player/teams/$teamId", params: { teamId: team.id } });
    },
    onError: (error) => {
      setServerError(error.message || t("create.error_title"));
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      city: "Berlin",
      country: "DEU",
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      foundedYear: new Date().getFullYear().toString(),
      website: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);

      // Validate required fields
      if (!value.name) {
        setServerError(t("create.validation.team_name_required"));
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
          country: value.country || undefined,
          primaryColor: value.primaryColor || undefined,
          secondaryColor: value.secondaryColor || undefined,
          foundedYear: value.foundedYear || undefined,
          website: value.website || undefined,
        });
      } catch (error) {
        console.error("Form submission error:", error);
        setServerError(error instanceof Error ? error.message : t("create.error_title"));
      }
    },
  });

  // Prevent hydration mismatch by waiting for translations to be ready
  if (!ready) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="bg-muted h-6 w-48 animate-pulse rounded" />
              <div className="bg-muted h-4 w-80 animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-10 w-full animate-pulse rounded" />
                </div>
              ))}
              <div className="flex justify-end gap-4">
                <div className="bg-muted h-10 w-20 animate-pulse rounded" />
                <div className="bg-muted h-10 w-28 animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/player/teams">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t("create.back_to_teams")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">{t("create.title")}</CardTitle>
          <CardDescription>{t("create.subtitle")}</CardDescription>
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
                  <p className="font-medium">{t("create.error_title")}</p>
                  <p className="mt-1 text-sm">{serverError}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? t("create.validation.team_name_required") : undefined,
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label={t("create.fields.team_name")}
                    placeholder={t("create.placeholders.team_name")}
                  />
                )}
              </form.Field>

              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return undefined;
                    if (!/^[a-z0-9-]+$/.test(value)) {
                      return t("create.validation.slug_format");
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label={t("create.fields.url_slug")}
                    placeholder={t("create.placeholders.url_slug")}
                  />
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>{t("create.fields.description")}</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={t("create.placeholders.description")}
                      rows={4}
                    />
                  </div>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("create.fields.city")}
                      placeholder={t("create.placeholders.city")}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="country"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !COUNTRIES.some((p) => p.value === value)) {
                        return t("create.validation.valid_country");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedCountryCombobox
                      field={field}
                      label={t("create.fields.country")}
                      placeholder={t("create.placeholders.country")}
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
                        return t("create.validation.color_format");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedColorPicker
                      field={field}
                      label={t("create.fields.primary_color")}
                      description={t("create.descriptions.primary_color")}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="secondaryColor"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !/^#[0-9A-F]{6}$/i.test(value)) {
                        return t("create.validation.color_format");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedColorPicker
                      field={field}
                      label={t("create.fields.secondary_color")}
                      description={t("create.descriptions.secondary_color")}
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
                        return t("create.validation.valid_year");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("create.fields.founded_year")}
                      placeholder={t("create.placeholders.founded_year")}
                      maxLength={4}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="website"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && !value.startsWith("http")) {
                        return t("create.validation.website_format");
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label={t("create.fields.website")}
                      placeholder={t("create.placeholders.website")}
                      type="url"
                    />
                  )}
                </form.Field>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link to="/player/teams">{t("create.buttons.cancel")}</Link>
              </Button>
              <FormSubmitButton
                isSubmitting={form.state.isSubmitting}
                loadingText={t("create.buttons.creating")}
              >
                {t("create.buttons.create")}
              </FormSubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
