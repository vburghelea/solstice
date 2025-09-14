import { describe, expect, it } from "vitest";
import { buildCampaignDigestItemsHtml } from "../campaign-digest";

describe("buildCampaignDigestItemsHtml", () => {
  it("escapes item fields", () => {
    const html = buildCampaignDigestItemsHtml([
      {
        name: "Name <script>",
        dateTime: "Jan 1 <2025>",
        location: "Town & Country",
        url: "https://example.com/?a=1&b=2",
      },
    ]);

    expect(html).not.toContain("<script>");
    expect(html).toContain("Name &lt;script&gt;");
    expect(html).toContain("Jan 1 &lt;2025&gt;");
    expect(html).toContain("Town &amp; Country");
    expect(html).toContain("https://example.com/?a=1&amp;b=2");
  });
});
