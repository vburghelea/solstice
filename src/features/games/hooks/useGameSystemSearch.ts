import { useMemo, useState } from "react";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { searchGameSystems } from "~/features/games/games.queries";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import { useDebounce } from "~/shared/hooks/useDebounce";

type GameSystemSearchResult = {
  id: number;
  name: string;
  averagePlayTime: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
};

type UseGameSystemSearchOptions = {
  enabled?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
};

type UseGameSystemSearchResult = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  results: GameSystemSearchResult[];
  options: Array<{ value: string; label: string }>;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: UseQueryResult<GameSystemSearchResult[], Error>["refetch"];
};

export function useGameSystemSearch({
  enabled = true,
  minSearchLength = 3,
  debounceMs = 500,
}: UseGameSystemSearchOptions = {}): UseGameSystemSearchResult {
  const { t } = useGamesTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  const normalizedSearch = debouncedSearchTerm.trim();
  const queryEnabled = enabled && normalizedSearch.length >= Math.max(1, minSearchLength);

  const queryResult = useQuery<GameSystemSearchResult[], Error>({
    queryKey: ["searchGameSystems", normalizedSearch],
    queryFn: async () => {
      const result = await searchGameSystems({
        data: { query: normalizedSearch },
      });

      if (!result.success) {
        throw new Error(result.errors?.[0]?.message ?? t("errors.search_failed"));
      }

      return result.data;
    },
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const systems = useMemo(
    () => (queryResult.data ?? []) as GameSystemSearchResult[],
    [queryResult.data],
  );
  const { isPending, isFetching, isError, error, refetch } = queryResult;

  const options = useMemo(
    () =>
      systems.map((system) => ({
        value: system.id.toString(),
        label: system.name,
      })),
    [systems],
  );

  return {
    searchTerm,
    setSearchTerm,
    results: systems,
    options,
    isLoading: queryEnabled ? isPending : false,
    isFetching,
    isError,
    error: isError ? (error ?? new Error(t("errors.unknown_error"))) : null,
    refetch,
  };
}
