import { useEffect } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MOCK_GAME_SYSTEM_DND5E,
  MOCK_GAME_SYSTEM_PATHFINDER2E,
} from "~/tests/mocks/game-systems";
import { render, waitFor } from "~/tests/utils";

import { useGameSystemSearch } from "../useGameSystemSearch";

import * as gamesQueries from "~/features/games/games.queries";

// Make debounce immediate for predictable tests
vi.mock("~/shared/hooks/useDebounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));

describe("useGameSystemSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("avoids triggering the search when the query is shorter than the minimum length", async () => {
    const searchMock = vi
      .spyOn(gamesQueries, "searchGameSystems")
      .mockResolvedValue({ success: true, data: [] });

    function Harness({ term }: { term: string }) {
      const { setSearchTerm } = useGameSystemSearch({ minSearchLength: 3 });

      useEffect(() => {
        setSearchTerm(term);
      }, [term, setSearchTerm]);

      return null;
    }

    const { rerender } = render(<Harness term="ab" />);

    await waitFor(() => {
      expect(searchMock).not.toHaveBeenCalled();
    });

    rerender(<Harness term="abcd" />);

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("returns mapped options when the search succeeds", async () => {
    vi.spyOn(gamesQueries, "searchGameSystems").mockResolvedValue({
      success: true,
      data: [MOCK_GAME_SYSTEM_DND5E, MOCK_GAME_SYSTEM_PATHFINDER2E].map((system) => ({
        id: system.id,
        name: system.name,
        averagePlayTime: system.averagePlayTime,
        minPlayers: system.minPlayers,
        maxPlayers: system.maxPlayers,
      })),
    });

    const onUpdate = vi.fn();

    function Harness({ term }: { term: string }) {
      const { setSearchTerm, options, results, isLoading } = useGameSystemSearch({
        minSearchLength: 3,
      });

      useEffect(() => {
        setSearchTerm(term);
      }, [term, setSearchTerm]);

      useEffect(() => {
        onUpdate({ options, results, isLoading });
      }, [options, results, isLoading]);

      return null;
    }

    const { rerender } = render(<Harness term="" />);

    rerender(<Harness term="dnd" />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        options: [
          {
            value: MOCK_GAME_SYSTEM_DND5E.id.toString(),
            label: MOCK_GAME_SYSTEM_DND5E.name,
          },
          {
            value: MOCK_GAME_SYSTEM_PATHFINDER2E.id.toString(),
            label: MOCK_GAME_SYSTEM_PATHFINDER2E.name,
          },
        ],
        results: [
          {
            id: MOCK_GAME_SYSTEM_DND5E.id,
            name: MOCK_GAME_SYSTEM_DND5E.name,
            averagePlayTime: MOCK_GAME_SYSTEM_DND5E.averagePlayTime,
            minPlayers: MOCK_GAME_SYSTEM_DND5E.minPlayers,
            maxPlayers: MOCK_GAME_SYSTEM_DND5E.maxPlayers,
          },
          {
            id: MOCK_GAME_SYSTEM_PATHFINDER2E.id,
            name: MOCK_GAME_SYSTEM_PATHFINDER2E.name,
            averagePlayTime: MOCK_GAME_SYSTEM_PATHFINDER2E.averagePlayTime,
            minPlayers: MOCK_GAME_SYSTEM_PATHFINDER2E.minPlayers,
            maxPlayers: MOCK_GAME_SYSTEM_PATHFINDER2E.maxPlayers,
          },
        ],
        isLoading: false,
      });
    });
  });
});
