import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  getSocialAudits,
  type GetSocialAuditsInput,
  type SocialAuditRow,
} from "~/features/social/social.admin-queries";

const actionValues = ["follow", "unfollow", "block", "unblock"] as const;
type ActionValue = (typeof actionValues)[number];

export function AdminSocialAuditsReport() {
  const [action, setAction] = useState<ActionValue | "any">("any");
  const [actorUserId, setActorUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filters: GetSocialAuditsInput = {
    action: action === "any" ? undefined : action,
    actorUserId: actorUserId || undefined,
    targetUserId: targetUserId || undefined,
    page,
    pageSize,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-social-audits", filters],
    queryFn: () => getSocialAudits({ data: filters }),
    refetchOnMount: "always",
  });

  const items = data?.success ? data.data.items : [];
  const totalCount = data?.success ? data.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Audits</CardTitle>
        <CardDescription>
          Admin-only view of follow/block actions for moderation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label>Action</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as ActionValue | "any")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {actionValues.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Actor User ID</Label>
            <Input
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
              placeholder="user id"
            />
          </div>
          <div>
            <Label>Target User ID</Label>
            <Input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="user id"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setPage(1);
                refetch();
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">UI Surface</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-3 py-3" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-3 py-3" colSpan={6}>
                    No audit rows
                  </td>
                </tr>
              ) : (
                items.map((row: SocialAuditRow) => {
                  type AuditMetadata = {
                    uiSurface?: string;
                    reason?: string;
                    [k: string]: unknown;
                  };
                  const md = (row.metadata ?? {}) as AuditMetadata;
                  const uiSurface = md.uiSurface ?? "";
                  const reason = md.reason ?? "";
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 capitalize">{row.action}</td>
                      <td className="px-3 py-2">
                        {row.actor ? (
                          <Link
                            to="/dashboard/profile/$userId"
                            params={{ userId: row.actor.id }}
                            className="inline-flex items-center gap-2"
                          >
                            <Avatar
                              name={row.actor.name}
                              email={row.actor.email}
                              srcUploaded={row.actor.uploadedAvatarPath}
                              srcProvider={row.actor.image}
                              className="h-5 w-5"
                            />
                            <span>
                              {row.actor.name || row.actor.email || row.actor.id}
                            </span>
                          </Link>
                        ) : row.actorUserId ? (
                          <Link
                            to="/dashboard/profile/$userId"
                            params={{ userId: row.actorUserId }}
                            className="underline"
                          >
                            {row.actorUserId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.target ? (
                          <Link
                            to="/dashboard/profile/$userId"
                            params={{ userId: row.target.id }}
                            className="inline-flex items-center gap-2"
                          >
                            <Avatar
                              name={row.target.name}
                              email={row.target.email}
                              srcUploaded={row.target.uploadedAvatarPath}
                              srcProvider={row.target.image}
                              className="h-5 w-5"
                            />
                            <span>
                              {row.target.name || row.target.email || row.target.id}
                            </span>
                          </Link>
                        ) : row.targetUserId ? (
                          <Link
                            to="/dashboard/profile/$userId"
                            params={{ userId: row.targetUserId }}
                            className="underline"
                          >
                            {row.targetUserId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">{uiSurface}</td>
                      <td className="px-3 py-2">{reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Page {page} of {totalPages} • {totalCount} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
