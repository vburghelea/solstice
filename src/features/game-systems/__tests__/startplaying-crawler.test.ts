import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import {
  parseDetailPage,
  parseIndexPage,
  partitionTags,
  type TagMaps,
} from "~/features/game-systems/crawler/startplaying";

describe("startplaying crawler parsers", () => {
  it("collects system links from index page", () => {
    const html = `
      <a href="/play/game-system/dnd">D&D</a>
      <a href="/play/game-system/pf2">PF2</a>
    `;
    const $ = load(html);
    expect(parseIndexPage($)).toEqual([
      "https://startplaying.games/play/game-system/dnd",
      "https://startplaying.games/play/game-system/pf2",
    ]);
  });

  it("parses system detail fields", () => {
    const html = `
      <h1>Dungeons & Dragons 5e</h1>
      <div class="description">Fantasy roleplaying game</div>
      <div class="players">2 - 6 Players</div>
      <img src="https://img.example/hero.jpg" />
      <a class="publisher" href="https://wizards.com">Wizards</a>
      <span class="tag">Fantasy</span>
      <span class="tag">d20</span>
    `;
    const $ = load(html);
    const detail = parseDetailPage(
      $,
      "https://startplaying.games/play/game-system/dnd5e",
    );
    expect(detail).toEqual({
      slug: "dnd5e",
      name: "Dungeons & Dragons 5e",
      description: "Fantasy roleplaying game",
      minPlayers: 2,
      maxPlayers: 6,
      imageUrls: ["https://img.example/hero.jpg"],
      tags: ["Fantasy", "d20"],
      publisherUrl: "https://wizards.com",
    });
  });
});

describe("partitionTags", () => {
  it("maps known tags and counts unknown", () => {
    const maps: TagMaps = {
      categories: { fantasy: 1 },
      mechanics: { d20: 2 },
    };
    const result = partitionTags(["Fantasy", "d20", "Horror"], maps);
    expect(result.categoryIds).toEqual([1]);
    expect(result.mechanicIds).toEqual([2]);
    expect(result.unmapped).toEqual({ horror: 1 });
  });
});
