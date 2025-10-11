import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { url: 'http://localhost:5173/', prefix: 'visit' },
  { url: 'http://localhost:5173/resources', prefix: 'resources' },
  { url: 'http://localhost:5173/teams', prefix: 'teams' },
  { url: 'http://localhost:5173/about', prefix: 'about' },
  { url: 'http://localhost:5173/systems', prefix: 'systems', detailSelector: 'a[href^="/systems/"]' },
  { url: 'http://localhost:5173/events', prefix: 'events', detailSelector: 'a[href^="/events/"]' },
  { url: 'http://localhost:5173/search', prefix: 'search', detailSelector: 'a[href^="/game/"]' },
];

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function scrollAndCapture(page, destDir, prefix) {
  console.log(`  • capturing ${prefix} top`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(destDir, `${prefix}-top.png`) });

  console.log(`  • capturing ${prefix} mid`);
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(destDir, `${prefix}-mid.png`) });

  console.log(`  • capturing ${prefix} bottom`);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(destDir, `${prefix}-bottom.png`) });

  await page.evaluate(() => window.scrollTo({ top: 0 }));
}

async function capture(page, destDir, { url, prefix, detailSelector }) {
  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await scrollAndCapture(page, destDir, prefix);

  if (!detailSelector) {
    return;
  }

  const detailLinks = await page.$$eval(detailSelector, (elements) =>
    Array.from(elements)
      .map((el) => (el instanceof HTMLAnchorElement ? el.href : null))
      .filter((href, index, self) => href && self.indexOf(href) === index)
      .slice(0, 2),
  );

  for (let index = 0; index < detailLinks.length; index += 1) {
    const href = detailLinks[index];
    if (!href) continue;
    console.log(`  ↳ visiting detail ${index + 1}: ${href}`);
    try {
      await page.goto(href, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(destDir, `${prefix}-detail-${index}.png`) });
      await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }));
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(destDir, `${prefix}-detail-${index}-mid.png`) });
      await page.evaluate(() => window.scrollTo({ top: 0 }));
    } catch (error) {
      console.warn(`    ⚠️ failed to capture detail: ${href}`, error);
    }
    console.log(`  ↳ returning to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  }
}

async function main() {
  const theme = process.argv[2] === 'dark' ? 'dark' : 'light';
  const outDir = join('playwright-output', theme);
  await ensureDir(outDir);

  console.log(`Starting visual sweep in ${theme} mode → ${outDir}`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.emulateMedia({ colorScheme: theme });

  for (const entry of PAGES) {
    await capture(page, outDir, entry);
  }

  await browser.close();
  console.log('Sweep complete');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
