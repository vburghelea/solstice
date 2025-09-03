import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getUserProfile } from "~/features/profile/profile.queries";

export const Route = createFileRoute("/dashboard/profile/$userId")({
  loader: async ({ params }) => {
    return { userId: params.userId };
  },
  component: UserProfileComponent,
});

function UserProfileComponent() {
  const { userId } = Route.useLoaderData();

  const {
    data: profileResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile({ data: { userId } }),
    enabled: !!userId,
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !profileResult?.success || !profileResult.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          {profileResult?.errors?.[0]?.message ||
            error?.message ||
            "Failed to load profile."}
        </p>
      </div>
    );
  }

  const profile = profileResult.data;
  const privacySettings = profile.privacySettings;

  // Determine what information to display based on privacy settings
  const showEmail = privacySettings?.showEmail;
  const showPhone = privacySettings?.showPhone;
  const showLocation = privacySettings?.showLocation;
  const showLanguages = privacySettings?.showLanguages;
  const showGamePreferences = privacySettings?.showGamePreferences;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <Avatar className="mb-4 h-24 w-24">
            <AvatarImage src={profile.image} alt={profile.name || profile.email} />
            <AvatarFallback>
              {(profile.name || profile.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{profile.name || "Anonymous User"}</CardTitle>
          <CardDescription>{profile.pronouns && `(${profile.pronouns})`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {profile.gender && (
              <div>
                <h4 className="font-semibold">Gender:</h4>
                <p>{profile.gender}</p>
              </div>
            )}
            {profile.overallExperienceLevel && (
              <div>
                <h4 className="font-semibold">Experience Level:</h4>
                <p>{profile.overallExperienceLevel}</p>
              </div>
            )}
            {profile.isGM && (
              <div>
                <h4 className="font-semibold">Game Master:</h4>
                <p>Yes</p>
              </div>
            )}
            {profile.isGM && profile.gmStyle && (
              <div>
                <h4 className="font-semibold">GM Style:</h4>
                <p>{profile.gmStyle}</p>
              </div>
            )}
            {/* Privacy-controlled fields */}
            {showEmail && (
              <div>
                <h4 className="font-semibold">Email:</h4>
                <p>{profile.email}</p>
              </div>
            )}
            {showPhone && profile.phone && (
              <div>
                <h4 className="font-semibold">Phone:</h4>
                <p>{profile.phone}</p>
              </div>
            )}
            {showLocation && (profile.city || profile.country) && (
              <div>
                <h4 className="font-semibold">Location:</h4>
                <p>{[profile.city, profile.country].filter(Boolean).join(", ")}</p>
              </div>
            )}
          </div>

          {showLanguages && profile.languages && profile.languages.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold">Languages:</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {showGamePreferences &&
            profile.gameSystemPreferences &&
            (profile.gameSystemPreferences.favorite.length > 0 ||
              profile.gameSystemPreferences.avoid.length > 0) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold">Game System Preferences:</h4>
                  {profile.gameSystemPreferences.favorite.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium">Favorite:</h5>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {profile.gameSystemPreferences.favorite.map((game) => (
                          <span
                            key={game.id}
                            className="rounded-md bg-green-100 px-2 py-1 text-sm text-green-800"
                          >
                            {game.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.gameSystemPreferences.avoid.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium">Avoid:</h5>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {profile.gameSystemPreferences.avoid.map((game) => (
                          <span
                            key={game.id}
                            className="rounded-md bg-red-100 px-2 py-1 text-sm text-red-800"
                          >
                            {game.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
