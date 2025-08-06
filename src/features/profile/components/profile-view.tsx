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
import { Button } from "~/shared/ui/button";
import { updateUserProfile } from "../profile.mutations";
import { getUserProfile } from "../profile.queries";
import type { PartialProfileInputType } from "../profile.schemas";
import type { ProfileInput } from "../profile.types";

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
    queryFn: async () => getUserProfile(),
    retry: 1,
  });

  const profile = profileResult?.success ? profileResult.data : null;

  // TanStack Form for editing
  const form = useForm({
    defaultValues: {
      gender: "",
      pronouns: "",
      phone: "",
      privacySettings: {
        showEmail: false,
        showPhone: false,
        allowTeamInvitations: true,
      },
    } as PartialProfileInputType,
    onSubmit: async ({ value }) => {
      // Build ProfileInput with only changed/meaningful values
      // Use a more flexible type since we need to handle Date serialization
      const dataToSubmit: Record<string, unknown> = {};

        if (value.gender) dataToSubmit.gender = value.gender;
        if (value.pronouns) dataToSubmit.pronouns = value.pronouns;
        if (value.phone) dataToSubmit.phone = value.phone;
        if (value.privacySettings) dataToSubmit.privacySettings = value.privacySettings;

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
      } finally {
        // Don't reset form on error - this was causing fields to clear
        // TanStack Form handles submission state automatically
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

    const privacySettings = profile.privacySettings || {
      showEmail: false,
      showPhone: false,
      allowTeamInvitations: true,
    };
    form.setFieldValue("privacySettings.showEmail", privacySettings.showEmail);
    form.setFieldValue("privacySettings.showPhone", privacySettings.showPhone);
    form.setFieldValue(
      "privacySettings.allowTeamInvitations",
      privacySettings.allowTeamInvitations,
    );

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
        {profileResult?.errors?.[0]?.code === "VALIDATION_ERROR" && (
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
                  <p className="text-base">{profile.phone || "Not set"}</p>
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
                  <p className="text-base">{profile.gender || "Not set"}</p>
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
                  <p className="text-base">{profile.pronouns || "Not set"}</p>
                </>
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

              <form.Field name="privacySettings.allowTeamInvitations">
                {(field) => (
                  <ValidatedCheckbox
                    field={field}
                    label="Allow team captains to send me invitations"
                  />
                )}
              </form.Field>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email visibility:</span>{" "}
                {profile.privacySettings?.showEmail
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Phone visibility:</span>{" "}
                {profile.privacySettings?.showPhone
                  ? "Visible to team members"
                  : "Hidden"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Team invitations:</span>{" "}
                {profile.privacySettings?.allowTeamInvitations !== false
                  ? "Allowed"
                  : "Not allowed"}
              </p>
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
            {profile.profileComplete ? "Complete" : "Incomplete"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Profile Version:</span> {profile.profileVersion}
          </p>
          <p className="text-sm">
            <span className="font-medium">Last Updated:</span>{" "}
            {profile.profileUpdatedAt
              ? new Date(profile.profileUpdatedAt).toLocaleString()
              : "Never"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
