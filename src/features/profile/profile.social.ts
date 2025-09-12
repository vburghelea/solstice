import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import type { GMReview, UserFollow } from "./profile.types";

// Social Queries
export const getFollowers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    success: boolean;
    data?: UserFollow[];
    errors?: Array<{ code: string; message: string }>;
  }> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { userFollows } = await import("~/db/schema");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const followers = await db.query.userFollows.findMany({
        where: eq(userFollows.followingId, currentUser.id),
        orderBy: [desc(userFollows.createdAt)],
      });

      return {
        success: true,
        data: followers,
      };
    } catch (error) {
      console.error("Error fetching followers:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch followers" }],
      };
    }
  },
);

export const getFollowing = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    success: boolean;
    data?: UserFollow[];
    errors?: Array<{ code: string; message: string }>;
  }> => {
    try {
      const { getDb } = await import("~/db/server-helpers");
      const { getCurrentUser } = await import("~/features/auth/auth.queries");
      const { userFollows } = await import("~/db/schema");

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
        };
      }

      const db = await getDb();

      const following = await db.query.userFollows.findMany({
        where: eq(userFollows.followerId, currentUser.id),
        orderBy: [desc(userFollows.createdAt)],
      });

      return {
        success: true,
        data: following,
      };
    } catch (error) {
      console.error("Error fetching following:", error);
      return {
        success: false,
        errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch following" }],
      };
    }
  },
);

export const getGMReviews = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    if (
      !input ||
      typeof input !== "object" ||
      !("gmId" in input) ||
      typeof input.gmId !== "string"
    ) {
      throw new Error("Invalid input: gmId is required");
    }
    return { gmId: input.gmId };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      data?: GMReview[];
      errors?: Array<{ code: string; message: string }>;
    }> => {
      try {
        const { getDb } = await import("~/db/server-helpers");
        const { gmReviews } = await import("~/db/schema");

        const db = await getDb();

        const reviews = await db.query.gmReviews.findMany({
          where: eq(gmReviews.gmId, data.gmId),
          orderBy: [desc(gmReviews.createdAt)],
        });

        // Map database results to GMReview type
        const mappedReviews: GMReview[] = reviews.map((review) => ({
          id: review.id,
          reviewerId: review.reviewerId,
          gmId: review.gmId,
          gameId: review.gameId,
          rating: review.rating,
          selectedStrengths: review.selectedStrengths ?? [],
          ...(review.comment !== null && review.comment !== undefined
            ? { comment: review.comment }
            : {}),
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        }));

        return {
          success: true,
          data: mappedReviews,
        };
      } catch (error) {
        console.error("Error fetching GM reviews:", error);
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to fetch GM reviews" }],
        };
      }
    },
  );

// Check if current user has a GM review for a specific game
export const getMyGMReviewForGame = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    if (
      !input ||
      typeof input !== "object" ||
      !("gameId" in input) ||
      typeof input.gameId !== "string"
    ) {
      throw new Error("Invalid input: gameId is required");
    }
    return { gameId: input.gameId };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      data?: GMReview | null;
      errors?: Array<{ code: string; message: string }>;
    }> => {
      try {
        const { getCurrentUser } = await import("~/features/auth/auth.queries");
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          return {
            success: false,
            errors: [{ code: "AUTH_ERROR", message: "Not authenticated" }],
          };
        }
        const { getDb } = await import("~/db/server-helpers");
        const { gmReviews } = await import("~/db/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();

        const review = await db.query.gmReviews.findFirst({
          where: and(
            eq(gmReviews.reviewerId, currentUser.id),
            eq(gmReviews.gameId, data.gameId),
          ),
        });
        if (!review) {
          return { success: true, data: null };
        }
        const mapped: GMReview = {
          id: review.id,
          reviewerId: review.reviewerId,
          gmId: review.gmId,
          gameId: review.gameId,
          rating: review.rating,
          selectedStrengths: review.selectedStrengths ?? [],
          ...(review.comment !== null && review.comment !== undefined
            ? { comment: review.comment }
            : {}),
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
        return { success: true, data: mapped };
      } catch (error) {
        console.error("Error checking GM review for game:", error);
        return {
          success: false,
          errors: [{ code: "DATABASE_ERROR", message: "Failed to check GM review" }],
        };
      }
    },
  );

// Re-export social mutations
export {
  deleteGMReview,
  followUser,
  submitGMReview,
  unfollowUser,
} from "./social.mutations";
