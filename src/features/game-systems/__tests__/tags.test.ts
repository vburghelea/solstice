import { describe, expect, it } from "vitest";

import { mapTagRow, mapTagRows, mapTagRowsBySystem } from "../lib/tags";

describe("tag mapping helpers", () => {
  it("mapTagRow filters out missing identifiers", () => {
    expect(mapTagRow({ id: null, name: "Strategy", description: "desc" })).toBeNull();
    expect(mapTagRow({ id: 1, name: "", description: null })).toBeNull();
  });

  it("mapTagRows returns only valid tags", () => {
    expect(
      mapTagRows([
        { id: 1, name: "Strategy", description: "desc" },
        { id: null, name: "Family", description: null },
        { id: 2, name: "Family", description: null },
      ]),
    ).toEqual([
      { id: 1, name: "Strategy", description: "desc" },
      { id: 2, name: "Family", description: null },
    ]);
  });

  it("mapTagRowsBySystem groups tags by system and preserves order", () => {
    const map = mapTagRowsBySystem([
      { systemId: 1, id: 1, name: "Strategy", description: "desc" },
      { systemId: 2, id: 2, name: "Family", description: null },
      { systemId: 1, id: 3, name: "Cooperative", description: null },
      { systemId: 1, id: null, name: "Invalid", description: null },
    ]);

    expect(map.get(1)).toEqual([
      { id: 1, name: "Strategy", description: "desc" },
      { id: 3, name: "Cooperative", description: null },
    ]);
    expect(map.get(2)).toEqual([{ id: 2, name: "Family", description: null }]);
  });
});
