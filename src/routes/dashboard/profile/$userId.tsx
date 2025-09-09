import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, ShieldBan, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getUserProfile } from "~/features/profile/profile.queries";
import {
  blockUser,
  followUser,
  getRelationshipSnapshot,
  unblockUser,
  unfollowUser,
} from "~/features/social";
import { areTeammatesWithCurrentUser } from "~/features/teams/teams.queries";
import { Badge } from "~/shared/ui/badge";
import { UserAvatar } from "~/shared/ui/user-avatar";

export const Route = createFileRoute("/dashboard/profile/$userId")({
  loader: async ({ params }) => {
    return { userId: params.userId };
  },
  component: UserProfileComponent,
});

export function UserProfileComponent() {
  const { userId } = Route.useLoaderData();
  const { user: currentUser } = Route.useRouteContext();

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

  const { data: teamRelation } = useQuery({
    queryKey: ["areTeammates", userId],
    queryFn: () => areTeammatesWithCurrentUser({ data: { userId } }),
    enabled: !!userId,
  });

  const queryClient = useQueryClient();
  const relKey = ["relationship", userId] as const;
  const { data: relResult, refetch: refetchRel } = useQuery({
    queryKey: ["relationship", userId],
    queryFn: () => getRelationshipSnapshot({ data: { userId } }),
    enabled: !!userId,
    refetchOnMount: "always",
  });

  const isSelf = !!currentUser?.id && currentUser.id === userId;
  const follows = !!relResult && relResult.success && relResult.data.follows && !isSelf;
  const followedBy =
    !!relResult && relResult.success && relResult.data.followedBy && !isSelf;
  const blockedAny =
    !!relResult &&
    relResult.success &&
    (relResult.data.blocked || relResult.data.blockedBy);

  const doFollow = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await followUser({ data: { followingId: userId } });
    },
    onSuccess: async () => {
      queryClient.setQueryData(
        relKey,
        (
          prev:
            | {
                success?: boolean;
                data?: {
                  follows?: boolean;
                  followedBy?: boolean;
                  isConnection?: boolean;
                  blocked?: boolean;
                  blockedBy?: boolean;
                };
              }
            | undefined,
        ) => {
          if (prev?.success && prev?.data) {
            return { ...prev, data: { ...prev.data, follows: true, isConnection: true } };
          }
          return prev;
        },
      );
      await refetchRel();
    },
  });
  const doUnfollow = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await unfollowUser({ data: { followingId: userId } });
    },
    onSuccess: async () => {
      queryClient.setQueryData(
        relKey,
        (
          prev:
            | {
                success?: boolean;
                data?: {
                  follows?: boolean;
                  followedBy?: boolean;
                  isConnection?: boolean;
                  blocked?: boolean;
                  blockedBy?: boolean;
                };
              }
            | undefined,
        ) => {
          if (prev?.success && prev?.data) {
            const isConn = !!prev.data.followedBy; // still a connection if they follow you
            return {
              ...prev,
              data: { ...prev.data, follows: false, isConnection: isConn },
            };
          }
          return prev;
        },
      );
      await refetchRel();
    },
  });
  const doBlock = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await blockUser({ data: { userId } });
    },
    onSuccess: async () => {
      queryClient.setQueryData(
        relKey,
        (
          prev:
            | {
                success?: boolean;
                data?: {
                  follows?: boolean;
                  followedBy?: boolean;
                  isConnection?: boolean;
                  blocked?: boolean;
                  blockedBy?: boolean;
                };
              }
            | undefined,
        ) => {
          if (prev?.success && prev?.data) {
            return { ...prev, data: { ...prev.data, blocked: true } };
          }
          return prev;
        },
      );
      await refetchRel();
    },
  });
  const doUnblock = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await unblockUser({ data: { userId } });
    },
    onSuccess: async () => {
      queryClient.setQueryData(
        relKey,
        (
          prev:
            | {
                success?: boolean;
                data?: {
                  follows?: boolean;
                  followedBy?: boolean;
                  isConnection?: boolean;
                  blocked?: boolean;
                  blockedBy?: boolean;
                };
              }
            | undefined,
        ) => {
          if (prev?.success && prev?.data) {
            return { ...prev, data: { ...prev.data, blocked: false } };
          }
          return prev;
        },
      );
      await refetchRel();
    },
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
  const isTeammate = !!teamRelation?.areTeammates;

  // Determine what information to display based on privacy settings
  const showEmail = privacySettings?.showEmail && isTeammate;
  const showPhone = privacySettings?.showPhone && isTeammate;
  const showLocation = privacySettings?.showLocation;
  const showLanguages = privacySettings?.showLanguages;
  const showGamePreferences = privacySettings?.showGamePreferences;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <UserAvatar
            className="mb-4 h-24 w-24"
            name={profile.name ?? null}
            email={profile.email ?? null}
            srcUploaded={profile.uploadedAvatarPath ?? null}
            srcProvider={profile.image ?? null}
          />
          <CardTitle className="text-2xl">{profile.name || "Anonymous User"}</CardTitle>
          <CardDescription>{profile.pronouns && `(${profile.pronouns})`}</CardDescription>
          {/* Social actions */}
          <div className="mt-3 flex items-center gap-3">
            {/* Follow star (you → them) */}
            <Button
              variant={follows ? "default" : "outline"}
              size="sm"
              onClick={() => (follows ? doUnfollow.mutate() : doFollow.mutate())}
              disabled={blockedAny || isSelf}
              title={isSelf ? "You cannot follow yourself" : undefined}
              aria-disabled={blockedAny || isSelf}
            >
              <Star className="mr-1 h-4 w-4" />
              {isSelf ? "Follow" : follows ? "Following" : "Follow"}
            </Button>
            {/* Self profile indicator or followed-by indicator */}
            {isSelf ? (
              <Badge variant="secondary">This is your profile</Badge>
            ) : (
              followedBy && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" /> Followed by them
                </Badge>
              )
            )}
            {/* Block / Unblock */}
            <Button
              variant={blockedAny ? "destructive" : "outline"}
              size="sm"
              onClick={() => (blockedAny ? doUnblock.mutate() : doBlock.mutate())}
              disabled={isSelf}
              title={isSelf ? "You cannot block yourself" : undefined}
              aria-disabled={isSelf}
            >
              <ShieldBan className="mr-1 h-4 w-4" />
              {blockedAny ? "Unblock" : "Block"}
            </Button>
          </div>
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
