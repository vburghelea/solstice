import { describe, expect, it } from "vitest";
import {
  addTeamMemberSchema,
  createTeamSchema,
  getTeamBySlugSchema,
  getTeamMembersSchema,
  getTeamSchema,
  isTeamMemberSchema,
  listTeamsSchema,
  removeTeamMemberSchema,
  searchTeamsSchema,
  updateTeamMemberSchema,
  updateTeamSchema,
} from "../teams.schemas";

describe("Teams Schemas", () => {
  describe("Query Schemas", () => {
    describe("getTeamSchema", () => {
      it("validates valid team ID", () => {
        const result = getTeamSchema.safeParse({ teamId: "team-123" });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = getTeamSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe("getTeamBySlugSchema", () => {
      it("validates valid slug", () => {
        const result = getTeamBySlugSchema.safeParse({ slug: "berlin-raiders" });
        expect(result.success).toBe(true);
      });

      it("fails without slug", () => {
        const result = getTeamBySlugSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe("listTeamsSchema", () => {
      it("validates with includeInactive flag", () => {
        const result = listTeamsSchema.safeParse({ includeInactive: true });
        expect(result.success).toBe(true);
        expect(result.data?.includeInactive).toBe(true);
      });

      it("validates without any input (defaults to false)", () => {
        const result = listTeamsSchema.safeParse(undefined);
        expect(result.success).toBe(true);
        expect(result.data?.includeInactive).toBe(false);
      });

      it("validates empty object (defaults to false)", () => {
        const result = listTeamsSchema.safeParse({});
        expect(result.success).toBe(true);
        expect(result.data?.includeInactive).toBe(false);
      });
    });

    describe("getTeamMembersSchema", () => {
      it("validates with all fields", () => {
        const result = getTeamMembersSchema.safeParse({
          teamId: "team-123",
          includeInactive: true,
        });
        expect(result.success).toBe(true);
      });

      it("validates without optional field", () => {
        const result = getTeamMembersSchema.safeParse({
          teamId: "team-123",
        });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = getTeamMembersSchema.safeParse({
          includeInactive: true,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("isTeamMemberSchema", () => {
      it("validates with both IDs", () => {
        const result = isTeamMemberSchema.safeParse({
          teamId: "team-123",
          userId: "user-456",
        });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = isTeamMemberSchema.safeParse({
          userId: "user-456",
        });
        expect(result.success).toBe(false);
      });

      it("fails without user ID", () => {
        const result = isTeamMemberSchema.safeParse({
          teamId: "team-123",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("searchTeamsSchema", () => {
      it("validates with valid query", () => {
        const result = searchTeamsSchema.safeParse({
          query: "berlin",
        });
        expect(result.success).toBe(true);
      });

      it("fails with empty query", () => {
        const result = searchTeamsSchema.safeParse({
          query: "",
        });
        expect(result.success).toBe(false);
      });

      it("fails without query", () => {
        const result = searchTeamsSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Mutation Schemas", () => {
    describe("createTeamSchema", () => {
      it("validates with all fields", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "berlin-raiders",
          description: "A competitive team",
          city: "Berlin",
          country: "DEU",
          primaryColor: "#FF0000",
          secondaryColor: "#0000FF",
          foundedYear: "2025",
          website: "https://raiders.berlin",
          socialLinks: {
            instagram: "@berlinraiders",
            facebook: "berlinraiders",
          },
        });
        expect(result.success).toBe(true);
      });

      it("validates with required fields only", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "berlin-raiders",
        });
        expect(result.success).toBe(true);
      });

      it("fails without name", () => {
        const result = createTeamSchema.safeParse({
          slug: "berlin-raiders",
        });
        expect(result.success).toBe(false);
      });

      it("fails without slug", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
        });
        expect(result.success).toBe(false);
      });

      it("fails with invalid slug format", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "Berlin Raiders", // Should be lowercase with hyphens
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain(
            "Slug can only contain lowercase letters, numbers, and hyphens",
          );
        }
      });

      it("fails with invalid color format", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "berlin-raiders",
          primaryColor: "red", // Should be hex
        });
        expect(result.success).toBe(false);
      });

      it("fails with invalid founded year", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "berlin-raiders",
          foundedYear: "25", // Should be 4 digits
        });
        expect(result.success).toBe(false);
      });

      it("fails with invalid website URL", () => {
        const result = createTeamSchema.safeParse({
          name: "Berlin Raiders",
          slug: "berlin-raiders",
          website: "not-a-url",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("updateTeamSchema", () => {
      it("validates with all fields", () => {
        const result = updateTeamSchema.safeParse({
          teamId: "team-123",
          data: {
            name: "Berlin Raiders Updated",
            description: "Updated description",
          },
        });
        expect(result.success).toBe(true);
      });

      it("validates with empty data (no updates)", () => {
        const result = updateTeamSchema.safeParse({
          teamId: "team-123",
          data: {},
        });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = updateTeamSchema.safeParse({
          data: {
            name: "Updated Name",
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe("addTeamMemberSchema", () => {
      it("validates with all fields", () => {
        const result = addTeamMemberSchema.safeParse({
          teamId: "team-123",
          email: "player@example.com",
          role: "player",
          jerseyNumber: "42",
          position: "Chaser",
        });
        expect(result.success).toBe(true);
      });

      it("validates with required fields only", () => {
        const result = addTeamMemberSchema.safeParse({
          teamId: "team-123",
          email: "player@example.com",
          role: "player",
        });
        expect(result.success).toBe(true);
      });

      it("validates all role types", () => {
        const roles = ["captain", "coach", "player", "substitute"];
        roles.forEach((role) => {
          const result = addTeamMemberSchema.safeParse({
            teamId: "team-123",
            email: "player@example.com",
            role,
          });
          expect(result.success).toBe(true);
        });
      });

      it("fails with invalid email", () => {
        const result = addTeamMemberSchema.safeParse({
          teamId: "team-123",
          email: "not-an-email",
          role: "player",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toContain("valid email");
        }
      });

      it("fails with invalid role", () => {
        const result = addTeamMemberSchema.safeParse({
          teamId: "team-123",
          email: "player@example.com",
          role: "manager", // Not a valid role
        });
        expect(result.success).toBe(false);
      });
    });

    describe("updateTeamMemberSchema", () => {
      it("validates with all fields", () => {
        const result = updateTeamMemberSchema.safeParse({
          teamId: "team-123",
          memberId: "member-456",
          role: "captain",
          jerseyNumber: "99",
          position: "Keeper",
          notes: "Promoted to captain",
        });
        expect(result.success).toBe(true);
      });

      it("validates with only required fields", () => {
        const result = updateTeamMemberSchema.safeParse({
          teamId: "team-123",
          memberId: "member-456",
        });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = updateTeamMemberSchema.safeParse({
          memberId: "member-456",
          role: "captain",
        });
        expect(result.success).toBe(false);
      });

      it("fails without member ID", () => {
        const result = updateTeamMemberSchema.safeParse({
          teamId: "team-123",
          role: "captain",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("removeTeamMemberSchema", () => {
      it("validates with both IDs", () => {
        const result = removeTeamMemberSchema.safeParse({
          teamId: "team-123",
          memberId: "member-456",
        });
        expect(result.success).toBe(true);
      });

      it("fails without team ID", () => {
        const result = removeTeamMemberSchema.safeParse({
          memberId: "member-456",
        });
        expect(result.success).toBe(false);
      });

      it("fails without member ID", () => {
        const result = removeTeamMemberSchema.safeParse({
          teamId: "team-123",
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
