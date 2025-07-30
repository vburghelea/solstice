import { useAppForm } from "~/lib/form";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

import { updateUserProfile } from "../profile.mutations";
import { getUserGameSystemPreferences } from "../profile.queries";
import { profileInputSchema, ProfileInputType } from "../profile.schemas";
import type { ProfileOperationResult } from "../profile.types";

import { useRouteContext } from "@tanstack/react-router";
import { GamePreferencesStep } from "./game-preferences-step";

const defaultProfile: ProfileInputType = {
  gender: "",
  pronouns: "",
  phone: "",
  gameSystemPreferences: {
    favorite: [],
    avoid: [],
  },
  privacySettings: {
    showEmail: false,
    showPhone: false,
    allowTeamInvitations: true,
  },
};

export function ProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useRouteContext({ from: "/dashboard/profile" });

  const { data: gamePreferences } = useQuery({
    queryKey: ["user-game-preferences"],
    queryFn: () => getUserGameSystemPreferences(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      gender: user?.gender ?? "",
      pronouns: user?.pronouns ?? "",
      phone: user?.phone ?? "",
      gameSystemPreferences: {
        favorite: gamePreferences?.data?.favorite || [],
        avoid: gamePreferences?.data?.avoid || [],
      } as {
        favorite: { id: number; name: string }[];
        avoid: { id: number; name: string }[];
      },
      privacySettings: user?.privacySettings
        ? JSON.parse(user.privacySettings as string)
        : defaultProfile.privacySettings,
    },
    validators: {
      onChange: ({ value }) => {
        const result = profileInputSchema.safeParse(value);
        if (!result.success) {
          return result.error.errors.map((err) => ({
            message: err.message,
            path: err.path.join("."),
          }));
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await (
          updateUserProfile as unknown as (params: {
            data: Partial<ProfileInputType>;
          }) => Promise<ProfileOperationResult>
        )({
          data: value,
        });

        if (result.success) {
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          router.invalidate();
        } else {
          const errorMessage = result.errors?.[0]?.message || "Failed to save profile";
          setError(errorMessage);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Profile submission error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (user && gamePreferences?.success) {
      const parsedPrivacySettings = user.privacySettings
        ? JSON.parse(user.privacySettings)
        : {};
      form.setFieldValue(
        "privacySettings.showEmail",
        parsedPrivacySettings.showEmail || false,
      );
      form.setFieldValue(
        "privacySettings.showPhone",
        parsedPrivacySettings.showPhone || false,
      );
      form.setFieldValue(
        "privacySettings.allowTeamInvitations",
        parsedPrivacySettings.allowTeamInvitations || true,
      );
    }
  }, [user, gamePreferences, form]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic information about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.AppField
              name="gender"
              children={(field) => (
                <field.ValidatedSelect
                  field={field}
                  label="Gender (optional)"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "non-binary", label: "Non-binary" },
                    { value: "other", label: "Other" },
                    { value: "prefer-not-to-say", label: "Prefer not to say" },
                  ]}
                  placeholderText="Select gender"
                />
              )}
            />

            <form.AppField
              name="pronouns"
              children={(field) => (
                <field.ValidatedInput
                  field={field}
                  label="Pronouns (optional)"
                  placeholder="e.g., they/them, she/her, he/him"
                />
              )}
            />

            <form.AppField
              name="phone"
              children={(field) => (
                <field.ValidatedInput
                  field={field}
                  label="Phone Number (optional)"
                  placeholder="+1 (555) 000-0000"
                />
              )}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Game Preferences</CardTitle>
            <CardDescription>
              Select your favorite and least favorite game systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField
              name="gameSystemPreferences"
              children={(field) => (
                <GamePreferencesStep
                  initialFavorites={field.state.value?.favorite || []}
                  initialToAvoid={field.state.value?.avoid || []}
                  onPreferencesChange={(favorite, avoid) => {
                    field.handleChange({ favorite: favorite, avoid: avoid });
                  }}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control what information is visible to others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.AppField
              name="privacySettings.showEmail"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label="Show my email address to team members"
                />
              )}
            />

            <form.AppField
              name="privacySettings.showPhone"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label="Show my phone number to team members"
                />
              )}
            />

            <form.AppField
              name="privacySettings.allowTeamInvitations"
              children={(field) => (
                <field.ValidatedCheckbox
                  field={field}
                  label="Allow team captains to send me invitations"
                />
              )}
            />
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
