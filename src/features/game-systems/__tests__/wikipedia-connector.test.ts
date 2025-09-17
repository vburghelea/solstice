import { describe, expect, it } from "vitest";
import {
  extractInfobox,
  parsePublisherNames,
  parseReleaseDate,
  stripWikiMarkup,
} from "~/features/game-systems/crawler/wikipedia";

describe("wikipedia connector helpers", () => {
  it("strips wiki markup", () => {
    const raw = "[[Wizards of the Coast]]<ref>citation</ref><br />{{cn}}";
    expect(stripWikiMarkup(raw)).toBe("Wizards of the Coast");
  });

  it("parses publisher list", () => {
    const raw = "[[Wizards of the Coast]]<br/>TSR, \n[[Paizo Publishing]]";
    expect(parsePublisherNames(raw)).toEqual([
      "Wizards of the Coast",
      "TSR",
      "Paizo Publishing",
    ]);
  });

  it("parses release date with month and day", () => {
    const raw = "{{start date|df=yes|1997|03|15}}";
    const release = parseReleaseDate(raw);
    expect(release).toBeTruthy();
    expect(release?.toISOString()).toBe("1997-03-15T00:00:00.000Z");
  });

  it("parses release date fallback to year", () => {
    const raw = "1994";
    const release = parseReleaseDate(raw);
    expect(release?.toISOString()).toBe("1994-01-01T00:00:00.000Z");
  });

  it("extracts infobox fields", () => {
    const wikitext = `| release_date = {{start date|1997|05|01}}\n| publisher = [[Wizards of the Coast]]<br/>TSR\n`;
    const infobox = extractInfobox(wikitext);
    expect(infobox.releaseDate?.toISOString()).toBe("1997-05-01T00:00:00.000Z");
    expect(infobox.publisherNames).toEqual(["Wizards of the Coast", "TSR"]);
  });
});
