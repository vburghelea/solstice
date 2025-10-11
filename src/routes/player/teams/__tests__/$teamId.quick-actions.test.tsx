import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeamMemberRole } from "~/db/schema";
import type {
  TeamMemberDetails,
  ViewerTeamMembership,
} from "~/features/teams/teams.queries";

const mockUseAuth = vi.fn();
const mockGetTeam = vi.fn();
const mockGetTeamMembers = vi.fn();
const mockGetViewerTeamMembership = vi.fn();
const mockRequestTeamMembership = vi.fn();
const mockApproveTeamMembership = vi.fn();
const mockRejectTeamMembership = vi.fn();
const mockAddTeamMember = vi.fn();
const mockUpdateTeamMember = vi.fn();
const mockRemoveTeamMember = vi.fn();

vi.mock("~/features/auth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("~/features/teams/teams.queries", () => ({
  getTeam: mockGetTeam,
  getTeamMembers: mockGetTeamMembers,
  getViewerTeamMembership: mockGetViewerTeamMembership,
}));

vi.mock("~/features/teams/teams.mutations", () => ({
  requestTeamMembership: mockRequestTeamMembership,
  approveTeamMembership: mockApproveTeamMembership,
  rejectTeamMembership: mockRejectTeamMembership,
  addTeamMember: mockAddTeamMember,
  updateTeamMember: mockUpdateTeamMember,
  removeTeamMember: mockRemoveTeamMember,
}));

vi.mock("~/components/ProfileLink", () => ({
  ProfileLink: ({ username }: { username: string }) => <span>{username}</span>,
}));

vi.mock("~/components/ui/avatar", () => ({
  Avatar: ({ name }: { name?: string | null }) => (
    <div aria-label={name ?? "avatar"}>{name ?? "avatar"}</div>
  ),
}));

