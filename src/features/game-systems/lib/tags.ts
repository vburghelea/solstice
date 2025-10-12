import type { GameSystemTag } from "~/features/game-systems/game-systems.types";

export interface TagRowLike {
  id: number | null;
  name: string | null;
  description: string | null;
}

export const mapTagRow = (row: TagRowLike): GameSystemTag | null => {
  if (row.id == null || !row.name) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
  };
};

export const mapTagRows = (rows: TagRowLike[]): GameSystemTag[] => {
  const mapped: GameSystemTag[] = [];

  for (const row of rows) {
    const tag = mapTagRow(row);
    if (tag) {
      mapped.push(tag);
    }
  }

  return mapped;
};

interface TagRowWithSystem extends TagRowLike {
  systemId: number;
}

export const mapTagRowsBySystem = (
  rows: TagRowWithSystem[],
): Map<number, GameSystemTag[]> => {
  const map = new Map<number, GameSystemTag[]>();

  for (const row of rows) {
    const tag = mapTagRow(row);
    if (!tag) continue;

    const existing = map.get(row.systemId);
    if (existing) {
      existing.push(tag);
    } else {
      map.set(row.systemId, [tag]);
    }
  }

  return map;
};
