import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Validation schemas
const followInputSchema = (input: unknown) => {
  return z
    .object({
      followingId: z.string().min(1, "Following ID is required"),
    })
    .parse(input);
};

const gmReviewInputSchema = (input: unknown) => {
  return z
    .object({
      gmId: z.string().min(1, "GM ID is required"),
      rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
      selectedStrengths: z
        .array(z.string())
        .min(1, "Select at least 1 strength")
        .max(3, "Select at most 3 strengths"),
      comment: z.string().optional(),
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
      const { gmReviews, user } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      // Check if user has already reviewed this GM
      const existingReview = await db.query.gmReviews.findFirst({
        where: (review, { eq, and }) =>
          and(eq(review.reviewerId, currentUser.id), eq(review.gmId, data.gmId)),
      });

      if (existingReview) {
        return { success: false, message: "Already reviewed this GM" };
      }

      // Verify the GM exists and is actually a GM
      const gmUser = await db.query.user.findFirst({
        where: eq(user.id, data.gmId),
      });

      if (!gmUser || !gmUser.isGM) {
        return { success: false, message: "User is not a GM" };
      }

      await db.insert(gmReviews).values({
        id: crypto.randomUUID(),
        reviewerId: currentUser.id,
        gmId: data.gmId,
        rating: data.rating,
        selectedStrengths: data.selectedStrengths,
        comment: data.comment || null,
      });

      // Update GM's rating average
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
          gmRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
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

      // Update GM's rating average
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
