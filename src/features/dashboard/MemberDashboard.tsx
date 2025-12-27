import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Settings,
  Shield,
  UserCircle,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { MembershipStatus } from "~/features/membership/membership.types";
import { isAnyAdmin } from "~/features/roles/permission.service";
import { getBrand } from "~/tenant";

// Types for the dashboard data
interface ProfileStatus {
  complete: boolean;
  missingFields: string[];
}

interface UserTeam {
  team: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    province: string | null;
  };
  membership: {
    role: string;
    status: string;
  };
  memberCount: number;
}

interface PendingInvite {
  team: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface UpcomingEvent {
  id: string;
  name: string;
  slug: string;
  startDate: Date | string;
  city: string | null;
  province: string | null;
  status: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  roles?: Array<{ role: { name: string } }>;
}

export interface MemberDashboardProps {
  user: User;
  membershipStatus: MembershipStatus | null;
  profileStatus: ProfileStatus;
  userTeams: UserTeam[];
  pendingInvites: PendingInvite[];
  upcomingEvents: UpcomingEvent[];
}

export function MemberDashboard({
  user,
  membershipStatus,
  profileStatus,
  userTeams,
  pendingInvites,
  upcomingEvents,
}: MemberDashboardProps) {
  const brand = getBrand();
  const isAdmin = isAnyAdmin(user);

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name || "Member"}!
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{brand.name} member overview</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {membershipStatus?.hasMembership ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active Member
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Membership Required
            </span>
          )}
          {isAdmin && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              <Shield className="mr-1 h-3 w-3" />
              Admin
            </span>
          )}
        </div>
      </header>

      {/* Action Cards - Your Next Steps */}
      <ActionCards
        profileStatus={profileStatus}
        membershipStatus={membershipStatus}
        pendingInvites={pendingInvites}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teams Section */}
        <TeamsCard teams={userTeams} invites={pendingInvites} />

        {/* Membership Card */}
        <MembershipCard status={membershipStatus} />
      </div>

      {/* Upcoming Events */}
      <UpcomingEventsCard events={upcomingEvents} />

      {/* Admin Tools (conditional) */}
      {isAdmin && <AdminToolsCard />}

      {/* Quick Links */}
      <QuickLinksCard />
    </div>
  );
}

// Action Cards Component
function ActionCards({
  profileStatus,
  membershipStatus,
  pendingInvites,
}: {
  profileStatus: ProfileStatus;
  membershipStatus: MembershipStatus | null;
  pendingInvites: PendingInvite[];
}) {
  const actions: Array<{
    show: boolean;
    title: string;
    description: string;
    href: string;
    icon: typeof UserCircle;
    variant: "default" | "warning" | "info";
  }> = [];

  // Profile incomplete
  if (!profileStatus.complete) {
    actions.push({
      show: true,
      title: "Complete your profile",
      description: `Missing: ${profileStatus.missingFields.slice(0, 2).join(", ")}${profileStatus.missingFields.length > 2 ? "..." : ""}`,
      href: "/dashboard/profile",
      icon: UserCircle,
      variant: "warning",
    });
  }

  // No membership
  if (!membershipStatus?.hasMembership) {
    actions.push({
      show: true,
      title: "Activate membership",
      description: "Get your annual player membership to compete",
      href: "/dashboard/membership",
      icon: CreditCard,
      variant: "warning",
    });
  }

  // Membership expiring soon
  if (
    membershipStatus?.hasMembership &&
    membershipStatus.daysRemaining &&
    membershipStatus.daysRemaining < 30
  ) {
    actions.push({
      show: true,
      title: "Renew membership",
      description: `Expires in ${membershipStatus.daysRemaining} days`,
      href: "/dashboard/membership",
      icon: Clock,
      variant: "warning",
    });
  }

  // Pending team invites
  if (pendingInvites.length > 0) {
    actions.push({
      show: true,
      title: "Team invitations",
      description: `${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? "s" : ""}`,
      href: "/dashboard/teams",
      icon: Users,
      variant: "info",
    });
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Your Next Steps</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.href + action.title} to={action.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className={`rounded-full p-2 ${
                    action.variant === "warning"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-muted-foreground text-sm">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Teams Card
function TeamsCard({ teams, invites }: { teams: UserTeam[]; invites: PendingInvite[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Teams
        </CardTitle>
        <CardDescription>
          {teams.length === 0
            ? "You're not on any teams yet"
            : `${teams.length} active team${teams.length !== 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Join a team to compete in tournaments and events
            </p>
            <Button asChild variant="outline">
              <Link to="/dashboard/teams/browse">Browse Teams</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {teams.map(({ team, membership, memberCount }) => (
              <li key={team.id}>
                <Link
                  to="/dashboard/teams/$teamId"
                  params={{ teamId: team.slug }}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {team.city}
                      {team.province ? `, ${team.province}` : ""} &middot; {memberCount}{" "}
                      member{memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-1 text-xs capitalize">
                    {membership.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">Pending Invitations</p>
            <ul className="space-y-2">
              {invites.map(({ team, membership, inviter }) => (
                <li
                  key={membership.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Invited as {membership.role}
                      {inviter?.name ? ` by ${inviter.name}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Decline
                    </Button>
                    <Button size="sm">Accept</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Membership Card
function MembershipCard({ status }: { status: MembershipStatus | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Membership Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status?.hasMembership ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-muted-foreground text-sm">
                  {status.currentMembership?.membershipType.name}
                </p>
              </div>
            </div>
            {status.expiresAt && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Valid until{" "}
                  {new Date(status.expiresAt).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {typeof status.daysRemaining === "number" &&
                  status.daysRemaining < 60 && (
                    <p className="mt-1 text-sm text-yellow-700">
                      {status.daysRemaining <= 0
                        ? "Expires today"
                        : `${status.daysRemaining} days remaining`}
                    </p>
                  )}
              </div>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard/membership">
                {typeof status.daysRemaining === "number" && status.daysRemaining < 30
                  ? "Renew Now"
                  : "View Details"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <XCircle className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <p className="font-medium">No Active Membership</p>
              <p className="text-muted-foreground text-sm">
                Get your membership to compete in official events
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/dashboard/membership">View Membership Options</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Upcoming Events Card
function UpcomingEventsCard({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/events">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No upcoming events scheduled
          </p>
        ) : (
          <ul className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <li key={event.id}>
                <Link
                  to="/dashboard/events/$slug"
                  params={{ slug: event.slug }}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(event.startDate).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      &middot; {event.city}
                      {event.province ? `, ${event.province}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      event.status === "registration_open"
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {event.status === "registration_open" ? "Open" : event.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Admin Tools Card
function AdminToolsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Tools
        </CardTitle>
        <CardDescription>Manage organization settings and data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline">
            <Link to="/dashboard/members">Members</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/admin/roles">Roles</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/events">Events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/reports">Reports</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Links Card
function QuickLinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="ghost" className="justify-start">
            <Link to="/dashboard/profile">
              <UserCircle className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <Link to="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start">
            <a href="https://quadballcanada.ca" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" />
              News & Updates
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
