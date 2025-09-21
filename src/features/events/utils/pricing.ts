import type { Event as DbEvent } from "~/db/schema";

/**
 * Calculate the registration amount in cents for a given event/registration type.
 * Applies early-bird discounts when eligible and handles zero/negative pricing.
 */
export function calculateRegistrationAmountCents(
  event: DbEvent,
  registrationType: "team" | "individual",
  now: Date,
): number {
  const baseFee =
    registrationType === "team"
      ? (event.teamRegistrationFee ?? 0)
      : (event.individualRegistrationFee ?? 0);

  if (!baseFee || baseFee <= 0) {
    return 0;
  }

  const discountPercentage = event.earlyBirdDiscount ?? 0;
  const deadline = event.earlyBirdDeadline ? new Date(event.earlyBirdDeadline) : null;

  if (discountPercentage > 0 && deadline && now <= deadline) {
    const clampedDiscount = Math.min(100, Math.max(0, discountPercentage));
    const discounted = Math.round(baseFee - (baseFee * clampedDiscount) / 100);
    return Math.max(0, discounted);
  }

  return baseFee;
}
