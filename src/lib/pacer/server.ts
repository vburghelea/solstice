/**
 * Simple server-side pacing helper for bulk tasks.
 * Processes items in batches with a delay between batches to avoid provider rate limits.
 */
export async function paceBatch<T>(
  items: T[],
  opts: { batchSize: number; delayMs: number },
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const { batchSize, delayMs } = opts;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map((item, idx) =>
        fn(item, i + idx).catch((e) => {
          // Do not throw to keep processing other items
          console.error("paceBatch item failed:", e);
        }),
      ),
    );
    if (i + batchSize < items.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
