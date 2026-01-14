import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export async function checkA11y(page: Page) {
  type AxeViolation = {
    id: string;
    help: string;
    nodes: Array<{ target: string[]; failureSummary: string }>;
  };

  const results = (await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()) as { violations: AxeViolation[] };

  if (results.violations.length) {
    const messages = results.violations.map((violation) => {
      const nodes = violation.nodes
        .map((node) => `${node.target.join(" ")}: ${node.failureSummary}`)
        .join("; ");
      return `${violation.id}: ${violation.help} (${nodes})`;
    });
    throw new Error(`Accessibility violations:\n${messages.join("\n")}`);
  }
}
