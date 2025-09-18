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
    const nextData = JSON.stringify({
      props: {
        pageProps: {
          initialCache: {
            "SeoPage:test": {
              __typename: "SeoPage",
              heroSection: {
                __typename: "SeoPageHeroSection",
                title: "Dungeons & Dragons 5e",
                descriptionPrimary: "Fantasy roleplaying game",
                image: "https://img.example/hero.jpg",
                metadata: [
                  {
                    __typename: "SeoPageHeroSectionMetadata",
                    title: "Details",
                    items: [
                      {
                        __typename: "SeoPageHeroSectionMetadataItem",
                        text: "2-6 Players",
                        url: null,
                      },
                    ],
                  },
                  {
                    __typename: "SeoPageHeroSectionMetadata",
                    title: "Themes",
                    items: [
                      {
                        __typename: "SeoPageHeroSectionMetadataItem",
                        text: "High Fantasy",
                        url: "https://example.com/high-fantasy",
                      },
                    ],
                  },
                  {
                    __typename: "SeoPageHeroSectionMetadata",
                    title: "Publisher",
                    items: [
                      {
                        __typename: "SeoPageHeroSectionMetadataItem",
                        text: "Wizards of the Coast",
                        url: "https://wizards.com",
                      },
                    ],
                  },
                  {
                    __typename: "SeoPageHeroSectionMetadata",
                    title: "Release Date",
                    items: [
                      {
                        __typename: "SeoPageHeroSectionMetadataItem",
                        text: "2014",
                        url: null,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    });
    const html = `
      <script id="__NEXT_DATA__" type="application/json">${nextData}</script>
      <span class="tag">d20</span>
      <div class="themes">
        <div>Themes</div>
        <a href="https://example.com/d20">d20</a>
        <span>Themes</span>
      </div>
      <div class="description">fallback description</div>
      <a class="publisher" href="https://alt.example">Alt Publisher</a>
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
      tags: ["High Fantasy", "d20"],
      publisherUrl: "https://wizards.com/",
      publisherName: "Wizards of the Coast",
      releaseYear: 2014,
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