vi.mock("~/components/ui/TypedLink", () => ({
  TypedLink: ({
    children,
    to,
    params,
    ...props
  }: {
    children: ReactNode;
    to?: string;
    params?: unknown;
  }) => {
    void params;
    return (
      <a href={typeof to === "string" ? to : undefined} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ children, ...props }: { children: ReactNode }) => (
      <a {...props}>{children}</a>
    ),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseTeam = {
  team: {
    id: "team-1",
    name: "Test Thunder",
    slug: "test-thunder",
    description: "",
    city: null,
    country: null,
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
    foundedYear: null,
    website: null,
    socialLinks: null,
    isActive: "true",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    createdBy: "captain-id",
  },
  memberCount: 2,
} as const;

const nowIso = "2024-01-02T00:00:00.000Z";

beforeEach(() => {
  vi.clearAllMocks();
});

type DateLike = Date | string | null | undefined;

type CreateMemberOptions = {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: TeamMemberRole;
  status?: TeamMemberDetails["member"]["status"];
  joinedAt?: DateLike;
  invitedAt?: DateLike;
  requestedAt?: DateLike;
  approvedBy?: string | null;
  decisionAt?: DateLike;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function toDate(value: DateLike, fallback: Date | null = null): Date | null {
  if (value === undefined) return fallback;
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function createMember(options: CreateMemberOptions = {}): TeamMemberDetails {
  const userId = options.userId ?? "captain-id";
  const resolvedStatus = options.status ?? "active";
  const baseName =
    options.name ?? (userId === "captain-id" ? "Casey Captain" : "Player One");
  const baseEmail = options.email ?? `${userId}@example.com`;
  const joinedAt =
    toDate(options.joinedAt, new Date("2024-01-01T00:00:00.000Z")) ??
    new Date("2024-01-01T00:00:00.000Z");
  const decisionAt =
    resolvedStatus === "active"
      ? toDate(options.decisionAt, new Date(nowIso))
      : toDate(options.decisionAt);

  return {
    member: {
      id: options.id ?? `${userId}-membership`,
      role: options.role ?? "captain",
      status: resolvedStatus,
      jerseyNumber: null,
      position: null,
      joinedAt,
      leftAt: null,
      notes: null,
      invitedAt: toDate(options.invitedAt),
      requestedAt: toDate(options.requestedAt),
      invitationReminderCount: 0,
      lastInvitationReminderAt: null,
      approvedBy:
        options.approvedBy ?? (resolvedStatus === "active" ? "captain-id" : null),
      decisionAt,
    },
    user: {
      id: userId,
      name: baseName,
      email: baseEmail,
      image: null,
      uploadedAvatarPath: null,
    },
    invitedBy: {
      id: options.invitedBy?.id ?? null,
      name: options.invitedBy?.name ?? null,
      email: options.invitedBy?.email ?? null,
    },
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

async function renderTeamDetails(options?: {
  user?: { id: string; name: string; email: string } | null;
  members?: TeamMemberDetails[];
  membership?: ViewerTeamMembership | null;
  viewerMembership?: ViewerTeamMembership | null;
}) {
  const user =
    options?.user ??
    ({
      id: "captain-id",
      name: "Casey Captain",
      email: "captain@example.com",
    } as const);
  const members = options?.members ?? [createMember({ userId: "captain-id" })];
  const defaultMembership = members[0]
    ? {
        id: members[0].member.id,
        role: members[0].member.role,
        status: members[0].member.status,
        invitedBy: members[0].invitedBy.id,
        requestedAt: members[0].member.requestedAt,
        approvedBy: members[0].member.approvedBy,
        decisionAt: members[0].member.decisionAt,
      }
    : null;
  const membership = options?.membership ?? defaultMembership;
  const viewerMembership =
    options?.viewerMembership ?? (membership ? { ...membership } : null);

  mockUseAuth.mockReturnValue({ user, isAuthenticated: Boolean(user) });
  mockGetTeam.mockResolvedValue(baseTeam);
  mockGetTeamMembers.mockResolvedValue(members);
  mockGetViewerTeamMembership.mockResolvedValue(viewerMembership);

  const mod = await import("../$teamId.index");
  (mod.Route as unknown as { useLoaderData: () => unknown }).useLoaderData = () => ({
    team: baseTeam,
    members,
    membership,
  });
  (mod.Route as unknown as { useParams: () => { teamId: string } }).useParams = () => ({
    teamId: baseTeam.team.id,
  });

  const Component = mod.Route.options.component!;
  const qc = createQueryClient();
  const userSim = userEvent.setup();

  render(
    <QueryClientProvider client={qc}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  );

  return { user: userSim };
}

async function renderTeamMembersPage(options?: { members?: TeamMemberDetails[] }) {
  const rosterMembers = options?.members ?? [
    createMember({ userId: "captain-id" }),
    createMember({
      userId: "player-1",
      role: "player",
      status: "pending",
      requestedAt: nowIso,
    }),
  ];

  mockUseAuth.mockReturnValue({
    user: { id: "captain-id", name: "Casey Captain", email: "captain@example.com" },
    isAuthenticated: true,
  });
  mockGetTeam.mockResolvedValue(baseTeam);
  mockGetTeamMembers.mockResolvedValue(rosterMembers);

  const mod = await import("../$teamId.members");
  (mod.Route as unknown as { useLoaderData: () => unknown }).useLoaderData = () => ({
    team: baseTeam,
    members: rosterMembers,
  });
  (mod.Route as unknown as { useParams: () => { teamId: string } }).useParams = () => ({
    teamId: baseTeam.team.id,
  });

  const Component = mod.Route.options.component!;
  const qc = createQueryClient();
  const userSim = userEvent.setup();

  render(
    <QueryClientProvider client={qc}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </QueryClientProvider>,
  );

  return { user: userSim };
}

describe("Team dashboard quick actions", () => {
  it("shows Manage Members link for active captains", async () => {
    await renderTeamDetails();

    expect(
      await screen.findByRole("link", { name: /manage members/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ask to join/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Manage Members link for non-manager members", async () => {
    const playerMember = createMember({ userId: "player-1", role: "player" });

    await renderTeamDetails({
      user: { id: "player-1", name: "Player One", email: "player@example.com" },
      members: [playerMember],
      membership: {
        id: playerMember.member.id,
        role: playerMember.member.role,
        status: playerMember.member.status,
        invitedBy: null,
        requestedAt: null,
        approvedBy: null,
        decisionAt: null,
      },
    });

    await screen.findByText(/quick actions/i);
    expect(
      screen.queryByRole("link", { name: /manage members/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ask to join/i }),
    ).not.toBeInTheDocument();
  });

  it("allows unaffiliated players to request membership", async () => {
    mockRequestTeamMembership.mockResolvedValue({ ok: true });

    const { user } = await renderTeamDetails({
      user: { id: "seeker-1", name: "Sam Seeker", email: "sam@example.com" },
      membership: {
        id: "inactive-membership",
        role: "player",
        status: "inactive",
        invitedBy: null,
        requestedAt: null,
        approvedBy: null,
        decisionAt: null,
      },
      members: [createMember({ userId: "captain-id" })],
    });

    const requestButton = await screen.findByRole("button", { name: /ask to join/i });
    await user.click(requestButton);

    await waitFor(() =>
      expect(
        screen.getByText(/join request sent to the team captains/i),
      ).toBeInTheDocument(),
    );

    expect(mockRequestTeamMembership).toHaveBeenCalledWith({
      data: { teamId: baseTeam.team.id },
    });
    expect(
      screen.queryByRole("link", { name: /manage members/i }),
    ).not.toBeInTheDocument();
  });

  it("shows pending message when a join request is awaiting review", async () => {
    const pendingState = {
      id: "pending-membership",
      role: "player",
      status: "pending",
      invitedBy: null,
      requestedAt: new Date(nowIso),
      approvedBy: null,
      decisionAt: null,
    } as const;

    await renderTeamDetails({
      user: { id: "seeker-1", name: "Sam Seeker", email: "sam@example.com" },
      members: [createMember({ userId: "captain-id" })],
      membership: pendingState,
      viewerMembership: pendingState,
    });

    expect(
      screen.getByText(/your join request is awaiting approval from the team captains/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ask to join/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Team roster management", () => {
  it("shows approve and decline controls for join requests only", async () => {
    const joinRequest = createMember({
      userId: "player-join",
      role: "player",
      status: "pending",
      requestedAt: nowIso,
      invitedBy: null,
    });
    const invitedPlayer = createMember({
      id: "invite-membership",
      userId: "invited-player",
      role: "player",
      status: "pending",
      requestedAt: null,
      invitedAt: nowIso,
      invitedBy: {
        id: "captain-id",
        name: "Casey Captain",
        email: "captain@example.com",
      },
    });

    await renderTeamMembersPage({
      members: [createMember({ userId: "captain-id" }), joinRequest, invitedPlayer],
    });

    expect(screen.getAllByRole("button", { name: /approve/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /decline/i })).toHaveLength(1);
    expect(screen.getByText(/join request received/i)).toBeInTheDocument();
    expect(screen.getByText(/invitation sent/i)).toBeInTheDocument();
  });

  it("calls the approve mutation with the correct payload", async () => {
    const joinRequest = createMember({
      userId: "player-join",
      role: "player",
      status: "pending",
      requestedAt: nowIso,
      invitedBy: null,
    });
    mockApproveTeamMembership.mockResolvedValue({ ok: true });

    const { user } = await renderTeamMembersPage({
      members: [createMember({ userId: "captain-id" }), joinRequest],
    });

    const approveButton = await screen.findByRole("button", { name: /approve/i });
    await user.click(approveButton);

    await waitFor(() => {
      expect(mockApproveTeamMembership).toHaveBeenCalledWith({
        data: { teamId: baseTeam.team.id, memberId: joinRequest.member.id },
      });
    });
  });

  it("calls the decline mutation with the correct payload", async () => {
    const joinRequest = createMember({
      userId: "player-join",
      role: "player",
      status: "pending",
      requestedAt: nowIso,
      invitedBy: null,
    });
    mockRejectTeamMembership.mockResolvedValue({ ok: true });

    const { user } = await renderTeamMembersPage({
      members: [createMember({ userId: "captain-id" }), joinRequest],
    });

    const declineButton = await screen.findByRole("button", { name: /decline/i });
    await user.click(declineButton);

    await waitFor(() => {
      expect(mockRejectTeamMembership).toHaveBeenCalledWith({
        data: { teamId: baseTeam.team.id, memberId: joinRequest.member.id },
      });
    });
  });
});
