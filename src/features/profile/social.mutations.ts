import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gmStrengthOptions } from "~/shared/types/common";

// Validation schemas
const followInputSchema = (input: unknown) => {
  return z
    .object({
      followingId: z.string().min(1, "Following ID is required"),
    })
    .parse(input);
};

const gmReviewInputSchema = (input: unknown) => {
  // Accept thumbs-scale rating from -2..2 and exactly 3 strengths
  // Enforce valid strength values from shared options
  return z
    .object({
      gmId: z.string().min(1, "GM ID is required"),
      gameId: z.string().min(1, "Game ID is required"),
      rating: z
        .number()
        .int()
        .gte(-2, "Rating must be between -2 and 2")
        .lte(2, "Rating must be between -2 and 2"),
      selectedStrengths: z
        .array(z.enum(gmStrengthOptions as unknown as [string, ...string[]]))
        .max(3, "Select up to 3 strengths"),
      comment: z.string().max(2000).optional(),
    })
    .parse(input);
};

// Follow a user
export const followUser = createServerFn({ method: "POST" })
  .validator(followInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return { success: false, message: "Not authenticated" };
      }

      if (data.followingId === currentUser.id) {
        return { success: false, message: "Cannot follow yourself" };
      }

      const { getDb } = await import("~/db/server-helpers");
      const { userFollows } = await import("~/db/schema");
      const db = await getDb();

      // Check if already following
      const existingFollow = await db.query.userFollows.findFirst({
        where: (follow, { eq, and }) =>
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, data.followingId),
          ),
      });

      if (existingFollow) {
        return { success: false, message: "Already following this user" };
      }

      await db.insert(userFollows).values({
        id: crypto.randomUUID(),
        followerId: currentUser.id,
        followingId: data.followingId,
      });

      return { success: true, message: "Successfully followed user" };
    } catch (error) {
      console.error("Error following user:", error);
      return { success: false, message: "Failed to follow user" };
    }
  });

// Unfollow a user
export const unfollowUser = createServerFn({ method: "POST" })
  .validator(followInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return { success: false, message: "Not authenticated" };
      }

      const { getDb } = await import("~/db/server-helpers");
      const { userFollows } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      const existingFollow = await db.query.userFollows.findFirst({
        where: (follow, { eq, and }) =>
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, data.followingId),
          ),
      });

      if (!existingFollow) {
        return { success: false, message: "Not following this user" };
      }

      await db.delete(userFollows).where(eq(userFollows.id, existingFollow.id));

      return { success: true, message: "Successfully unfollowed user" };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return { success: false, message: "Failed to unfollow user" };
    }
  });

// Submit GM review
export const submitGMReview = createServerFn({ method: "POST" })
  .validator(gmReviewInputSchema)
  .handler(async ({ data }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return { success: false, message: "Not authenticated" };
      }

      if (data.gmId === currentUser.id) {
        return { success: false, message: "Cannot review yourself" };
      }

      const { getDb } = await import("~/db/server-helpers");
      const { gmReviews, user, games, gameParticipants } = await import("~/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();

      // Validate game exists and is completed
      const game = await db.query.games.findFirst({ where: eq(games.id, data.gameId) });
      if (!game) {
        return { success: false, message: "Game not found" };
      }
      if (game.status !== "completed") {
        return { success: false, message: "Reviews are available after game completion" };
      }

      // Validate GM matches game owner
      if (game.ownerId !== data.gmId) {
        return { success: false, message: "Invalid GM for this game" };
      }

      // Validate reviewer participated (approved) in this specific game
      const participant = await db.query.gameParticipants.findFirst({
        where: and(
          eq(gameParticipants.gameId, data.gameId),
          eq(gameParticipants.userId, currentUser.id),
          eq(gameParticipants.status, "approved"),
        ),
      });
      if (!participant) {
        return { success: false, message: "Only confirmed participants can review" };
      }

      // Check if user has already reviewed this GM for this game
      const existingReview = await db.query.gmReviews.findFirst({
        where: and(
          eq(gmReviews.reviewerId, currentUser.id),
          eq(gmReviews.gameId, data.gameId),
        ),
      });

      if (existingReview) {
        return { success: false, message: "You already reviewed this session" };
      }

      // Verify the GM exists and is actually a GM
      const gmUser = await db.query.user.findFirst({
        where: eq(user.id, data.gmId),
      });

      if (!gmUser || !gmUser.isGM) {
        return { success: false, message: "User is not a GM" };
      }

      // Map thumbs rating (-2..2) to stored 1..5 scale
      const storedRating = data.rating + 3; // -2→1, -1→2, 0→3, 1→4, 2→5

      await db.insert(gmReviews).values({
        id: crypto.randomUUID(),
        reviewerId: currentUser.id,
        gmId: data.gmId,
        gameId: data.gameId,
        rating: storedRating,
        selectedStrengths: data.selectedStrengths,
        comment: data.comment || null,
      });

      // Update GM's rating average (store to 1 decimal place)
      const gmReviewsResult = await db.query.gmReviews.findMany({
        where: eq(gmReviews.gmId, data.gmId),
      });

      const averageRating =
        gmReviewsResult.length > 0
          ? gmReviewsResult.reduce((sum, review) => sum + review.rating, 0) /
            gmReviewsResult.length
          : 0;

      await db
        .update(user)
        .set({
          // Persist to one decimal place using standard rounding (e.g., 4.45 -> 4.5)
          gmRating: Math.round(averageRating * 10) / 10,
        })
        .where(eq(user.id, data.gmId));

      return { success: true, message: "Review submitted successfully" };
    } catch (error) {
      console.error("Error submitting GM review:", error);
      return { success: false, message: "Failed to submit review" };
    }
  });

// Delete GM review
export const deleteGMReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ reviewId: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; message?: string }> => {
    try {
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return { success: false, message: "Not authenticated" };
      }

      const { getDb } = await import("~/db/server-helpers");
      const { gmReviews, user } = await import("~/db/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();

      // Get the review to find the GM ID
      const review = await db.query.gmReviews.findFirst({
        where: and(
          eq(gmReviews.id, data.reviewId),
          eq(gmReviews.reviewerId, currentUser.id),
        ),
      });

      if (!review) {
        return { success: false, message: "Review not found or not authorized" };
      }

      // Delete the review
      await db.delete(gmReviews).where(eq(gmReviews.id, data.reviewId));

      // Update GM's rating average (store to 1 decimal place)
      const gmReviewsResult = await db.query.gmReviews.findMany({
        where: eq(gmReviews.gmId, review.gmId),
      });

      const averageRating =
        gmReviewsResult.length > 0
          ? gmReviewsResult.reduce((sum, review) => sum + review.rating, 0) /
            gmReviewsResult.length
          : 0;

      await db
        .update(user)
        .set({
          gmRating: Math.round(averageRating * 10) / 10,
        })
        .where(eq(user.id, review.gmId));

      return { success: true, message: "Review deleted successfully" };
    } catch (error) {
      console.error("Error deleting GM review:", error);
      return { success: false, message: "Failed to delete review" };
    }
  });
