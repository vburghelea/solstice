import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedCountryCombobox } from "~/components/form-fields/ValidatedCountryCombobox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { LanguageTag } from "~/components/LanguageTag";
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
import { Label } from "~/components/ui/label";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { Separator } from "~/components/ui/separator";
import type { AvailabilityData } from "~/db/schema/auth.schema";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import { useProfileTranslation } from "~/hooks/useTypedTranslation";
import { useCountries } from "~/shared/hooks/useCountries";
import {
  experienceLevelOptions,
  gameThemeOptions,
  gmStrengthIcons,
  gmStrengthLabels,
  identityTagOptions,
  languageOptions,
} from "~/shared/types/common";
import { TagInput } from "~/shared/ui/tag-input";
import { ThumbsScore } from "~/shared/ui/thumbs-score";
import { invalidateProfileCaches } from "../profile.cache";
import { updateUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { PartialProfileInputType } from "../profile.schemas";
import { sanitizeProfileName } from "../profile.utils";
import { AvailabilityEditor, MobileAvailabilityEditor } from "./availability-editor";
import { AvatarUpload } from "./avatar-upload";
import { GamePreferencesStep } from "./game-preferences-step";

const noopAvailabilityChange = () => {};

export function ProfileView() {
  const { t } = useProfileTranslation();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { getCountryName } = useCountries();

  // Fetch profile data with better hydration handling
  const {
    data: profileResult,
    isLoading,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => getUserProfile({}),
    retry: 1,
    // Prefer fresh data on initial mount after navigation
    refetchOnMount: "always",
    // Prevent hydration mismatches by ensuring consistent loading states
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const profile = profileResult?.success ? profileResult.data : null;

  const form = useForm({
    defaultValues: {
      name: "",
      gender: "",
      pronouns: "",
      phone: "",
      city: "",
      country: "",
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      overallExperienceLevel: undefined,
      gameSystemPreferences: {
        favorite: [],
        avoid: [],
      },
      calendarAvailability: defaultAvailabilityData,
      privacySettings: {
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: false,
        allowFollows: true,
        allowInvitesOnlyFromConnections: false,
      },
    } as PartialProfileInputType,
    onSubmit: async ({ value }) => {
      // Build ProfileInput with only changed. The values are already typed.
      try {
        const dataToSubmit: Record<string, unknown> = {};

        // Track if we have any actual changes to submit
        let hasChanges = false;

        // Basic Information Fields
        if (editingSection === "basic") {
          const trimmedName = value.name?.trim();
          const currentName = profile?.name ?? "";

          if (trimmedName && trimmedName !== currentName) {
            dataToSubmit["name"] = trimmedName;
            hasChanges = true;
          }

          if (value.gender !== (profile?.["gender"] || "")) {
            dataToSubmit["gender"] = value.gender || null;
            hasChanges = true;
          }
          if (value.pronouns !== (profile?.["pronouns"] || "")) {
            dataToSubmit["pronouns"] = value.pronouns || null;
            hasChanges = true;
          }
          if (value.phone !== (profile?.["phone"] || "")) {
            dataToSubmit["phone"] = value.phone || null;
            hasChanges = true;
          }
          if (value.city !== (profile?.["city"] || "")) {
            dataToSubmit["city"] = value.city || null;
            hasChanges = true;
          }
          if (value.country !== (profile?.["country"] || "")) {
            dataToSubmit["country"] = value.country || null;
            hasChanges = true;
          }
          if (
            value.overallExperienceLevel !==
            (profile?.["overallExperienceLevel"] || undefined)
          ) {
            dataToSubmit["overallExperienceLevel"] = value.overallExperienceLevel || null;
            hasChanges = true;
          }
        }

        // Additional Information Fields
        if (editingSection === "additional") {
          if (
            JSON.stringify(value.calendarAvailability) !==
            JSON.stringify(profile?.["calendarAvailability"] || defaultAvailabilityData)
          ) {
            dataToSubmit["calendarAvailability"] = value.calendarAvailability;
            hasChanges = true;
          }

          // Check if languages have changed
          const currentLanguages = profile?.["languages"] || [];
          const newLanguages = value.languages || [];
          const languagesChanged =
            JSON.stringify(currentLanguages) !== JSON.stringify(newLanguages);
          if (languagesChanged) {
            dataToSubmit["languages"] = newLanguages.length > 0 ? newLanguages : null;
            hasChanges = true;
          }

          // Check if identityTags have changed
          const currentIdentityTags = profile?.["identityTags"] || [];
          const newIdentityTags = value.identityTags || [];
          const identityTagsChanged =
            JSON.stringify(currentIdentityTags) !== JSON.stringify(newIdentityTags);
          if (identityTagsChanged) {
            dataToSubmit["identityTags"] =
              newIdentityTags.length > 0 ? newIdentityTags : null;
            hasChanges = true;
          }

          // Check if preferredGameThemes have changed
          const currentPreferredGameThemes = profile?.["preferredGameThemes"] || [];
          const newPreferredGameThemes = value.preferredGameThemes || [];
          const preferredGameThemesChanged =
            JSON.stringify(currentPreferredGameThemes) !==
            JSON.stringify(newPreferredGameThemes);
          if (preferredGameThemesChanged) {
            dataToSubmit["preferredGameThemes"] =
              newPreferredGameThemes.length > 0 ? newPreferredGameThemes : null;
            hasChanges = true;
          }
        }

        // Game Preferences Fields
        if (editingSection === "game-preferences") {
          const currentFavorites = profile?.["gameSystemPreferences"]?.favorite || [];
          const currentAvoid = profile?.["gameSystemPreferences"]?.avoid || [];
          const newFavorites = value.gameSystemPreferences?.favorite || [];
          const newAvoid = value.gameSystemPreferences?.avoid || [];

          const favoritesChanged =
            JSON.stringify(currentFavorites) !== JSON.stringify(newFavorites);
          const avoidChanged = JSON.stringify(currentAvoid) !== JSON.stringify(newAvoid);

          if (favoritesChanged || avoidChanged) {
            if (
              value.gameSystemPreferences &&
              (value.gameSystemPreferences.favorite.length > 0 ||
                value.gameSystemPreferences.avoid.length > 0)
            ) {
              dataToSubmit["gameSystemPreferences"] = value.gameSystemPreferences;
            } else {
              delete dataToSubmit["gameSystemPreferences"];
            }
            hasChanges = true;
          }
        }

        // Privacy Settings Fields
        if (editingSection === "privacy") {
          const currentPrivacy = profile?.["privacySettings"] || {
            showEmail: false,
            showPhone: false,
            showLocation: false,
            showLanguages: false,
            showGamePreferences: false,
            allowTeamInvitations: true,
            allowFollows: true,
            allowInvitesOnlyFromConnections: false,
          };
          const newPrivacy = value.privacySettings || {
            showEmail: false,
            showPhone: false,
            showLocation: false,
            showLanguages: false,
            showGamePreferences: false,
            allowTeamInvitations: true,
            allowFollows: true,
            allowInvitesOnlyFromConnections: false,
          };

          if (
            newPrivacy.showEmail !== currentPrivacy.showEmail ||
            newPrivacy.showPhone !== currentPrivacy.showPhone ||
            newPrivacy.showLocation !== currentPrivacy.showLocation ||
            newPrivacy.showLanguages !== currentPrivacy.showLanguages ||
            newPrivacy.showGamePreferences !== currentPrivacy.showGamePreferences ||
            newPrivacy.allowTeamInvitations !== currentPrivacy.allowTeamInvitations ||
            newPrivacy.allowFollows !== currentPrivacy.allowFollows ||
            (newPrivacy.allowInvitesOnlyFromConnections ?? false) !==
              (currentPrivacy.allowInvitesOnlyFromConnections ?? false)
          ) {
            dataToSubmit["privacySettings"] = newPrivacy;
            hasChanges = true;
          }
        }

        // If no changes, just close the form
        if (!hasChanges || Object.keys(dataToSubmit).length === 0) {
          setEditingSection(null);
          toast.info(t("errors.no_changes_made"));
          return;
        }

        const result = await updateUserProfile({ data: dataToSubmit });

        if (result.success) {
          toast.success(t("errors.profile_updated_successfully"));
          await invalidateProfileCaches(queryClient, result.data?.id ?? profile?.id);
          // Only exit edit mode on success
          setEditingSection(null);
        } else {
          // Show error but don't exit edit mode
          const error =
            result.errors?.[0]?.message || t("errors.failed_to_update_profile");

          toast.error(error);
          // Don't throw - let form remain interactive
        }
      } catch (error) {
        // Network/unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : t("errors.unexpected_error");

        toast.error(errorMessage);
        console.error("Profile update error:", error);
        // Don't throw - let form remain interactive
      }
    },
  });

  // Update form field values when profile data loads
  useEffect(() => {
    if (profile && !editingSection) {
      // Set form field values from profile data for display mode
      form.setFieldValue("name", profile.name || "");
      form.setFieldValue(
        "calendarAvailability",
        profile.calendarAvailability || defaultAvailabilityData,
      );
      form.setFieldValue("languages", profile.languages || []);
      form.setFieldValue("identityTags", profile.identityTags || []);
      form.setFieldValue("preferredGameThemes", profile.preferredGameThemes || []);
      form.setFieldValue("name", profile.name || "");
      form.setFieldValue("gender", profile.gender || "");
      form.setFieldValue("pronouns", profile.pronouns || "");
      form.setFieldValue("phone", profile.phone || "");
      form.setFieldValue("city", profile.city || "");
      form.setFieldValue("country", profile.country || "");
      form.setFieldValue(
        "overallExperienceLevel",
        profile.overallExperienceLevel || undefined,
      );
      form.setFieldValue(
        "gameSystemPreferences",
        profile.gameSystemPreferences || { favorite: [], avoid: [] },
      );

      const privacySettings = profile.privacySettings || {
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: true,
        allowFollows: true,
        allowInvitesOnlyFromConnections: false,
      };
      form.setFieldValue("privacySettings.showEmail", privacySettings.showEmail);
      form.setFieldValue("privacySettings.showPhone", privacySettings.showPhone);
      form.setFieldValue("privacySettings.showLocation", privacySettings.showLocation);
      form.setFieldValue("privacySettings.showLanguages", privacySettings.showLanguages);
      form.setFieldValue(
        "privacySettings.showGamePreferences",
        privacySettings.showGamePreferences,
      );
      form.setFieldValue(
        "privacySettings.allowTeamInvitations",
        privacySettings.allowTeamInvitations,
      );
      form.setFieldValue("privacySettings.allowFollows", privacySettings.allowFollows);
      form.setFieldValue(
        "privacySettings.allowInvitesOnlyFromConnections",
        privacySettings.allowInvitesOnlyFromConnections ?? false,
      );
    }
  }, [profile, editingSection, form]);

  // Gender options for select component
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
  ];

  const mappedExperienceLevelOptions = experienceLevelOptions.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
  }));

  const mappedLanguageOptions = languageOptions.map((lang) => ({
    id: lang.value,
    name: lang.label,
  }));

  const mappedIdentityTagOptions = identityTagOptions.map((tag) => ({
    id: tag,
    name: tag,
  }));

  const mappedGameThemeOptions = gameThemeOptions.map((theme) => ({
    id: theme,
    name: theme,
  }));

  // Initialize form data when entering edit mode
  const startEditingSection = (sectionId: string) => {
    if (!profile) return;

    if (form.state.isDirty && editingSection !== null) {
      toast.info(t("errors.please_save_or_cancel_current_changes"));
      return;
    }
    if (profile.city) {
      form.setFieldValue("city", profile.city);
    }
    if (profile.country) {
      form.setFieldValue("country", profile.country);
    }
    if (profile.overallExperienceLevel) {
      form.setFieldValue("overallExperienceLevel", profile.overallExperienceLevel);
    }
    if (profile.calendarAvailability) {
      form.setFieldValue("calendarAvailability", profile.calendarAvailability);
    }

    if (profile.languages) {
      form.setFieldValue("languages", profile.languages);
    }
    if (profile.identityTags) {
      form.setFieldValue("identityTags", profile.identityTags);
    }
    if (profile.preferredGameThemes) {
      form.setFieldValue("preferredGameThemes", profile.preferredGameThemes);
    }

    // Set field values from profile for the specific section
    if (sectionId === "basic") {
      form.setFieldValue("name", profile.name || "");
      form.setFieldValue("gender", profile.gender || "");
      form.setFieldValue("pronouns", profile.pronouns || "");
      form.setFieldValue("phone", profile.phone || "");
      form.setFieldValue("city", profile.city || "");
      form.setFieldValue("country", profile.country || "");
      form.setFieldValue(
        "overallExperienceLevel",
        profile.overallExperienceLevel || undefined,
      );
    } else if (sectionId === "additional") {
      const availability =
        typeof profile.calendarAvailability === "string"
          ? JSON.parse(profile.calendarAvailability)
          : profile.calendarAvailability;

      form.setFieldValue("calendarAvailability", availability || defaultAvailabilityData);
      form.setFieldValue("languages", profile.languages || []);
      form.setFieldValue("identityTags", profile.identityTags || []);
      form.setFieldValue("preferredGameThemes", profile.preferredGameThemes || []);
    } else if (sectionId === "game-preferences") {
      form.setFieldValue(
        "gameSystemPreferences",
        profile.gameSystemPreferences || { favorite: [], avoid: [] },
      );
    } else if (sectionId === "privacy") {
      const privacySettings = profile.privacySettings || {
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showLanguages: false,
        showGamePreferences: false,
        allowTeamInvitations: true,
        allowFollows: true,
        allowInvitesOnlyFromConnections: false,
      };
      form.setFieldValue("privacySettings.showEmail", privacySettings.showEmail);
      form.setFieldValue("privacySettings.showPhone", privacySettings.showPhone);
      form.setFieldValue("privacySettings.showLocation", privacySettings.showLocation);
      form.setFieldValue("privacySettings.showLanguages", privacySettings.showLanguages);
      form.setFieldValue(
        "privacySettings.showGamePreferences",
        privacySettings.showGamePreferences,
      );
      form.setFieldValue(
        "privacySettings.allowTeamInvitations",
        privacySettings.allowTeamInvitations,
      );
      form.setFieldValue("privacySettings.allowFollows", privacySettings.allowFollows);
      form.setFieldValue(
        "privacySettings.allowInvitesOnlyFromConnections",
        privacySettings.allowInvitesOnlyFromConnections ?? false,
      );
    }

    setEditingSection(sectionId);
  };

  const cancelEditing = () => {
    // Reset form to original values
    form.reset();
    // Clear any errors

    // Exit edit mode
    setEditingSection(null);
  };

  // Handle loading state - only show loading if we don't have data yet
  if (isLoading && !profileResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">{t("status.loading_profile")}</span>
      </div>
    );
  }

  // Handle error state - only show error if we have an error and no successful data
  if (error && !isSuccess && !profile) {
    const errorMessage =
      profileResult?.errors?.[0]?.message ||
      error?.message ||
      t("errors.failed_to_load_profile");
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
        {profileResult?.errors?.[0].code === "VALIDATION_ERROR" && (
          <p className="text-muted-foreground mt-2 text-sm">
            {t("errors.please_try_logging_in_again")}
          </p>
        )}
      </div>
    );
  }

  // If we don't have profile data but also don't have an error, show loading
  if (!profile && !isSuccess) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">
          {t("status.loading_profile_data")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="w-full">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
                <div className="flex flex-1 flex-col gap-3 sm:min-w-[220px] sm:flex-row sm:items-center">
                  {editingSection !== "basic" ? (
                    <Avatar
                      className="h-10 w-10"
                      name={profile?.name ?? null}
                      email={profile?.email ?? null}
                      srcUploaded={profile?.uploadedAvatarPath ?? null}
                      srcProvider={profile?.image ?? null}
                    />
                  ) : null}
                  <div>
                    <CardTitle>{t("basic_information.title")}</CardTitle>
                    <CardDescription>
                      {t("basic_information.description")}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  {editingSection !== "basic" && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => startEditingSection("basic")}
                      variant="outline"
                      size="sm"
                      aria-label={t("aria_labels.edit_basic_information")}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t("buttons.edit")}
                    </Button>
                  )}
                  {editingSection === "basic" && (
                    <>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        disabled={form.state.isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("buttons.cancel")}
                      </Button>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            onClick={() => form.handleSubmit()}
                            disabled={!canSubmit || isSubmitting}
                            size="sm"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                {t("buttons.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("buttons.save_changes")}
                              </>
                            )}
                          </Button>
                        )}
                      </form.Subscribe>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingSection === "basic" ? (
                <AvatarUpload
                  name={profile?.name ?? null}
                  email={profile?.email ?? null}
                  image={profile?.image ?? null}
                  uploadedAvatarPath={profile?.uploadedAvatarPath ?? null}
                />
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="name">
                      {(field) => (
                        <ValidatedInput
                          field={field}
                          label={t("labels.profile_name")}
                          placeholder={t("placeholders.profile_name")}
                          description={t("descriptions.profile_name")}
                          autoComplete="username"
                          maxLength={30}
                          disableWhileSubmitting={false}
                          onValueChange={(value) => {
                            const sanitizedValue = sanitizeProfileName(value);
                            field.handleChange(sanitizedValue);
                          }}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.profile_name")}</Label>
                      <p className="mt-1 text-sm font-medium">
                        {profile?.name ?? t("display.not_set")}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t("descriptions.profile_name_public")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <Label>{t("labels.email_address")}</Label>
                  <p className="text-muted-foreground mt-1 text-sm">{profile?.email}</p>
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="gender">
                      {(field) => (
                        <ValidatedSelect
                          field={field}
                          label={t("form_fields.gender")}
                          placeholder={t("placeholders.gender")}
                          options={genderOptions}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.gender")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {profile?.gender || t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="pronouns">
                      {(field) => (
                        <ValidatedInput
                          field={field}
                          label={t("form_fields.pronouns")}
                          placeholder={t("placeholders.pronouns")}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.pronouns")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {profile?.pronouns || t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="phone">
                      {(field) => (
                        <ValidatedPhoneInput
                          field={field}
                          label={t("form_fields.phone_number")}
                          placeholder={t("placeholders.phone_number")}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.phone_number")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatPhoneNumber(profile?.phone) || t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="city">
                      {(field) => (
                        <ValidatedInput
                          field={field}
                          label={t("form_fields.city")}
                          placeholder={t("placeholders.city")}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.city")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {profile?.city || t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="country">
                      {(field) => (
                        <ValidatedCountryCombobox
                          field={field}
                          label={t("form_fields.country")}
                          placeholder={t("placeholders.country")}
                          valueFormat="label"
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.country")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {profile?.country
                          ? getCountryName(profile.country) || profile.country
                          : t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  {editingSection === "basic" ? (
                    <form.Field name="overallExperienceLevel">
                      {(field) => (
                        <ValidatedSelect
                          field={field}
                          label={t("form_fields.overall_experience_level")}
                          placeholder={t("placeholders.experience_level")}
                          options={mappedExperienceLevelOptions}
                        />
                      )}
                    </form.Field>
                  ) : (
                    <>
                      <Label>{t("labels.overall_experience_level")}</Label>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {profile?.overallExperienceLevel
                          ? profile.overallExperienceLevel.charAt(0).toUpperCase() +
                            profile.overallExperienceLevel.slice(1)
                          : t("display.not_specified")}
                      </p>
                    </>
                  )}
                </div>

                {profile?.isGM ? (
                  <div className="md:col-span-2 xl:col-span-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>{t("labels.games_hosted")}</Label>
                        <p className="mt-1 text-sm font-medium">{profile.gamesHosted}</p>
                      </div>
                      <div>
                        <Label>{t("labels.gm_rating")}</Label>
                        <p className="mt-1 text-sm font-medium">
                          <ThumbsScore value={profile.gmRating ?? null} />
                        </p>
                      </div>
                      <div>
                        <Label>{t("labels.response_rate")}</Label>
                        <p className="mt-1 text-sm font-medium">
                          {typeof profile.responseRate === "number"
                            ? `${profile.responseRate}%`
                            : t("status.na")}
                        </p>
                      </div>
                      <div>
                        <Label>{t("labels.avg_response_time")}</Label>
                        <p className="mt-1 text-sm font-medium">
                          {typeof profile.averageResponseTime === "number"
                            ? `${profile.averageResponseTime} min`
                            : t("status.na")}
                        </p>
                      </div>
                      {profile.gmTopStrengths && profile.gmTopStrengths.length > 0 ? (
                        <div className="sm:col-span-2">
                          <Label>{t("labels.top_strengths")}</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {profile.gmTopStrengths.map((s) => (
                              <span
                                key={s}
                                className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
                              >
                                <span className="mr-1" aria-hidden>
                                  {gmStrengthIcons[s] ?? "✨"}
                                </span>
                                {gmStrengthLabels[s] ?? s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="w-full">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
                <div className="flex flex-1 flex-col gap-2 sm:min-w-[220px]">
                  <CardTitle>{t("additional_information.title")}</CardTitle>
                  <CardDescription>
                    {t("additional_information.description")}
                  </CardDescription>
                </div>

                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  {editingSection !== "additional" && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => startEditingSection("additional")}
                      variant="outline"
                      size="sm"
                      aria-label={t("aria_labels.edit_additional_information")}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t("buttons.edit")}
                    </Button>
                  )}
                  {editingSection === "additional" && (
                    <>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        disabled={form.state.isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("buttons.cancel")}
                      </Button>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            onClick={() => form.handleSubmit()}
                            disabled={!canSubmit || isSubmitting}
                            size="sm"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                {t("buttons.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("buttons.save_changes")}
                              </>
                            )}
                          </Button>
                        )}
                      </form.Subscribe>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calendar Availability */}
              <div>
                <Label className="text-base font-medium">
                  {t("labels.availability_calendar")}
                </Label>
                <p className="text-muted-foreground mb-4 text-sm">
                  {t("descriptions.availability")}
                </p>
                {editingSection === "additional" ? (
                  <form.Field name="calendarAvailability">
                    {(field) => (
                      <ResponsiveAvailabilityEditor
                        value={field.state.value || defaultAvailabilityData}
                        onChange={(newValue) => {
                          field.handleChange(newValue);
                        }}
                        readOnly={false}
                      />
                    )}
                  </form.Field>
                ) : (
                  <ResponsiveAvailabilityEditor
                    value={profile?.calendarAvailability || defaultAvailabilityData}
                    onChange={noopAvailabilityChange}
                    readOnly
                  />
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <Label className="text-base font-medium">{t("labels.languages")}</Label>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {t("descriptions.languages")}
                  </p>
                  {editingSection === "additional" ? (
                    <form.Field name="languages">
                      {(field) => {
                        const currentLanguages = field.state.value || [];
                        const tags = currentLanguages.map((langCode) => {
                          const lang = languageOptions.find((l) => l.value === langCode);
                          return lang
                            ? { id: langCode, name: lang.label }
                            : { id: langCode, name: langCode };
                        });

                        return (
                          <TagInput
                            tags={tags}
                            onAddTag={(tag) => {
                              const currentValue = field.state.value || [];
                              if (!currentValue.includes(tag.id)) {
                                field.handleChange([...currentValue, tag.id]);
                              }
                            }}
                            onRemoveTag={(id) => {
                              const currentValue = field.state.value || [];
                              field.handleChange(
                                currentValue.filter((lang) => lang !== id),
                              );
                            }}
                            availableSuggestions={mappedLanguageOptions}
                            placeholder={t("placeholders.languages")}
                          />
                        );
                      }}
                    </form.Field>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.languages?.map((langCode) => (
                        <LanguageTag key={langCode} language={langCode} />
                      ))}
                      {(!profile?.languages || profile.languages.length === 0) && (
                        <span className="text-muted-foreground text-sm">
                          {t("status.no_languages_specified")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {t("labels.identity_tags")}
                  </Label>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {t("descriptions.identity_tags")}
                  </p>
                  {editingSection === "additional" ? (
                    <form.Field name="identityTags">
                      {(field) => {
                        const currentTags = field.state.value || [];
                        const tags = currentTags.map((tagId) => {
                          const tag = identityTagOptions.find((t) => t === tagId);
                          return tag
                            ? { id: tagId, name: tag }
                            : { id: tagId, name: tagId };
                        });

                        return (
                          <TagInput
                            tags={tags}
                            onAddTag={(tag) => {
                              const currentValue = field.state.value || [];
                              if (!currentValue.includes(tag.id)) {
                                field.handleChange([...currentValue, tag.id]);
                              }
                            }}
                            onRemoveTag={(id) => {
                              const currentValue = field.state.value || [];
                              field.handleChange(
                                currentValue.filter((tag) => tag !== id),
                              );
                            }}
                            availableSuggestions={mappedIdentityTagOptions}
                            placeholder={t("placeholders.identity_tags")}
                          />
                        );
                      }}
                    </form.Field>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.identityTags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="rounded-full border-dashed px-3 py-1 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(!profile?.identityTags || profile.identityTags.length === 0) && (
                        <span className="text-muted-foreground text-sm">
                          {t("status.no_identity_tags_specified")}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {t("labels.preferred_game_themes")}
                  </Label>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {t("descriptions.game_themes")}
                  </p>
                  {editingSection === "additional" ? (
                    <form.Field name="preferredGameThemes">
                      {(field) => {
                        const currentThemes = field.state.value || [];
                        const tags = currentThemes.map((themeId) => {
                          const theme = gameThemeOptions.find((t) => t === themeId);
                          return theme
                            ? { id: themeId, name: theme }
                            : { id: themeId, name: themeId };
                        });

                        return (
                          <TagInput
                            tags={tags}
                            onAddTag={(tag) => {
                              const currentValue = field.state.value || [];
                              if (!currentValue.includes(tag.id)) {
                                field.handleChange([...currentValue, tag.id]);
                              }
                            }}
                            onRemoveTag={(id) => {
                              const currentValue = field.state.value || [];
                              field.handleChange(
                                currentValue.filter((theme) => theme !== id),
                              );
                            }}
                            availableSuggestions={mappedGameThemeOptions}
                            placeholder={t("placeholders.game_themes")}
                          />
                        );
                      }}
                    </form.Field>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile?.preferredGameThemes?.map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="rounded-full border-dashed px-3 py-1 text-xs"
                        >
                          {theme}
                        </Badge>
                      ))}
                      {(!profile?.preferredGameThemes ||
                        profile.preferredGameThemes.length === 0) && (
                        <span className="text-muted-foreground text-sm">
                          {t("status.no_game_themes_specified")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocklist Management */}
          <Card className="w-full">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
                <div className="flex flex-1 flex-col gap-2 sm:min-w-[220px]">
                  <CardTitle>{t("blocklist.title")}</CardTitle>
                  <CardDescription>{t("blocklist.description")}</CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
                  <LocalizedButtonLink
                    to="/player/profile/blocklist"
                    translationKey="profile.open_blocklist"
                    translationNamespace="navigation"
                    fallbackText={t("blocklist.open_blocklist")}
                    className="w-full sm:w-auto"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("blocklist.explanation")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Privacy Settings */}
          <Card className="w-full">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
                <div className="flex flex-1 flex-col gap-2 sm:min-w-[220px]">
                  <CardTitle>{t("privacy_settings.title")}</CardTitle>
                  <CardDescription>{t("privacy_settings.description")}</CardDescription>
                </div>

                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  {editingSection !== "privacy" && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => startEditingSection("privacy")}
                      variant="outline"
                      size="sm"
                      aria-label={t("aria_labels.edit_privacy_settings")}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t("buttons.edit")}
                    </Button>
                  )}
                  {editingSection === "privacy" && (
                    <>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        disabled={form.state.isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("buttons.cancel")}
                      </Button>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            onClick={() => form.handleSubmit()}
                            disabled={!canSubmit || isSubmitting}
                            size="sm"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                {t("buttons.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("buttons.save_changes")}
                              </>
                            )}
                          </Button>
                        )}
                      </form.Subscribe>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === "privacy" ? (
                <>
                  <form.Field name="privacySettings.showEmail">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.show_email_to_teammates")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showPhone">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.show_phone_to_teammates")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLocation">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.show_location_to_everyone")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showLanguages">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.show_languages_to_everyone")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.showGamePreferences">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.show_game_preferences_to_everyone")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowTeamInvitations">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.allow_team_invitations")}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowInvitesOnlyFromConnections">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t(
                          "privacy_checkboxes.only_allow_invites_from_connections",
                        )}
                      />
                    )}
                  </form.Field>

                  <form.Field name="privacySettings.allowFollows">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("privacy_checkboxes.allow_follows")}
                      />
                    )}
                  </form.Field>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.email_visible_to_teammates")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.showEmail
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.phone_visible_to_teammates")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.showPhone
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.location_visible_to_everyone")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.showLocation
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.languages_visible_to_everyone")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.showLanguages
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.game_preferences_visible_to_everyone")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.showGamePreferences
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.allow_team_invitations")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.allowTeamInvitations
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {t("privacy_display.only_allow_invites_from_connections")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.allowInvitesOnlyFromConnections
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">{t("privacy_display.allow_follows")}</span>
                    <span className="text-muted-foreground text-sm">
                      {profile?.privacySettings?.allowFollows
                        ? t("display.yes")
                        : t("display.no")}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Game Preferences */}
          <Card className="w-full">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
                <div className="flex flex-1 flex-col gap-2 sm:min-w-[220px]">
                  <CardTitle>{t("game_preferences.title")}</CardTitle>
                  <CardDescription>{t("game_preferences.description")}</CardDescription>
                </div>

                <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  {editingSection !== "game-preferences" && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => startEditingSection("game-preferences")}
                      variant="outline"
                      size="sm"
                      aria-label={t("aria_labels.edit_game_preferences")}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      {t("buttons.edit")}
                    </Button>
                  )}
                  {editingSection === "game-preferences" && (
                    <>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        disabled={form.state.isSubmitting}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("buttons.cancel")}
                      </Button>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <Button
                            className="w-full sm:w-auto"
                            type="button"
                            onClick={() => form.handleSubmit()}
                            disabled={!canSubmit || isSubmitting}
                            size="sm"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                {t("buttons.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("buttons.save_changes")}
                              </>
                            )}
                          </Button>
                        )}
                      </form.Subscribe>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === "game-preferences" ? (
                <form.Field name="gameSystemPreferences">
                  {(field) => (
                    <GamePreferencesStep
                      initialFavorites={field.state.value?.favorite || []}
                      initialToAvoid={field.state.value?.avoid || []}
                      onPreferencesChange={(favorites, toAvoid) => {
                        field.handleChange({ favorite: favorites, avoid: toAvoid });
                      }}
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <div>
                    <Label className="text-base font-medium">
                      {t("labels.favorite_systems")}
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile?.gameSystemPreferences?.favorite?.map((system) => (
                        <span
                          key={system.id}
                          className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                        >
                          {system.name}
                        </span>
                      ))}
                      {(!profile?.gameSystemPreferences?.favorite ||
                        profile.gameSystemPreferences.favorite.length === 0) && (
                        <span className="text-muted-foreground text-sm">
                          {t("status.no_favorites_specified")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">
                      {t("labels.avoided_systems")}
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile?.gameSystemPreferences?.avoid?.map((system) => (
                        <span
                          key={system.id}
                          className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs text-red-800"
                        >
                          {system.name}
                        </span>
                      ))}
                      {(!profile?.gameSystemPreferences?.avoid ||
                        profile.gameSystemPreferences.avoid.length === 0) && (
                        <span className="text-muted-foreground text-sm">
                          {t("status.no_avoided_systems_specified")}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ResponsiveAvailabilityEditorProps {
  value: AvailabilityData;
  onChange: (value: AvailabilityData) => void;
  readOnly?: boolean;
}

function ResponsiveAvailabilityEditor({
  value,
  onChange,
  readOnly = false,
}: ResponsiveAvailabilityEditorProps) {
  return (
    <div className="max-w-full space-y-3">
      <div className="lg:hidden">
        <div className="border-border/60 bg-muted/30 rounded-xl border p-2 shadow-sm">
          <MobileAvailabilityEditor
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="border-border/60 bg-muted/20 rounded-xl border p-2 shadow-sm lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <AvailabilityEditor value={value} onChange={onChange} readOnly={readOnly} />
        </div>
      </div>
    </div>
  );
}

function formatPhoneNumber(value?: string | null) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (!digits.startsWith("49")) {
    return value;
  }

  const localNumber = digits.slice(2);
  const part1 = localNumber.slice(0, 4);
  const part2 = localNumber.slice(4, 7);
  const part3 = localNumber.slice(7, 11);

  if (!part1) {
    return "+49";
  }

  const segments = ["+49", part1];
  if (part2) {
    segments.push(part2);
  }
  if (part3) {
    segments.push(part3);
  }

  return segments.join(" ").trim();
}
