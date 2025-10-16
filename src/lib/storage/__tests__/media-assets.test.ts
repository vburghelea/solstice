import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAllMediaAssets,
  deleteMediaAssetsFromStorage,
  deleteNonModeratedMediaAssets,
  hasModeratedMediaAssets,
  uploadGameSystemMediaFromUrl,
} from "../media-assets";

// Mock fetch
global.fetch = vi.fn();

// Mock cloudinary utilities
vi.mock("../cloudinary", () => ({
  deleteImage: vi.fn(),
  computeChecksum: vi.fn((data) => "mock_checksum_" + data.toString().slice(0, 10)),
}));

// Mock Cloudinary upload
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(async (data, options) => ({
        public_id: options.public_id || "test_public_id",
        secure_url: "https://cloudinary.com/test/image.jpg",
        width: 800,
        height: 600,
        format: "jpg",
      })),
    },
  },
}));

// Mock database
const mockDb = {
  query: {
    gameSystems: {
      findFirst: vi.fn(),
    },
    mediaAssets: {
      findMany: vi.fn(),
    },
  },
  delete: vi.fn(),
};

describe("media-assets utility", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to keep test output clean
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore only console methods, not other mocks
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("deleteMediaAssetsFromStorage", () => {
    it("deletes assets from both Cloudinary and database", async () => {
      const { deleteImage } = await import("../cloudinary");
      const mockDeleteImage = vi.mocked(deleteImage);
      mockDeleteImage.mockResolvedValue(undefined);

      const mockAssets = [
        { id: 1, publicId: "asset1" },
        { id: 2, publicId: "asset2" },
      ];

      mockDb.query.mediaAssets.findMany.mockResolvedValue(mockAssets);
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

      await deleteMediaAssetsFromStorage(mockDb as never, 123);

      expect(mockDeleteImage).toHaveBeenCalledTimes(2);
      expect(mockDeleteImage).toHaveBeenCalledWith("asset1");
      expect(mockDeleteImage).toHaveBeenCalledWith("asset2");
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it("handles empty assets list gracefully", async () => {
      mockDb.query.mediaAssets.findMany.mockResolvedValue([]);

      await deleteMediaAssetsFromStorage(mockDb as never, 123);

      const { deleteImage } = await import("../cloudinary");
      expect(vi.mocked(deleteImage)).not.toHaveBeenCalled();
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it("continues database deletion even if Cloudinary fails", async () => {
      const { deleteImage } = await import("../cloudinary");
      const mockDeleteImage = vi.mocked(deleteImage);
      mockDeleteImage.mockRejectedValue(new Error("Cloudinary error"));

      const mockAssets = [{ id: 1, publicId: "asset1" }];

      mockDb.query.mediaAssets.findMany.mockResolvedValue(mockAssets);
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

      await deleteMediaAssetsFromStorage(mockDb as never, 123);

      expect(mockDeleteImage).toHaveBeenCalledWith("asset1");
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("uploadGameSystemMediaFromUrl", () => {
    const mockGameSystem = {
      name: "Test Game System",
      slug: "test-game-system",
      sourceOfTruth: "bgg",
    };

    it("uploads image from URL with proper metadata", async () => {
      mockDb.query.gameSystems.findFirst.mockResolvedValue(mockGameSystem);

      const mockImageData = new ArrayBuffer(1000);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageData),
      } as Response);

      const result = await uploadGameSystemMediaFromUrl(
        "https://example.com/image.jpg",
        {
          type: "hero",
          gameSystemId: 123,
          source: "bgg",
          moderated: false,
          license: "Test License",
          licenseUrl: "https://example.com/license",
        },
        mockDb as never,
      );

      expect(result).toEqual({
        publicId: expect.stringContaining("hero_test-game-system_"),
        secureUrl: "https://cloudinary.com/test/image.jpg",
        width: 800,
        height: 600,
        format: "jpg",
        checksum: expect.stringMatching(/mock_checksum_/),
        kind: "hero",
        moderated: false,
        gameSystemId: 123,
        source: "bgg",
        license: "Test License",
        licenseUrl: "https://example.com/license",
        originalUrl: "https://example.com/image.jpg",
      });

      expect(fetch).toHaveBeenCalledWith("https://example.com/image.jpg", {
        headers: {
          "User-Agent": "SolsticeGameCrawler/1.0",
          Accept: "image/*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://boardgamegeek.com/",
        },
      });
      expect(mockDb.query.gameSystems.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        columns: { name: true, slug: true, sourceOfTruth: true },
      });
    });

    it("throws error when game system not found", async () => {
      mockDb.query.gameSystems.findFirst.mockResolvedValue(null);

      await expect(
        uploadGameSystemMediaFromUrl(
          "https://example.com/image.jpg",
          {
            type: "hero",
            gameSystemId: 999,
            source: "bgg",
          },
          mockDb as never,
        ),
      ).rejects.toThrow("Game system with ID 999 not found");
    });

    it("handles HTTP error responses", async () => {
      mockDb.query.gameSystems.findFirst.mockResolvedValue(mockGameSystem);

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(
        uploadGameSystemMediaFromUrl(
          "https://example.com/notfound.jpg",
          {
            type: "hero",
            gameSystemId: 123,
            source: "bgg",
          },
          mockDb as never,
        ),
      ).rejects.toThrow(
        "Failed to fetch image from https://example.com/notfound.jpg: 404 Not Found",
      );
    });

    it("handles network errors", async () => {
      mockDb.query.gameSystems.findFirst.mockResolvedValue(mockGameSystem);

      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(
        uploadGameSystemMediaFromUrl(
          "https://example.com/image.jpg",
          {
            type: "hero",
            gameSystemId: 123,
            source: "bgg",
          },
          mockDb as never,
        ),
      ).rejects.toThrow();
    });
  });

  describe("deleteNonModeratedMediaAssets", () => {
    it("calls deleteMediaAssetsFromStorage with correct filter", async () => {
      const { deleteImage } = await import("../cloudinary");
      vi.mocked(deleteImage).mockResolvedValue(undefined);

      const mockAssets = [{ id: 1, publicId: "non_moderated_asset" }];

      mockDb.query.mediaAssets.findMany.mockResolvedValue(mockAssets);
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

      await deleteNonModeratedMediaAssets(mockDb as never, 123);

      expect(mockDb.query.mediaAssets.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        columns: { id: true, publicId: true },
      });
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("deleteAllMediaAssets", () => {
    it("calls deleteMediaAssetsFromStorage without filter", async () => {
      const { deleteImage } = await import("../cloudinary");
      vi.mocked(deleteImage).mockResolvedValue(undefined);

      const mockAssets = [{ id: 1, publicId: "any_asset" }];

      mockDb.query.mediaAssets.findMany.mockResolvedValue(mockAssets);
      const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

      await deleteAllMediaAssets(mockDb as never, 123);

      expect(mockDb.query.mediaAssets.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        columns: { id: true, publicId: true },
      });
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("hasModeratedMediaAssets", () => {
    it("returns true when moderated assets exist", async () => {
      mockDb.query.mediaAssets.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await hasModeratedMediaAssets(mockDb as never, 123);

      expect(result).toBe(true);
      expect(mockDb.query.mediaAssets.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        columns: { id: true },
      });
    });

    it("returns false when no moderated assets exist", async () => {
      mockDb.query.mediaAssets.findMany.mockResolvedValue([]);

      const result = await hasModeratedMediaAssets(mockDb as never, 123);

      expect(result).toBe(false);
    });
  });
});
