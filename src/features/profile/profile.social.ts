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

// Re-export social mutations
export {
  deleteGMReview,
  followUser,
  submitGMReview,
  unfollowUser,
} from "./social.mutations";
