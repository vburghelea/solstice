import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Button } from "~/components/ui/button";
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
import { LinkedAccounts } from "~/features/auth/components/linked-accounts";
import { SecuritySettings } from "~/features/auth/components/security-settings";
import {
  experienceLevelOptions,
  gameThemeOptions,
  gmStrengthIcons,
  gmStrengthLabels,
  identityTagOptions,
  languageOptions,
} from "~/shared/types/common";
//
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { TagInput } from "~/shared/ui/tag-input";
import { ThumbsScore } from "~/shared/ui/thumbs-score";
import { UserAvatar } from "~/shared/ui/user-avatar";
import { updateUserProfile } from "../profile.mutations";
import type { ProfileOperationResult } from "../profile.types";
import { getUserProfile } from "../profile.queries";
import type { PartialProfileInputType } from "../profile.schemas";
import { AvailabilityEditor } from "./availability-editor";
import { AvatarUpload } from "./avatar-upload";
import { GamePreferencesStep } from "./game-preferences-step";

export function ProfileView() {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<string | null>(null);

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
      notificationPreferences: {
        gameReminders: true,
        gameUpdates: true,
        campaignDigests: true,
        campaignUpdates: true,
        reviewReminders: true,
        socialNotifications: false,
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

        // Notification Preferences Fields
        if (editingSection === "notifications") {
          const currentPrefs = profile?.["notificationPreferences"] || {
            gameReminders: true,
            gameUpdates: true,
            campaignDigests: true,
            campaignUpdates: true,
            reviewReminders: true,
            socialNotifications: false,
          };
          const newPrefs = value.notificationPreferences || {
            gameReminders: true,
            gameUpdates: true,
            campaignDigests: true,
            campaignUpdates: true,
            reviewReminders: true,
            socialNotifications: false,
          };

          if (
            newPrefs.gameReminders !== currentPrefs.gameReminders ||
            newPrefs.campaignDigests !== currentPrefs.campaignDigests ||
            newPrefs.gameUpdates !== currentPrefs.gameUpdates ||
            newPrefs.campaignUpdates !== currentPrefs.campaignUpdates ||
            newPrefs.reviewReminders !== currentPrefs.reviewReminders ||
            newPrefs.socialNotifications !== currentPrefs.socialNotifications
          ) {
            dataToSubmit["notificationPreferences"] = newPrefs;
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
        } else {
          // Show error but don't exit edit mode
          const error = result.errors?.[0]?.message || "Failed to update profile";

          toast.error(error);
          // Don't throw - let form remain interactive
        }
      } catch (error) {
        // Network/unexpected errors
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred";

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
      form.setFieldValue(
        "calendarAvailability",
        profile.calendarAvailability || defaultAvailabilityData,
      );
      form.setFieldValue("languages", profile.languages || []);
      form.setFieldValue("identityTags", profile.identityTags || []);
      form.setFieldValue("preferredGameThemes", profile.preferredGameThemes || []);
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

      const notifPrefs = profile.notificationPreferences || {
        gameReminders: true,
        gameUpdates: true,
        campaignDigests: true,
        campaignUpdates: true,
        reviewReminders: true,
        socialNotifications: false,
      };
      form.setFieldValue(
        "notificationPreferences.gameReminders",
        notifPrefs.gameReminders,
      );
      form.setFieldValue("notificationPreferences.gameUpdates", notifPrefs.gameUpdates);
      form.setFieldValue(
        "notificationPreferences.campaignDigests",
        notifPrefs.campaignDigests,
      );
      form.setFieldValue(
        "notificationPreferences.campaignUpdates",
        notifPrefs.campaignUpdates,
      );
      form.setFieldValue(
        "notificationPreferences.reviewReminders",
        notifPrefs.reviewReminders,
      );
      form.setFieldValue(
        "notificationPreferences.socialNotifications",
        notifPrefs.socialNotifications,
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
      toast.info(
        "Please save or cancel your current changes before editing another section.",
      );
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
            <div className="flex items-center gap-3">
              {editingSection !== "basic" ? (
                <UserAvatar
                  className="h-10 w-10"
                  name={profile?.name ?? null}
                  email={profile?.email ?? null}
                  srcUploaded={profile?.uploadedAvatarPath ?? null}
                  srcProvider={profile?.image ?? null}
                />
              ) : null}
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Your personal details and contact information
                </CardDescription>
              </div>
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
          {/* Avatar upload (edit-mode only) */}
          {editingSection === "basic" ? (
            <AvatarUpload
              name={profile?.name ?? null}
              email={profile?.email ?? null}
              image={profile?.image ?? null}
              uploadedAvatarPath={profile?.uploadedAvatarPath ?? null}
            />
          ) : null}

          {/* Email (view-only) */}
          <div>
            <Label>Email Address</Label>
            <p className="text-muted-foreground mt-1 text-sm">{profile?.email}</p>
          </div>

          {/* GM Stats (view-only) */}
          {profile?.isGM ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Games Hosted</Label>
                <p className="mt-1 text-sm font-medium">{profile.gamesHosted}</p>
              </div>
              <div>
                <Label>GM Rating</Label>
                <p className="mt-1 text-sm font-medium">
                  <ThumbsScore value={profile.gmRating ?? null} />
                </p>
              </div>
              <div>
                <Label>Response Rate</Label>
                <p className="mt-1 text-sm font-medium">
                  {typeof profile.responseRate === "number"
                    ? `${profile.responseRate}%`
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label>Avg Response Time</Label>
                <p className="mt-1 text-sm font-medium">
                  {typeof profile.averageResponseTime === "number"
                    ? `${profile.averageResponseTime} min`
                    : "N/A"}
                </p>
              </div>
              {profile.gmTopStrengths && profile.gmTopStrengths.length > 0 && (
                <div className="sm:col-span-2">
                  <Label>Top Strengths</Label>
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
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Pronouns</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.pronouns || "Not specified"}
              </p>
            </div>
          ) : null}

          {editingSection === "basic" ? (
            <form.Field name="gender">
              {(field) => (
                <ValidatedSelect
                  field={field}
                  label="Gender"
                  placeholder="Select gender"
                  options={genderOptions}
                />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Gender</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.gender || "Not specified"}
              </p>
            </div>
          )}

          {editingSection === "basic" ? (
            <form.Field name="pronouns">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Pronouns"
                  placeholder="e.g. he/him, she/her, they/them"
                />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Pronouns</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.pronouns || "Not specified"}
              </p>
            </div>
          )}

          {editingSection === "basic" ? (
            <form.Field name="phone">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Phone Number"
                  placeholder="Your phone number"
                />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Phone Number</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.phone || "Not specified"}
              </p>
            </div>
          )}

          {editingSection === "basic" ? (
            <form.Field name="city">
              {(field) => (
                <ValidatedInput field={field} label="City" placeholder="Your city" />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>City</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.city || "Not specified"}
              </p>
            </div>
          )}

          {editingSection === "basic" ? (
            <form.Field name="country">
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Country"
                  placeholder="Your country"
                />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Country</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.country || "Not specified"}
              </p>
            </div>
          )}

          {editingSection === "basic" ? (
            <form.Field name="overallExperienceLevel">
              {(field) => (
                <ValidatedSelect
                  field={field}
                  label="Overall Experience Level"
                  placeholder="Select experience level"
                  options={mappedExperienceLevelOptions}
                />
              )}
            </form.Field>
          ) : (
            <div>
              <Label>Overall Experience Level</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                {profile?.overallExperienceLevel
                  ? profile.overallExperienceLevel.charAt(0).toUpperCase() +
                    profile.overallExperienceLevel.slice(1)
                  : "Not specified"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>Control non-critical email notifications</CardDescription>
          </div>
          {editingSection !== "notifications" && (
            <Button
              onClick={() => startEditingSection("notifications")}
              variant="outline"
              size="sm"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Email Preferences
            </Button>
          )}
          {editingSection === "notifications" && (
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
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <form.Field name="notificationPreferences.gameReminders">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Game Reminders"
                  description="Receive reminders 24h/2h before games you’re attending."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
            <form.Field name="notificationPreferences.gameUpdates">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Game Updates"
                  description="Emails when a game you’re attending is scheduled/updated/canceled."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
            <form.Field name="notificationPreferences.campaignDigests">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Campaign Weekly Digest"
                  description="Receive a weekly summary of upcoming campaign sessions."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
            <form.Field name="notificationPreferences.campaignUpdates">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Campaign Session Updates"
                  description="Emails when a campaign session is scheduled/updated/canceled."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
            <form.Field name="notificationPreferences.reviewReminders">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Review Reminders"
                  description="Get a reminder to review your GM after games."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
            <form.Field name="notificationPreferences.socialNotifications">
              {(field) => (
                <ValidatedCheckbox
                  field={field}
                  label="Social Notifications"
                  description="Emails for social events like follows and requests."
                  disabled={editingSection !== "notifications"}
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Your gaming preferences and availability</CardDescription>
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
          {/* Calendar Availability */}
          <div>
            <Label className="text-base font-medium">Availability Calendar</Label>
            <p className="text-muted-foreground mb-4 text-sm">
              Set your weekly availability for gaming sessions
            </p>
            {editingSection === "additional" ? (
              <form.Field name="calendarAvailability">
                {(field) => (
                  <AvailabilityEditor
                    value={field.state.value || defaultAvailabilityData}
                    onChange={(newValue) => {
                      field.handleChange(newValue);
                    }}
                    readOnly={false}
                  />
                )}
              </form.Field>
            ) : (
              <AvailabilityEditor
                value={profile?.calendarAvailability || defaultAvailabilityData}
                onChange={() => {}}
                readOnly={true}
              />
            )}
          </div>

          <Separator />

          {/* Languages */}
          <div>
            <Label className="text-base font-medium">Languages</Label>
            <p className="text-muted-foreground mb-4 text-sm">
              Languages you speak fluently
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
                        field.handleChange(currentValue.filter((lang) => lang !== id));
                      }}
                      availableSuggestions={mappedLanguageOptions}
                      placeholder="Select languages you speak"
                    />
                  );
                }}
              </form.Field>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.languages?.map((langCode) => {
                  const lang = languageOptions.find((l) => l.value === langCode);
                  return lang ? (
                    <span
                      key={langCode}
                      className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
                    >
                      {lang.label}
                    </span>
                  ) : null;
                })}
                {(!profile?.languages || profile.languages.length === 0) && (
                  <span className="text-muted-foreground text-sm">
                    No languages specified
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Identity Tags */}
          <div>
            <Label className="text-base font-medium">Identity Tags</Label>
            <p className="text-muted-foreground mb-4 text-sm">
              Help others find compatible gaming partners
            </p>
            {editingSection === "additional" ? (
              <form.Field name="identityTags">
                {(field) => {
                  const currentTags = field.state.value || [];
                  const tags = currentTags.map((tagId) => {
                    const tag = identityTagOptions.find((t) => t === tagId);
                    return tag ? { id: tagId, name: tag } : { id: tagId, name: tagId };
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
                        field.handleChange(currentValue.filter((tag) => tag !== id));
                      }}
                      availableSuggestions={mappedIdentityTagOptions}
                      placeholder="Select identity tags"
                    />
                  );
                }}
              </form.Field>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.identityTags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {(!profile?.identityTags || profile.identityTags.length === 0) && (
                  <span className="text-muted-foreground text-sm">
                    No identity tags specified
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Preferred Game Themes */}
          <div>
            <Label className="text-base font-medium">Preferred Game Themes</Label>
            <p className="text-muted-foreground mb-4 text-sm">
              Game themes you enjoy most
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
                        field.handleChange(currentValue.filter((theme) => theme !== id));
                      }}
                      availableSuggestions={mappedGameThemeOptions}
                      placeholder="Select preferred game themes"
                    />
                  );
                }}
              </form.Field>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.preferredGameThemes?.map((theme) => (
                  <span
                    key={theme}
                    className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
                  >
                    {theme}
                  </span>
                ))}
                {(!profile?.preferredGameThemes ||
                  profile.preferredGameThemes.length === 0) && (
                  <span className="text-muted-foreground text-sm">
                    No game themes specified
                  </span>
                )}
              </div>
            )}
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
          {editingSection === "privacy" ? (
            <>
              <form.Field name="privacySettings.showEmail">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my email address to teammates"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showPhone">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my phone number to teammates"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLocation">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my location (city and country) to everyone"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showLanguages">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my languages to everyone"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.showGamePreferences">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Show my game preferences to everyone"
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
                    label="Allow team invitations from other users"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowInvitesOnlyFromConnections">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Only allow invites from connections"
                  />
                )}
              </form.Field>

              <form.Field name="privacySettings.allowFollows">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Allow other users to follow you"
                  />
                )}
              </form.Field>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email visible to teammates</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.showEmail ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Phone number visible to teammates</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.showPhone ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Location visible to everyone</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.showLocation ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Languages visible to everyone</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.showLanguages ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Game preferences visible to everyone</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.showGamePreferences ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Allow team invitations</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.allowTeamInvitations ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Only allow invites from connections</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.allowInvitesOnlyFromConnections
                    ? "Yes"
                    : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Allow follows</span>
                <span className="text-muted-foreground text-sm">
                  {profile?.privacySettings?.allowFollows ? "Yes" : "No"}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Game Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Game Preferences</CardTitle>
              <CardDescription>Your favorite and avoided game systems</CardDescription>
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
                <Label className="text-base font-medium">Favorite Systems</Label>
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
                      No favorites specified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Avoided Systems</Label>
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
                      No avoided systems specified
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Blocklist Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blocklist</CardTitle>
              <CardDescription>Manage users you’ve blocked</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/profile/blocklist">Open Blocklist</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Blocked users cannot follow you, invite you, or apply to your games/campaigns.
            You can unblock them at any time.
          </p>
        </CardContent>
      </Card>

      {/* Security & Linked Accounts (Combined) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Security & Accounts</CardTitle>
            <CardDescription>Manage your password and connected logins</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <SecuritySettings embedded />
          <Separator />
          <LinkedAccounts embedded />
        </CardContent>
      </Card>
    </div>
  );
}
