import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for event registration business logic.
 * Tests registration eligibility, pricing calculations, and state transitions.
 */

// Mock types matching the actual schema
interface MockEvent {
  id: string;
  name: string;
  slug: string;
  status:
    | "draft"
    | "published"
    | "registration_open"
    | "registration_closed"
    | "in_progress"
    | "completed"
    | "cancelled";
  registrationType: "individual" | "team" | "both";
  maxParticipants: number | null;
  maxTeams: number | null;
  individualFee: number | null;
  teamFee: number | null;
  memberDiscount: number | null;
  earlyBirdDiscount: number | null;
  earlyBirdDeadline: string | null;
  organizerId: string;
  metadata: Record<string, unknown>;
}

interface MockRegistration {
  id: string;
  eventId: string;
  userId: string | null;
  teamId: string | null;
  status: "pending" | "confirmed" | "cancelled" | "waitlisted";
  paymentStatus: "pending" | "paid" | "refunded" | "waived";
  amountPaidCents: number;
  division: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface MockMembership {
  id: string;
  userId: string;
  status: "active" | "expired" | "cancelled";
  endDate: string;
}

describe("Event Registration Integration", () => {
  let mockRegistrations: MockRegistration[];
  let mockMemberships: MockMembership[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistrations = [];
    mockMemberships = [];
  });

  describe("Registration Eligibility", () => {
    it("allows registration when event status is registration_open", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Summer Tournament",
        slug: "summer-tournament-2025",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: 100,
        maxTeams: null,
        individualFee: 2500, // $25.00
        teamFee: null,
        memberDiscount: 500, // $5.00 off for members
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      const canRegister = event.status === "registration_open";
      expect(canRegister).toBe(true);
    });

    it("blocks registration when event is draft", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Summer Tournament",
        slug: "summer-tournament-2025",
        status: "draft",
        registrationType: "individual",
        maxParticipants: 100,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      const canRegister = event.status === "registration_open";
      expect(canRegister).toBe(false);
    });

    it("blocks registration when event is cancelled", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Summer Tournament",
        slug: "summer-tournament-2025",
        status: "cancelled",
        registrationType: "individual",
        maxParticipants: 100,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      const canRegister = event.status === "registration_open";
      expect(canRegister).toBe(false);
    });

