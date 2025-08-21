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
import { experienceLevelOptions } from "~/shared/types/common";
import { Button } from "~/shared/ui/button";
import { TagInput } from "~/shared/ui/tag-input";
import { updateUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { PartialProfileInputType } from "../profile.schemas";
import { AvailabilityEditor } from "./availability-editor";
import { GamePreferencesStep } from "./game-preferences-step";

export function ProfileView() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch profile data
  const {
    data: profileResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => getUserProfile({ data: {} }),
    retry: 1,
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

        if (value.gender !== (profile?.["gender"] || "")) {
          if (value.gender) {
            dataToSubmit["gender"] = value.gender;
          } else {
            // With exactOptionalPropertyTypes, we need to delete the property instead of setting it to undefined
            delete dataToSubmit["gender"];
          }
          hasChanges = true;
        }
        if (value.pronouns !== (profile?.["pronouns"] || "")) {
          if (value.pronouns) {
            dataToSubmit["pronouns"] = value.pronouns;
          } else {
            // With exactOptionalPropertyTypes. we need to delete the property instead of setting it to undefined
            delete dataToSubmit["pronouns"];
          }
          hasChanges = true;
        }
        if (value.phone !== (profile?.["phone"] || "")) {
          if (value.phone) {
            dataToSubmit["phone"] = value.phone;
          } else {
            // With exactOptionalPropertyTypes. we need to delete the property instead of setting it to undefined
            delete dataToSubmit["phone"];
          }
          hasChanges = true;
        }
        if (value.city !== (profile?.["city"] || "")) {
          if (value.city) {
            dataToSubmit["city"] = value.city;
          } else {
            delete dataToSubmit["city"];
          }
          hasChanges = true;
        }
        if (value.country !== (profile?.["country"] || "")) {
          if (value.country) {
            dataToSubmit["country"] = value.country;
          } else {
            delete dataToSubmit["country"];
          }
          hasChanges = true;
        }
        if (
          value.overallExperienceLevel !==
          (profile?.["overallExperienceLevel"] || undefined)
        ) {
          if (value.overallExperienceLevel) {
            dataToSubmit["overallExperienceLevel"] = value.overallExperienceLevel;
          } else {
            delete dataToSubmit["overallExperienceLevel"];
          }
          hasChanges = true;
        }
        if (
          JSON.stringify(value.calendarAvailability) !==
          JSON.stringify(profile?.["calendarAvailability"] || defaultAvailabilityData)
        ) {
          dataToSubmit["calendarAvailability"] = value.calendarAvailability;
          hasChanges = true;
        }
        if (value.gmStyle !== (profile?.["gmStyle"] || "")) {
          if (value.gmStyle) {
            dataToSubmit["gmStyle"] = value.gmStyle;
          } else {
            delete dataToSubmit["gmStyle"];
          }
          hasChanges = true;
        }
        if (value.isGM !== (profile?.["isGM"] || false)) {
          dataToSubmit["isGM"] = value.isGM;
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

        // Check if game system preferences have changed
        const currentFavorites = profile?.["gameSystemPreferences"]?.favorite || [];
        const currentAvoid = profile?.["gameSystemPreferences"]?.avoid || [];
        const newFavorites = value.gameSystemPreferences?.favorite || [];
        const newAvoid = value.gameSystemPreferences?.avoid || [];

        // Compare game system preferences
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
            // With exactOptionalPropertyTypes, we need to delete the property instead of setting it to undefined
            delete dataToSubmit["gameSystemPreferences"];
          }
          hasChanges = true;
        }

        // Check if privacy settings have changed
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

        // If no changes, just close the form
        if (!hasChanges || Object.keys(dataToSubmit).length === 0) {
          setIsEditing(false);
          toast.info("No changes were made to your profile.");
          return;
        }

        const result = await updateUserProfile({ data: dataToSubmit });

        if (result.success) {
          toast.success("Profile updated successfully");
          await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
          // Only exit edit mode on success
          setIsEditing(false);
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

  // Initialize form data when entering edit mode
  const startEditing = () => {
    if (!profile) return;

    // Reset form with current profile data
    form.reset();

    // Set field values from profile
    if (profile.gender) {
      form.setFieldValue("gender", profile.gender);
    }
    if (profile.pronouns) {
      form.setFieldValue("pronouns", profile.pronouns);
    }
    if (profile.phone) {
      form.setFieldValue("phone", profile.phone);
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

    if (profile.gameSystemPreferences) {
      form.setFieldValue("gameSystemPreferences", profile.gameSystemPreferences);
    }

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

    setIsEditing(true);
  };

  const cancelEditing = () => {
    // Reset form to original values
    form.reset();
    // Clear any errors
    setFormError(null);
    // Exit edit mode
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
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
            {!isEditing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
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
          {formError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <p className="text-base">{profile.name || "Not set"}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-base">{profile.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {isEditing ? (
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
                  <p className="text-base">{profile?.["phone"] || "Not set"}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
            {!isEditing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Languages</Label>
              {isEditing ? (
                <form.Field name="languages">
                  {(field) => (
                    <TagInput
                      tags={
                        field.state.value?.map((lang) => ({ id: lang, name: lang })) || []
                      }
                      onAddTag={(tag) => {
                        const newLanguages = [...(field.state.value || []), tag.name];
                        field.handleChange(newLanguages);
                      }}
                      onRemoveTag={(id) => {
                        const newLanguages = (field.state.value || []).filter(
                          (lang) => lang !== id,
                        );
                        field.handleChange(newLanguages);
                      }}
                      placeholder="Add languages you speak"
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["languages"]?.length ? (
                    profile["languages"].map((lang) => (
                      <span
                        key={lang}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {lang}
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
              {isEditing ? (
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
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["identityTags"]?.length ? (
                    profile["identityTags"].map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {tag}
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
              {isEditing ? (
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
                    />
                  )}
                </form.Field>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.["preferredGameThemes"]?.length ? (
                    profile["preferredGameThemes"].map((theme) => (
                      <span
                        key={theme}
                        className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
                      >
                        {theme}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Not set</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <></>
              ) : (
                <>
                  <Label>Game Master</Label>
                  <p className="text-base">{profile?.["isGM"] ? "Yes" : "No"}</p>
                  {profile?.["isGM"] && (
                    <>
                      <Label>GM Style</Label>
                      <p className="text-base">{profile?.["gmStyle"] || "Not set"}</p>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Calendar Availability</Label>
              {isEditing ? (
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
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control what information is visible to others</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <form.Field name="privacySettings.showEmail">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my email address to team members"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showPhone">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my phone number to team members"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLocation">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my location (city/country) to others"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLanguages">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my languages to others"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showGamePreferences">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my game preferences to others"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowTeamInvitations">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Allow team invitations"
                    disabled={false}
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowFollows">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Allow others to follow me"
                    disabled={false}
                  />
                )}
              </form.Field>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email visibility:</span>{" "}
                {profile["privacySettings"]?.showEmail
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone visibility:</span>{" "}
                {profile["privacySettings"]?.showPhone
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Location visibility:</span>{" "}
                {profile["privacySettings"]?.showLocation
                  ? "Visible to others"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Languages visibility:</span>{" "}
                {profile["privacySettings"]?.showLanguages
                  ? "Visible to others"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Game preferences visibility:</span>{" "}
                {profile["privacySettings"]?.showGamePreferences
                  ? "Visible to others"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Team invitations:</span>{" "}
                {profile["privacySettings"]?.allowTeamInvitations !== false
                  ? "Allowed"
                  : "Not Allowed"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Follow permissions:</span>{" "}
                {profile["privacySettings"]?.allowFollows ? "Allowed" : "Not Allowed"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Game Preferences</CardTitle>
          <CardDescription>
            Tell us which game systems you prefer to play or want to avoid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
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
                  {profile["gameSystemPreferences"]?.favorite.length ? (
                    profile["gameSystemPreferences"].favorite.map((gameSystem) => (
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
                  {profile["gameSystemPreferences"]?.avoid.length ? (
                    profile["gameSystemPreferences"].avoid.map((gameSystem) => (
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
            {profile["profileComplete"] ? "Complete" : "Incomplete"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Profile Version:</span>{" "}
            {profile["profileVersion"]}
          </p>
          <p className="text-sm">
            <span className="font-medium">Last Updated:</span>{" "}
            {profile["profileUpdatedAt"]
              ? new Date(profile["profileUpdatedAt"]).toLocaleString()
              : "Never"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
