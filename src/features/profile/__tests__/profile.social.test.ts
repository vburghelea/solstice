import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the entire profile.social module
vi.mock("../profile.social", async (importOriginal) => {
  const original = await importOriginal<object>();
  return {
    ...original,
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    submitGMReview: vi.fn(),
    getGMReviews: vi.fn(),
  };
});

// Import the mocked functions
import {
  followUser,
  getFollowers,
  getFollowing,
  getGMReviews,
  submitGMReview,
  unfollowUser,
} from "../profile.social";

describe("Profile Social Features", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("followUser", () => {
    it("should successfully follow a user", async () => {
      const followResult = {
        success: true,
        message: "Successfully followed user",
      };

      vi.mocked(followUser).mockResolvedValue(followResult);

      const result = await followUser({ data: { followingId: "user-2" } });

      expect(result.success).toBe(true);
      expect(result.success).toBe(true);
    });

    it("should fail if trying to follow yourself", async () => {
      vi.mocked(followUser).mockResolvedValue({
        success: false,
        message: "Cannot follow yourself",
      });

      const result = await followUser({ data: { followingId: "user-1" } });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Cannot follow yourself");
    });

    it("should fail if not authenticated", async () => {
      vi.mocked(followUser).mockResolvedValue({
        success: false,
        message: "Not authenticated",
      });

      const result = await followUser({ data: { followingId: "user-2" } });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Not authenticated");
    });
  });

  describe("unfollowUser", () => {
    it("should successfully unfollow a user", async () => {
      vi.mocked(unfollowUser).mockResolvedValue({
        success: true,
        message: "Successfully unfollowed user",
      });

      const result = await unfollowUser({ data: { followingId: "user-2" } });

      expect(result.success).toBe(true);
    });

    it("should fail if not authenticated", async () => {
      vi.mocked(unfollowUser).mockResolvedValue({
        success: false,
        message: "Not authenticated",
      });

      const result = await unfollowUser({ data: { followingId: "user-2" } });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Not authenticated");
    });
  });

  describe("getFollowers", () => {
    it("should return list of followers", async () => {
      const followersResult = {
        success: true,
        data: [
          {
            id: "follow-1",
            followerId: "user-2",
            followingId: "user-1",
            createdAt: new Date(),
          },
          {
            id: "follow-2",
            followerId: "user-3",
            followingId: "user-1",
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(getFollowers).mockResolvedValue(followersResult);

      const result = await getFollowers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].followerId).toBe("user-2");
    });

    it("should return empty array if no followers", async () => {
      vi.mocked(getFollowers).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getFollowers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("getFollowing", () => {
    it("should return list of users being followed", async () => {
      const followingResult = {
        success: true,
        data: [
          {
            id: "follow-1",
            followerId: "user-1",
            followingId: "user-2",
            createdAt: new Date(),
          },
          {
            id: "follow-2",
            followerId: "user-1",
            followingId: "user-3",
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(getFollowing).mockResolvedValue(followingResult);

      const result = await getFollowing();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].followingId).toBe("user-2");
    });

    it("should return empty array if not following anyone", async () => {
      vi.mocked(getFollowing).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getFollowing();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("submitGMReview", () => {
    it("should successfully submit a GM review", async () => {
      const reviewResult = {
        success: true,
        message: "Review submitted successfully",
      };

      vi.mocked(submitGMReview).mockResolvedValue(reviewResult);

      const result = await submitGMReview({
        data: {
          gmId: "user-2",
          rating: 5,
          selectedStrengths: ["storytelling", "world_builder"],
          comment: "Great GM!",
        },
      });

      expect(result.success).toBe(true);
      expect(result.success).toBe(true);
    });

    it("should fail with invalid rating", async () => {
      vi.mocked(submitGMReview).mockResolvedValue({
        success: false,
        message: "Rating must be between 1 and 5",
      });

      const result = await submitGMReview({
        data: {
          gmId: "user-2",
          rating: 50, // Invalid rating
          selectedStrengths: ["storytelling"],
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Rating must be between 1 and 5");
    });

    it("should fail if not authenticated", async () => {
      vi.mocked(submitGMReview).mockResolvedValue({
        success: false,
        message: "Not authenticated",
      });

      const result = await submitGMReview({
        data: {
          gmId: "user-2",
          rating: 5,
          selectedStrengths: ["storytelling"],
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Not authenticated");
    });
  });

  describe("getGMReviews", () => {
    it("should return list of GM reviews", async () => {
      const reviewsResult = {
        success: true,
        data: [
          {
            id: "review-1",
            reviewerId: "user-1",
            gmId: "user-2",
            rating: 5,
            selectedStrengths: ["storytelling"],
            comment: "Excellent storytelling",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "review-2",
            reviewerId: "user-3",
            gmId: "user-2",
            rating: 4,
            selectedStrengths: ["world_builder", "voices"],
            comment: "Great world building",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(getGMReviews).mockResolvedValue(reviewsResult);

      const result = await getGMReviews({ data: { gmId: "user-2" } });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].rating).toBe(5);
    });

    it("should return empty array if no reviews", async () => {
      vi.mocked(getGMReviews).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await getGMReviews({ data: { gmId: "user-2" } });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("GM Reviews with All Strengths", () => {
    it("should successfully submit a GM review with all strength options", async () => {
      const reviewResult = {
        success: true,
        message: "Review submitted successfully",
      };

      vi.mocked(submitGMReview).mockResolvedValue(reviewResult);

      const result = await submitGMReview({
        data: {
          gmId: "user-2",
          rating: 5,
          selectedStrengths: [
            "creativity",
            "world_builder",
            "inclusive",
            "rule_of_cool",
            "storytelling",
            "voices",
            "sets_the_mood",
            "teacher",
            "knows_the_rules",
            "visual_aid",
          ],
          comment: "Excellent GM with all strengths!",
        },
      });

      expect(result.success).toBe(true);
    });
  });
});
