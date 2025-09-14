export function ThumbsScore({
  value,
  className,
}: {
  value?: number | null;
  className?: string;
}) {
  if (value == null) {
    return <span className={className}>No ratings yet</span>;
  }
  const clamped = Math.max(1, Math.min(5, Number(value)));
  // Ceiling to 1 decimal place for display (e.g., 4.41 -> 4.5)
  const display = Math.ceil(clamped * 10) / 10;
  // Choose a thumb glyph by rounding to nearest whole step
  const idx = Math.round(clamped) - 1;
  const thumbs = ["👎👎", "👎", "👌", "👍", "👍👍"][idx];
  return (
    <span
      className={className}
      aria-label={`GM rating ${display.toFixed(1)}/5`}
      title={`${display.toFixed(1)}/5`}
    >
      {thumbs}{" "}
      <span className="text-muted-foreground align-middle text-xs">
        {display.toFixed(1)}/5
      </span>
    </span>
  );
}
