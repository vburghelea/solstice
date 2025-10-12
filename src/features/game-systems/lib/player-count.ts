import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";

type PlayerCountSource =
  | Pick<GameSystemDetail, "minPlayers" | "maxPlayers">
  | { minPlayers?: number | null; maxPlayers?: number | null };

export const formatPlayerCountLabel = (input: PlayerCountSource): string => {
  const minPlayers = input.minPlayers ?? null;
  const maxPlayers = input.maxPlayers ?? null;

  if (minPlayers && maxPlayers) {
    return `${minPlayers}-${maxPlayers} players`;
  }

  if (minPlayers) {
    return `${minPlayers}+ players`;
  }

  if (maxPlayers) {
    return `Up to ${maxPlayers} players`;
  }

  return "Player count TBD";
};
