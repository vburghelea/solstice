import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveTeamMembershipHandler,
  rejectTeamMembershipHandler,
} from "../teams.mutations";
type SelectChain = {
  from: ReturnType<typeof vi.fn>;
};
type QueryChain = {
  where: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
};
const selectQueue: Array<SelectChain> = [];
let updateResult: unknown[] = [];
const decisionEmailMock = vi.fn();
type RespondPayload = { teamId: string; memberId: string };
const callApprove = (payload: RespondPayload) =>
  approveTeamMembershipHandler({ data: payload, context: {} });
const callReject = (payload: RespondPayload) =>
  rejectTeamMembershipHandler({ data: payload, context: {} });
const makeSelectChain = (rows: unknown[]): SelectChain => {
  const limit = vi.fn(async () => rows);
  const where = vi.fn(() => ({ limit }));
  const chain: QueryChain = {
    where,
    innerJoin: vi.fn(() => chain),
  };
  const from = vi.fn(() => chain);
  return { from };
};
const fakeDb = {
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({ returning: vi.fn(async () => updateResult) })),
    })),
  })),
  select: vi.fn(() => {
    const handler = selectQueue.shift();
    if (!handler) {
      throw new Error("No select handler configured");
    }
    return handler;
  }),
};
vi.mock("~/db/server-helpers", () => ({
  getDb: vi.fn(async () => fakeDb),
}));
vi.mock("~/db/schema", () => ({
  teamMembers: { id: "id", teamId: "team_id", userId: "user_id" },
  teams: { name: "name", slug: "slug" },
  user: { email: "email", name: "name" },
}));
vi.mock("~/lib/server/auth", () => ({
  getAuthMiddleware: () => [],
  requireUser: vi.fn(() => ({ id: "captain-id", name: "Casey Captain" })),
}));
vi.mock("~/lib/email/resend", () => ({
  sendTeamInvitationEmail: vi.fn(),
  sendTeamRequestDecisionEmail: decisionEmailMock,
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  isNull: vi.fn((arg: unknown) => ({ isNull: arg })),
}));
function resetMocks() {
  selectQueue.length = 0;
  updateResult = [];
  fakeDb.update.mockClear();
  fakeDb.select.mockClear();
  decisionEmailMock.mockReset();
}
describe("team membership decision emails", () => {
  beforeEach(() => {
    resetMocks();
  });
  it("requires a captain or coach to approve a request", async () => {
    selectQueue.push(makeSelectChain([]));
    await expect(
      callApprove({ teamId: "test-team-1", memberId: "membership-1" }),
    ).rejects.toMatchObject({
      error: { code: "FORBIDDEN" },
    });
  });
  it("requires a pending join request before approving", async () => {
    selectQueue.push(makeSelectChain([{ role: "captain" }]), makeSelectChain([]));
    await expect(
      callApprove({ teamId: "test-team-1", memberId: "membership-1" }),
    ).rejects.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
  it("translates active membership conflicts into validation errors", async () => {
    selectQueue.push(
      makeSelectChain([{ role: "captain" }]),
      makeSelectChain([{ id: "membership-1" }]),
    );
    fakeDb.update.mockImplementationOnce(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            const error = Object.assign(new Error("duplicate membership"), {
              constraint: "team_members_active_user_idx",
              code: "23505",
            });
            throw error;
          }),
        })),
      })),
    }));
    await expect(
      callApprove({ teamId: "test-team-1", memberId: "membership-1" }),
    ).rejects.toMatchObject({
      error: {
        code: "VALIDATION",
        message: "This member already has an active membership with another team.",
      },
    });
  });
  it("sends approval email with resolved membership info", async () => {
    selectQueue.push(
      makeSelectChain([{ role: "captain" }]),
      makeSelectChain([{ id: "membership-1" }]),
      makeSelectChain([
        {
          email: "player@example.com",
          name: "Player One",
          teamName: "Test Thunder",
          teamSlug: "test-team-1",
        },
      ]),
    );
    updateResult = [
      {
        id: "membership-1",
        teamId: "test-team-1",
        userId: "player-1",
      },
    ];
    const result = await callApprove({
      teamId: "test-team-1",
      memberId: "membership-1",
    });
    expect(result).toEqual(updateResult[0]);
    expect(decisionEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "approved",
        teamName: "Test Thunder",
        to: { email: "player@example.com", name: "Player One" },
      }),
    );
  });
  it("still resolves when approval email fails", async () => {
    selectQueue.push(
      makeSelectChain([{ role: "captain" }]),
      makeSelectChain([{ id: "membership-1" }]),
      makeSelectChain([
        {
          email: "player@example.com",
          name: "Player One",
          teamName: "Test Thunder",
          teamSlug: "test-team-1",
        },
      ]),
    );
    updateResult = [
      {
        id: "membership-1",
        teamId: "test-team-1",
        userId: "player-1",
      },
    ];
    decisionEmailMock.mockRejectedValueOnce(new Error("resend offline"));
    await expect(
      callApprove({ teamId: "test-team-1", memberId: "membership-1" }),
    ).resolves.toEqual(updateResult[0]);
  });
  it("sends decline email when request is rejected", async () => {
    selectQueue.push(
      makeSelectChain([{ role: "captain" }]),
      makeSelectChain([{ id: "membership-2" }]),
    );
    updateResult = [
      {
        id: "membership-2",
        teamId: "test-team-1",
        userId: "player-2",
      },
    ];
    // select after update to fetch recipient
    selectQueue.push(
      makeSelectChain([
        {
          email: "seeker@example.com",
          name: "Seeker Two",
          teamName: "Test Thunder",
          teamSlug: "test-team-1",
        },
      ]),
    );
    const result = await callReject({
      teamId: "test-team-1",
      memberId: "membership-2",
    });
    expect(result).toEqual(updateResult[0]);
    expect(decisionEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "declined",
        teamName: "Test Thunder",
        to: { email: "seeker@example.com", name: "Seeker Two" },
      }),
    );
  });
  it("requires a captain or coach to reject a request", async () => {
    selectQueue.push(makeSelectChain([]));
    await expect(
      callReject({ teamId: "test-team-1", memberId: "membership-1" }),
    ).rejects.toMatchObject({
      error: { code: "FORBIDDEN" },
    });
  });
  it("requires a pending join request before rejecting", async () => {
    selectQueue.push(makeSelectChain([{ role: "captain" }]), makeSelectChain([]));
    await expect(
      callReject({ teamId: "test-team-1", memberId: "membership-1" }),
    ).rejects.toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
});
