import { describe, expect, it } from "vitest";
import { parseSearch, parseThing } from "~/features/game-systems/crawler/bgg";

describe("bgg connector parsers", () => {
  it("selects matching id from search results", () => {
    const xml = `
      <items total="2">
        <item id="123" type="boardgame">
          <name type="primary" value="Foo" />
        </item>
        <item id="456" type="boardgame">
          <name type="primary" value="Bar" />
        </item>
      </items>
    `;
    expect(parseSearch(xml, "Bar")).toBe(456);
  });

  it("parses thing details", () => {
    const xml = `
      <items>
        <item id="456">
          <yearpublished value="2004" />
          <link type="boardgamepublisher" id="1" value="Acme" />
          <link type="boardgamecategory" id="2" value="Fantasy" />
          <link type="boardgamemechanic" id="3" value="Dice" />
        </item>
      </items>
    `;
    expect(parseThing(xml)).toEqual({
      yearPublished: 2004,
      publishers: ["Acme"],
      categories: ["Fantasy"],
      mechanics: ["Dice"],
    });
  });
});
