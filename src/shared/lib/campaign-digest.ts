export type CampaignDigestItem = {
  name: string;
  dateTime: string;
  location: string;
  url: string;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildCampaignDigestItemsHtml(items: CampaignDigestItem[]): string {
  return items
    .map((item) => {
      const name = escapeHtml(item.name);
      const dateTime = escapeHtml(item.dateTime);
      const location = escapeHtml(item.location);
      const url = escapeHtml(item.url);
      return [
        '<div style="margin:12px 0;padding:12px;border-radius:8px;',
        'background:#f3f4f6">',
        `<div style="font-weight:600">${name}</div>`,
        `<div style="font-size:12px;color:#4b5563">${dateTime} • ${location}</div>`,
        '<div style="margin-top:6px">',
        `<a href="${url}" style="color:#10b981;text-decoration:none">Details</a>`,
        "</div></div>",
      ].join("");
    })
    .join("\n");
}