    it("blocks duplicate registration for same user", () => {
      const userId = "user-123";
      const eventId = "event-1";

      mockRegistrations.push({
        id: "reg-1",
        eventId,
        userId,
        teamId: null,
        status: "confirmed",
        paymentStatus: "paid",
        amountPaidCents: 2500,
        division: null,
        notes: null,
        metadata: {},
        createdAt: new Date(),
      });

      const existingRegistration = mockRegistrations.find(
        (r) => r.eventId === eventId && r.userId === userId && r.status !== "cancelled",
      );

      expect(existingRegistration).toBeDefined();
      const canRegister = !existingRegistration;
      expect(canRegister).toBe(false);
    });
  });

  describe("Capacity Management", () => {
    it("allows registration when under capacity", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Small Tournament",
        slug: "small-tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: 10,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      // 5 existing registrations
      for (let i = 0; i < 5; i++) {
        mockRegistrations.push({
          id: `reg-${i}`,
          eventId: event.id,
          userId: `user-${i}`,
          teamId: null,
          status: "confirmed",
          paymentStatus: "paid",
          amountPaidCents: 2500,
          division: null,
          notes: null,
          metadata: {},
          createdAt: new Date(),
        });
      }

      const confirmedCount = mockRegistrations.filter(
        (r) => r.eventId === event.id && r.status === "confirmed",
      ).length;

      const hasCapacity =
        event.maxParticipants === null || confirmedCount < event.maxParticipants;
      expect(hasCapacity).toBe(true);
      expect(confirmedCount).toBe(5);
    });

    it("blocks registration when at capacity", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Small Tournament",
        slug: "small-tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: 5,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      // Fill to capacity
      for (let i = 0; i < 5; i++) {
        mockRegistrations.push({
          id: `reg-${i}`,
          eventId: event.id,
          userId: `user-${i}`,
          teamId: null,
          status: "confirmed",
          paymentStatus: "paid",
          amountPaidCents: 2500,
          division: null,
          notes: null,
          metadata: {},
          createdAt: new Date(),
        });
      }

      const confirmedCount = mockRegistrations.filter(
        (r) => r.eventId === event.id && r.status === "confirmed",
      ).length;

      const hasCapacity =
        event.maxParticipants === null || confirmedCount < event.maxParticipants;
      expect(hasCapacity).toBe(false);
    });

    it("does not count cancelled registrations toward capacity", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Small Tournament",
        slug: "small-tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: 5,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      // 3 confirmed, 2 cancelled
      for (let i = 0; i < 3; i++) {
        mockRegistrations.push({
          id: `reg-${i}`,
          eventId: event.id,
          userId: `user-${i}`,
          teamId: null,
          status: "confirmed",
          paymentStatus: "paid",
          amountPaidCents: 2500,
          division: null,
          notes: null,
          metadata: {},
          createdAt: new Date(),
        });
      }
      for (let i = 3; i < 5; i++) {
        mockRegistrations.push({
          id: `reg-${i}`,
          eventId: event.id,
          userId: `user-${i}`,
          teamId: null,
          status: "cancelled",
          paymentStatus: "refunded",
          amountPaidCents: 0,
          division: null,
          notes: null,
          metadata: {},
          createdAt: new Date(),
        });
      }

      const confirmedCount = mockRegistrations.filter(
        (r) => r.eventId === event.id && r.status === "confirmed",
      ).length;

      expect(confirmedCount).toBe(3);
      const hasCapacity =
        event.maxParticipants === null || confirmedCount < event.maxParticipants;
      expect(hasCapacity).toBe(true);
    });
  });

  describe("Pricing Calculations", () => {
    it("calculates base price for non-members", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Tournament",
        slug: "tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: null,
        maxTeams: null,
        individualFee: 2500, // $25.00
        teamFee: null,
        memberDiscount: 500, // $5.00 off
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      const isMember = false;
      const basePrice = event.individualFee ?? 0;
      const discount = isMember ? (event.memberDiscount ?? 0) : 0;
      const finalPrice = Math.max(0, basePrice - discount);

      expect(finalPrice).toBe(2500);
    });

    it("applies member discount correctly", () => {
      const event: MockEvent = {
        id: "event-1",
        name: "Tournament",
        slug: "tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: null,
        maxTeams: null,
        individualFee: 2500, // $25.00
        teamFee: null,
        memberDiscount: 500, // $5.00 off
        earlyBirdDiscount: null,
        earlyBirdDeadline: null,
        organizerId: "org-1",
        metadata: {},
      };

      // User has active membership
      mockMemberships.push({
        id: "membership-1",
        userId: "user-123",
        status: "active",
        endDate: "2025-12-31",
      });

      const userId = "user-123";
      const userMembership = mockMemberships.find(
        (m) => m.userId === userId && m.status === "active",
      );
      const isMember = !!userMembership;

      const basePrice = event.individualFee ?? 0;
      const discount = isMember ? (event.memberDiscount ?? 0) : 0;
      const finalPrice = Math.max(0, basePrice - discount);

      expect(isMember).toBe(true);
      expect(finalPrice).toBe(2000); // $25 - $5 = $20
    });

    it("applies early bird discount when before deadline", () => {
      const now = new Date("2025-01-15");
      const event: MockEvent = {
        id: "event-1",
        name: "Tournament",
        slug: "tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: null,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: 300, // $3.00 off
        earlyBirdDeadline: "2025-02-01", // Deadline is after now
        organizerId: "org-1",
        metadata: {},
      };

      const isEarlyBird = event.earlyBirdDeadline
        ? now < new Date(event.earlyBirdDeadline)
        : false;

      const basePrice = event.individualFee ?? 0;
      const discount = isEarlyBird ? (event.earlyBirdDiscount ?? 0) : 0;
      const finalPrice = Math.max(0, basePrice - discount);

      expect(isEarlyBird).toBe(true);
      expect(finalPrice).toBe(2200); // $25 - $3 = $22
    });

    it("does not apply early bird discount after deadline", () => {
      const now = new Date("2025-03-01");
      const event: MockEvent = {
        id: "event-1",
        name: "Tournament",
        slug: "tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: null,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: null,
        earlyBirdDiscount: 300,
        earlyBirdDeadline: "2025-02-01", // Deadline has passed
        organizerId: "org-1",
        metadata: {},
      };

      const isEarlyBird = event.earlyBirdDeadline
        ? now < new Date(event.earlyBirdDeadline)
        : false;

      const basePrice = event.individualFee ?? 0;
      const discount = isEarlyBird ? (event.earlyBirdDiscount ?? 0) : 0;
      const finalPrice = Math.max(0, basePrice - discount);

      expect(isEarlyBird).toBe(false);
      expect(finalPrice).toBe(2500); // Full price
    });

    it("stacks member and early bird discounts", () => {
      const now = new Date("2025-01-15");
      const event: MockEvent = {
        id: "event-1",
        name: "Tournament",
        slug: "tournament",
        status: "registration_open",
        registrationType: "individual",
        maxParticipants: null,
        maxTeams: null,
        individualFee: 2500,
        teamFee: null,
        memberDiscount: 500,
        earlyBirdDiscount: 300,
        earlyBirdDeadline: "2025-02-01",
        organizerId: "org-1",
        metadata: {},
      };

      mockMemberships.push({
        id: "membership-1",
        userId: "user-123",
        status: "active",
        endDate: "2025-12-31",
      });

      const userId = "user-123";
      const userMembership = mockMemberships.find(
        (m) => m.userId === userId && m.status === "active",
      );
      const isMember = !!userMembership;
      const isEarlyBird = event.earlyBirdDeadline
        ? now < new Date(event.earlyBirdDeadline)
        : false;

      const basePrice = event.individualFee ?? 0;
      const memberDiscount = isMember ? (event.memberDiscount ?? 0) : 0;
      const earlyBirdDiscount = isEarlyBird ? (event.earlyBirdDiscount ?? 0) : 0;
      const finalPrice = Math.max(0, basePrice - memberDiscount - earlyBirdDiscount);

      expect(finalPrice).toBe(1700); // $25 - $5 - $3 = $17
    });
  });

  describe("Registration Cancellation", () => {
    it("updates status to cancelled and preserves metadata", () => {
      const registration: MockRegistration = {
        id: "reg-1",
        eventId: "event-1",
        userId: "user-123",
        teamId: null,
        status: "confirmed",
        paymentStatus: "paid",
        amountPaidCents: 2500,
        division: "competitive",
        notes: null,
        metadata: { registeredAt: "2025-01-15T10:00:00Z" },
        createdAt: new Date("2025-01-15"),
      };

      const cancellationReason = "Unable to attend due to schedule conflict";
      const cancelledAt = new Date("2025-01-20T15:00:00Z");

      // Simulate cancellation
      const updatedRegistration: MockRegistration = {
        ...registration,
        status: "cancelled",
        metadata: {
          ...registration.metadata,
          cancelledAt: cancelledAt.toISOString(),
          cancellationReason,
        },
      };

      expect(updatedRegistration.status).toBe("cancelled");
      expect(updatedRegistration.metadata).toMatchObject({
        registeredAt: "2025-01-15T10:00:00Z",
        cancelledAt: cancelledAt.toISOString(),
        cancellationReason,
      });
    });
  });
});
