import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import {
  experienceLevelOptions,
  gameThemeOptions,
  identityTagOptions,
  languageOptions,
} from "~/shared/types/common";
import { Button } from "~/shared/ui/button";
import { TagInput } from "~/shared/ui/tag-input";
import { updateUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { PartialProfileInputType } from "../profile.schemas";
import { AvailabilityEditor } from "./availability-editor";
import { GamePreferencesStep } from "./game-preferences-step";

export function ProfileView() {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
    // Prevent hydration mismatches by ensuring consistent loading states
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const profile = profileResult?.success ? profileResult.data : null;

  const form = useForm({
    defaultValues: {
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
          };
          const newPrivacy = value.privacySettings || {
            showEmail: false,
            showPhone: false,
            showLocation: false,
            showLanguages: false,
            showGamePreferences: false,
            allowTeamInvitations: true,
            allowFollows: true,
          };

          if (
            newPrivacy.showEmail !== currentPrivacy.showEmail ||
            newPrivacy.showPhone !== currentPrivacy.showPhone ||
            newPrivacy.showLocation !== currentPrivacy.showLocation ||
            newPrivacy.showLanguages !== currentPrivacy.showLanguages ||
            newPrivacy.showGamePreferences !== currentPrivacy.showGamePreferences ||
            newPrivacy.allowTeamInvitations !== currentPrivacy.allowTeamInvitations ||
            newPrivacy.allowFollows !== currentPrivacy.allowFollows
          ) {
            dataToSubmit["privacySettings"] = newPrivacy;
            hasChanges = true;
          }
        }

        // If no changes, just close the form
        if (!hasChanges || Object.keys(dataToSubmit).length === 0) {
          setEditingSection(null);
          toast.info("No changes were made to your profile.");
          return;
        }

        const result = await updateUserProfile({ data: dataToSubmit });

        if (result.success) {
          toast.success("Profile updated successfully");
          await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
          // Only exit edit mode on success
          setEditingSection(null);
          setFormError(null);
        } else {
          // Show error but don't exit edit mode
          const error = result.errors?.[0]?.message || "Failed to update profile";
          setFormError(error);
          toast.error(error);
          // Don't throw - let form remain interactive
        }
      } catch (error) {
        // Network/unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred";
        setFormError(errorMessage);
        toast.error(errorMessage);
        console.error("Profile update error:", error);
        // Don't throw - let form remain interactive
      }
    },
  });

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
      toast.info(
        "Please save or cancel your current changes before editing another section.",
      );
      return;
    }

    // Set field values from profile for the specific section
    if (sectionId === "basic") {
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
      form.setFieldValue(
        "calendarAvailability",
        profile.calendarAvailability || defaultAvailabilityData,
      );
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
    }

    setEditingSection(sectionId);
  };

  const cancelEditing = () => {
    // Reset form to original values
    form.reset();
    // Clear any errors
    setFormError(null);
    // Exit edit mode
    setEditingSection(null);
  };

  // Handle loading state - only show loading if we don't have data yet
  if (isLoading && !profileResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">Loading profile...</span>
      </div>
    );
  }

  // Handle error state - only show error if we have an error and no successful data
  if (error && !isSuccess && !profile) {
    const errorMessage =
      profileResult?.errors?.[0]?.message || error?.message || "Failed to load profile";
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
        {profileResult?.errors?.[0].code === "VALIDATION_ERROR" && (
          <p className="text-muted-foreground mt-2 text-sm">
            Please try logging in again
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
        <span className="text-muted-foreground ml-2">Loading profile data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </div>
            {editingSection !== "basic" && (
              <Button
                onClick={() => startEditingSection("basic")}
                variant="outline"
                size="sm"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Basic Information
              </Button>
            )}
            {editingSection === "basic" && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  disabled={form.state.isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit()}
                      disabled={!canSubmit || isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && editingSection === "basic" && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <p className="text-base">{profile?.name || "Not set"}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-base">{profile?.email || "Not set"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="phone">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Phone Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>Phone Number</Label>
                  <p className="text-base">{profile?.phone || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="gender">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Gender"
                      options={genderOptions}
                      placeholderText="Select gender"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>Gender</Label>
                  <p className="text-base">{profile?.["gender"] || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="pronouns">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Pronouns"
                      placeholder="e.g., they/them, she/her, he/him"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>Pronouns</Label>
                  <p className="text-base">{profile?.["pronouns"] || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="city">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="City"
                      placeholder="Enter your city"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>City</Label>
                  <p className="text-base">{profile?.["city"] || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="country">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Country"
                      placeholder="Enter your country"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>Country</Label>
                  <p className="text-base">{profile?.["country"] || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {editingSection === "basic" ? (
                <form.Field name="overallExperienceLevel">
                  {(field) => (
                    <ValidatedSelect
                      field={field}
                      label="Overall Experience Level"
                      options={mappedExperienceLevelOptions}
                      placeholderText="Select your experience level"
                    />
                  )}
                </form.Field>
              ) : (
                <>
                  <Label>Overall Experience Level</Label>
                  <p className="text-base">
                    {profile?.["overallExperienceLevel"] || "Not set"}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                More details about your gaming preferences and experience
              </CardDescription>
            </div>
            {editingSection !== "additional" && (
              <Button
                onClick={() => startEditingSection("additional")}
                variant="outline"
                size="sm"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Additional Information
              </Button>
            )}
            {editingSection === "additional" && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  disabled={form.state.isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit()}
                      disabled={!canSubmit || isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && editingSection === "additional" && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Languages</Label>
              {editingSection === "additional" ? (
                <form.Field name="languages">
                  {(field) => (
                    <TagInput
                      tags={
                        field.state.value?.map((langCode) => ({
                          id: langCode,
                          name:
                            mappedLanguageOptions.find((l) => l.id === langCode)?.name ||
                            langCode,
                        })) || []
                      }
                      onAddTag={(tag) => {
                        const newLanguages = [...(field.state.value || []), tag.id];
                        field.handleChange(newLanguages);
                      }}
                      onRemoveTag={(id) => {
                        const newLanguages = (field.state.value || []).filter(
                          (lang) => lang !== id,
                        );
                        field.handleChange(newLanguages);
                      }}
                      placeholder="Add languages you speak"
                      availableSuggestions={mappedLanguageOptions}
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["languages"]?.length ? (
                    profile?.languages?.map((langCode) => (
                      <span
                        key={langCode}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {languageOptions.find((l) => l.value === langCode)?.label ||
                          langCode}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Not set</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Identity Tags</Label>
              {editingSection === "additional" ? (
                <form.Field name="identityTags">
                  {(field) => (
                    <TagInput
                      tags={
                        field.state.value?.map((tag) => ({ id: tag, name: tag })) || []
                      }
                      onAddTag={(tag) => {
                        const newTags = [...(field.state.value || []), tag.name];
                        field.handleChange(newTags);
                      }}
                      onRemoveTag={(id) => {
                        const newTags = (field.state.value || []).filter(
                          (tag) => tag !== id,
                        );
                        field.handleChange(newTags);
                      }}
                      placeholder="Add identity tags that represent you"
                      availableSuggestions={mappedIdentityTagOptions}
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["identityTags"]?.length ? (
                    profile?.identityTags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {mappedIdentityTagOptions.find((t) => t.id === tag)?.name || tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Not set</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preferred Game Themes</Label>
              {editingSection === "additional" ? (
                <form.Field name="preferredGameThemes">
                  {(field) => (
                    <TagInput
                      tags={
                        field.state.value?.map((theme) => ({ id: theme, name: theme })) ||
                        []
                      }
                      onAddTag={(tag) => {
                        const newThemes = [...(field.state.value || []), tag.name];
                        field.handleChange(newThemes);
                      }}
                      onRemoveTag={(id) => {
                        const newThemes = (field.state.value || []).filter(
                          (theme) => theme !== id,
                        );
                        field.handleChange(newThemes);
                      }}
                      placeholder="Add game themes you prefer"
                      availableSuggestions={mappedGameThemeOptions}
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["preferredGameThemes"]?.length ? (
                    profile?.preferredGameThemes?.map((theme) => (
                      <span
                        key={theme}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {mappedGameThemeOptions.find((t) => t.id === theme)?.name ||
                          theme}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Not set</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Calendar Availability</Label>
              {editingSection === "additional" ? (
                <form.Field name="calendarAvailability">
                  {(field) => (
                    <AvailabilityEditor
                      value={field.state.value ?? defaultAvailabilityData}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
              ) : (
                <AvailabilityEditor
                  value={profile?.["calendarAvailability"] ?? defaultAvailabilityData}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control what information is visible to others
              </CardDescription>
            </div>
            {editingSection !== "privacy" && (
              <Button
                onClick={() => startEditingSection("privacy")}
                variant="outline"
                size="sm"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Privacy Settings
              </Button>
            )}
            {editingSection === "privacy" && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  disabled={form.state.isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit()}
                      disabled={!canSubmit || isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && editingSection === "privacy" && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          {editingSection === "privacy" ? (
            <div className="space-y-4">
              <form.Field name="privacySettings.showEmail">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my email address to team members"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showPhone">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my phone number to team members"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLocation">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my location (city/country) to others"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLanguages">
                {(field) => (
                  <ValidatedCheckbox field={field} label="Show my languages to others" />
                )}
              </form.Field>

              <form.Field name="privacySettings.showGamePreferences">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my game preferences to others"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowTeamInvitations">
                {(field) => (
                  <ValidatedCheckbox field={field} label="Allow team invitations" />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowFollows">
                {(field) => (
                  <ValidatedCheckbox field={field} label="Allow others to follow me" />
                )}
              </form.Field>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email visibility:</span>{" "}
                {profile?.privacySettings?.showEmail
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone visibility:</span>{" "}
                {profile?.privacySettings?.showPhone
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Location visibility:</span>{" "}
                {profile?.privacySettings?.showLocation ? "Visible to others" : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Languages visibility:</span>{" "}
                {profile?.privacySettings?.showLanguages ? "Visible to others" : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Game preferences visibility:</span>{" "}
                {profile?.privacySettings?.showGamePreferences
                  ? "Visible to others"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Team invitations:</span>{" "}
                {profile?.privacySettings?.allowTeamInvitations !== false
                  ? "Allowed"
                  : "Not Allowed"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Follow permissions:</span>{" "}
                {profile?.privacySettings?.allowFollows ? "Allowed" : "Not Allowed"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Game Preferences</CardTitle>
              <CardDescription>
                Tell us which game systems you prefer to play or want to avoid
              </CardDescription>
            </div>
            {editingSection !== "game-preferences" && (
              <Button
                onClick={() => startEditingSection("game-preferences")}
                variant="outline"
                size="sm"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Game Preferences
              </Button>
            )}
            {editingSection === "game-preferences" && (
              <div className="flex gap-2">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  disabled={form.state.isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit()}
                      disabled={!canSubmit || isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && editingSection === "game-preferences" && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
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
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Favorite Game Systems</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile?.gameSystemPreferences?.favorite.length ? (
                    profile?.gameSystemPreferences.favorite.map((gameSystem) => (
                      <span
                        key={gameSystem.id}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {gameSystem.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No favorite game systems selected
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Game Systems to Avoid</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile?.gameSystemPreferences?.avoid.length ? (
                    profile?.gameSystemPreferences.avoid.map((gameSystem) => (
                      <span
                        key={gameSystem.id}
                        className="bg-destructive text-destructive-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {gameSystem.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No game systems to avoid selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Technical details about your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Profile Status:</span>{" "}
            {profile?.profileComplete ? "Complete" : "Incomplete"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Profile Version:</span>{" "}
            {profile?.profileVersion}
          </p>
          <p className="text-sm">
            <span className="font-medium">Last Updated:</span>{" "}
            {profile?.profileUpdatedAt
              ? new Date(profile.profileUpdatedAt).toLocaleString()
              : "Never"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
