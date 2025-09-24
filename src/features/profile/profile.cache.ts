import type { QueryClient, QueryKey } from "@tanstack/react-query";

const STATIC_PROFILE_QUERY_KEYS: QueryKey[] = [
  ["userProfile"],
  ["users"],
  ["user"],
  ["currentUser"],
  ["teams"],
  ["teamMembers"],
];

export async function invalidateProfileCaches(
  queryClient: QueryClient,
  userId?: string,
): Promise<void> {
  const dynamicKeys: QueryKey[] = [];

  if (userId) {
    dynamicKeys.push(["userProfile", userId], ["users", userId]);
  }

  await Promise.all(
    [...STATIC_PROFILE_QUERY_KEYS, ...dynamicKeys].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
