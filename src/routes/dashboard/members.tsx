import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarCheck,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  MobileDataCard,
  MobileDataCardsList,
  ResponsiveDataView,
} from "~/components/ui/mobile-data-cards";
import {
  listMembers,
  type MemberDirectoryMember,
  type MemberDirectoryResponse,
} from "~/features/members";
import { exportToCSV, formatDate } from "~/lib/utils/csv-export";

export const Route = createFileRoute("/dashboard/members")({
  component: MembersPage,
});

function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedMember, setSelectedMember] = useState<MemberDirectoryMember | null>(
    null,
  );

  const { data, isLoading, isFetching, error } = useQuery<
    MemberDirectoryResponse,
    Error,
    MemberDirectoryResponse
  >({
    queryKey: ["members-directory", { search: deferredSearch }],
    queryFn: async (): Promise<MemberDirectoryResponse> => {
      const payload = deferredSearch ? { search: deferredSearch } : {};
      const result = await listMembers({ data: payload });

      if (!result.success || !result.data) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to fetch member directory",
        );
      }

      return result.data;
    },
  });

  const columns = useMemo<ColumnDef<MemberDirectoryMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="space-y-1">
              <div className="leading-none font-medium">{member.name}</div>
              <div className="text-muted-foreground text-xs">
                {member.pronouns || "Pronouns not provided"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "teams",
        header: "Active Teams",
        cell: ({ row }) => {
          const teams = row.original.teams;

          if (!teams.length) {
            return <span className="text-muted-foreground text-sm">No active team</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {teams.map((team) => (
                <Badge key={team} variant="secondary" className="text-xs">
                  {team}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "membershipStatus",
        header: "Membership",
        cell: ({ row }) => {
          const { membershipStatus, hasActiveMembership, membershipType } = row.original;
          const badgeClass = hasActiveMembership
            ? "bg-green-100 text-green-800"
            : membershipStatus === "expired"
              ? "bg-amber-100 text-amber-800"
              : membershipStatus === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-200 text-gray-700";
          const label = hasActiveMembership
            ? "Active"
            : membershipStatus === "none"
              ? "No membership"
              : membershipStatus.charAt(0).toUpperCase() + membershipStatus.slice(1);

          return (
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className={`text-xs font-medium ${badgeClass}`}>
                {label}
              </Badge>
              {membershipType ? (
                <span className="text-muted-foreground text-xs">{membershipType}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "membershipEndDate",
        header: "Expires",
        cell: ({ row }) => {
          const { membershipEndDate, hasActiveMembership } = row.original;

          if (!membershipEndDate) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <span
              className={`text-sm ${hasActiveMembership ? "text-green-700" : "text-muted-foreground"}`}
            >
              {formatDate(membershipEndDate)}
            </span>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <Mail className="text-muted-foreground h-3.5 w-3.5" />
                {member.emailVisible && member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-primary hover:underline"
                  >
                    {member.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Hidden</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="text-muted-foreground h-3.5 w-3.5" />
                {member.phoneVisible && member.phone ? (
                  <span>{member.phone}</span>
                ) : (
                  <span className="text-muted-foreground">Hidden</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMember(row.original)}
          >
            View
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [setSelectedMember],
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleExport = useCallback(() => {
    const members = data?.members;
    if (!members?.length) {
      return;
    }

    const rows = members.map((member) => ({
      Name: member.name,
      Pronouns: member.pronouns || "",
      Email: member.emailVisible && member.email ? member.email : "Hidden",
      Phone: member.phoneVisible && member.phone ? member.phone : "Hidden",
      "Active Teams": member.teams.join(", "),
      "Membership Status": member.membershipStatus,
      "Membership Type": member.membershipType ?? "",
      "Membership Expires": member.membershipEndDate
        ? formatDate(member.membershipEndDate)
        : "",
      "Open to Invites": member.allowTeamInvitations ? "Yes" : "No",
      "Birth Year":
        member.birthYearVisible && member.birthYear ? String(member.birthYear) : "Hidden",
    }));

    const filename = `members-directory-${new Date().toISOString().split("T")[0]}.csv`;
    exportToCSV(rows, filename);
  }, [data]);

  const totalMembers = data?.pagination.total ?? 0;

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Members Directory
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Browse Quadball Canada members, check membership status, and find players open
          to team invitations.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-2 lg:max-w-lg">
          <label htmlFor="member-search" className="text-sm font-medium">
            Search members
          </label>
          <div className="relative flex items-center">
            <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
            <Input
              id="member-search"
              placeholder="Search by name, email, or team"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
              autoComplete="off"
            />
            {searchTerm ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 px-2 text-xs"
                onClick={handleClearSearch}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>{totalMembers} members</span>
          </Badge>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!data?.members?.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground mr-2 h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Loading members…</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load members</AlertTitle>
          <AlertDescription>
            {(error as Error).message ||
              "An unexpected error occurred while loading the member directory."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {isFetching && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing directory…</span>
            </div>
          )}
          <ResponsiveDataView
            table={
              <DataTable
                columns={columns}
                data={data?.members ?? []}
                pageSize={10}
                enableColumnToggle={false}
              />
            }
            cards={
              <MembersMobileCards
                members={data?.members ?? []}
                onSelectMember={setSelectedMember}
              />
            }
          />
          {data?.members?.length === 0 && (
            <div className="border-border bg-muted/30 text-muted-foreground flex flex-col items-center gap-2 rounded-md border p-8 text-center">
              <ShieldCheck className="h-8 w-8" />
              <p>No members match your current search.</p>
            </div>
          )}
        </div>
      )}

      <MemberDetailDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}

interface MembersMobileCardsProps {
  members: MemberDirectoryMember[];
  onSelectMember: (member: MemberDirectoryMember) => void;
}

function MembersMobileCards({ members, onSelectMember }: MembersMobileCardsProps) {
  if (members.length === 0) return null;

  return (
    <MobileDataCardsList>
      {members.map((member) => {
        const statusBadgeClass = member.hasActiveMembership
          ? "bg-green-100 text-green-800"
          : member.membershipStatus === "expired"
            ? "bg-amber-100 text-amber-800"
            : member.membershipStatus === "cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-200 text-gray-700";

        const statusLabel = member.hasActiveMembership
          ? "Active"
          : member.membershipStatus === "none"
            ? "No membership"
            : member.membershipStatus.charAt(0).toUpperCase() +
              member.membershipStatus.slice(1);

        return (
          <MobileDataCard
            key={member.id}
            title={member.name}
            subtitle={member.pronouns || "Pronouns not set"}
            badge={
              <Badge
                variant="secondary"
                className={`text-xs font-medium ${statusBadgeClass}`}
              >
                {statusLabel}
              </Badge>
            }
            fields={[
              {
                label: "Teams",
                value:
                  member.teams.length > 0 ? member.teams.join(", ") : "No active team",
              },
              {
                label: "Email",
                value:
                  member.emailVisible && member.email ? (
                    <span className="text-primary block truncate">{member.email}</span>
                  ) : (
                    <span className="text-muted-foreground">Hidden</span>
                  ),
              },
              {
                label: "Membership Type",
                value: member.membershipType || "—",
              },
              {
                label: "Phone",
                value:
                  member.phoneVisible && member.phone ? (
                    member.phone
                  ) : (
                    <span className="text-muted-foreground">Hidden</span>
                  ),
              },
            ]}
            onClick={() => onSelectMember(member)}
          />
        );
      })}
    </MobileDataCardsList>
  );
}

interface MemberDetailDialogProps {
  member: MemberDirectoryMember | null;
  onClose: () => void;
}

function MemberDetailDialog({ member, onClose }: MemberDetailDialogProps) {
  const open = Boolean(member);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        {member ? (
          <div className="space-y-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl">{member.name}</DialogTitle>
              <DialogDescription>View member profile details</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock title="Membership" icon={<CalendarCheck className="h-4 w-4" />}>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        member.hasActiveMembership
                          ? "bg-green-100 text-green-800"
                          : member.membershipStatus === "expired"
                            ? "bg-amber-100 text-amber-800"
                            : member.membershipStatus === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-200 text-gray-700"
                      }
                    >
                      {member.hasActiveMembership
                        ? "Active"
                        : member.membershipStatus === "none"
                          ? "No membership"
                          : member.membershipStatus.charAt(0).toUpperCase() +
                            member.membershipStatus.slice(1)}
                    </Badge>
                    {member.membershipType ? (
                      <span className="text-muted-foreground text-xs">
                        {member.membershipType}
                      </span>
                    ) : null}
                  </div>
                  {member.membershipEndDate ? (
                    <p className="text-muted-foreground text-xs">
                      Expires: {formatDate(member.membershipEndDate)}
                    </p>
                  ) : null}
                </div>
              </InfoBlock>

              <InfoBlock title="Contact" icon={<Mail className="h-4 w-4" />}>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Email
                    </p>
                    {member.emailVisible && member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-primary hover:underline"
                      >
                        {member.email}
                      </a>
                    ) : (
                      <p className="text-muted-foreground">Hidden (privacy settings)</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Phone
                    </p>
                    {member.phoneVisible && member.phone ? (
                      <p>{member.phone}</p>
                    ) : (
                      <p className="text-muted-foreground">Hidden (privacy settings)</p>
                    )}
                  </div>
                </div>
              </InfoBlock>

              <InfoBlock title="Teams" icon={<Users className="h-4 w-4" />}>
                {member.teams.length ? (
                  <ul className="space-y-1 text-sm">
                    {member.teams.map((team) => (
                      <li key={team}>{team}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No active team</p>
                )}
              </InfoBlock>

              <InfoBlock title="Availability" icon={<ShieldCheck className="h-4 w-4" />}>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Open to Team Invitations
                    </p>
                    <p>{member.allowTeamInvitations ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Birth Year
                    </p>
                    <p>
                      {member.birthYearVisible && member.birthYear
                        ? member.birthYear
                        : "Hidden (privacy settings)"}
                    </p>
                  </div>
                </div>
              </InfoBlock>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Membership history</h3>
              {member.membershipHistory.length ? (
                <div className="rounded-md border">
                  {/* Desktop: Table layout */}
                  <div className="hidden sm:block">
                    <div className="bg-muted/40 text-muted-foreground grid grid-cols-3 gap-2 border-b p-3 text-xs font-semibold uppercase">
                      <span>Status</span>
                      <span>Membership Type</span>
                      <span>Valid Dates</span>
                    </div>
                    <div className="divide-y text-sm">
                      {member.membershipHistory.map((entry, index) => (
                        <div
                          key={`${entry.status}-${entry.endDate ?? index}`}
                          className="grid grid-cols-3 gap-2 p-3"
                        >
                          <span className="font-medium">
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                          <span className="text-muted-foreground">
                            {entry.membershipType || "—"}
                          </span>
                          <span className="text-muted-foreground">
                            {entry.startDate ? formatDate(entry.startDate) : "—"} –{" "}
                            {entry.endDate ? formatDate(entry.endDate) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Mobile: Stacked card layout */}
                  <div className="divide-y sm:hidden">
                    {member.membershipHistory.map((entry, index) => (
                      <div
                        key={`mobile-${entry.status}-${entry.endDate ?? index}`}
                        className="space-y-1 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {entry.membershipType || "—"}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {entry.startDate ? formatDate(entry.startDate) : "—"} –{" "}
                          {entry.endDate ? formatDate(entry.endDate) : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No membership records found for this member.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface InfoBlockProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

function InfoBlock({ title, icon, children }: InfoBlockProps) {
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
