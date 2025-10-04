export function formatPrice(price: number | null | undefined): string {
  if (price == null || price === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function buildPlayersRange(
  minPlayers: number | null | undefined,
  maxPlayers: number | null | undefined,
  options?: { fallback?: string | null },
): string | null {
  const fallback = options?.fallback ?? "Player count TBD";

  if (minPlayers && maxPlayers) {
    return `${minPlayers}-${maxPlayers} players`;
  }

  if (minPlayers) {
    return `${minPlayers}+ players`;
  }

  if (maxPlayers) {
    return `Up to ${maxPlayers} players`;
  }

  return fallback;
}

export function formatExpectedDuration(
  duration: number | null | undefined,
): string | null {
  if (duration == null) {
    return null;
  }

  const totalMinutes = Math.round(duration);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}
