import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { createInviteLink, revokeInviteLink } from "../invite-links.mutations";
import { listInviteLinks } from "../invite-links.queries";

const formatDateTime = (value: Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function InviteLinksPanel({ organizationId }: { organizationId: string }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState("member");
  const [autoApprove, setAutoApprove] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["organizations", "invite-links", organizationId],
    queryFn: () => listInviteLinks({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const parsedMaxUses = maxUses.trim() ? Number(maxUses) : undefined;
      if (parsedMaxUses !== undefined && Number.isNaN(parsedMaxUses)) {
        throw new Error("Max uses must be a number");
      }
      if (parsedMaxUses !== undefined && parsedMaxUses <= 0) {
        throw new Error("Max uses must be greater than 0");
      }

      const parsedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : undefined;

      return createInviteLink({
        data: {
          organizationId,
          role: role as "reporter" | "viewer" | "member",
          autoApprove,
          maxUses: parsedMaxUses,
          expiresAt: parsedExpiresAt,
        },
      });
    },
    onSuccess: () => {
      toast.success("Invite link created.");
      setMaxUses("");
      setExpiresAt("");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "invite-links", organizationId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create link.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => revokeInviteLink({ data: { linkId } }),
    onSuccess: () => {
      toast.success("Invite link revoked.");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "invite-links", organizationId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to revoke link.");
    },
  });

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return import.meta.env.VITE_BASE_URL ?? "";
  }, []);

  const buildLinkUrl = (token: string) =>
    baseUrl ? `${baseUrl}/join/${token}` : `/join/${token}`;

  const copyLink = async (token: string) => {
    const url = buildLinkUrl(token);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied.");
      return;
    }
    toast.error("Copy is not supported in this browser.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite links</CardTitle>
        <CardDescription>
          Generate shareable links for quick organization access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="reporter">Reporter</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id="auto-approve"
              checked={autoApprove}
              onCheckedChange={(checked) => setAutoApprove(Boolean(checked))}
            />
            <Label htmlFor="auto-approve">Auto-approve access</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-uses">Max uses (optional)</Label>
            <Input
              id="max-uses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires-at">Expires at (optional)</Label>
            <Input
              id="expires-at"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-end md:col-span-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create invite link"}
            </Button>
          </div>
        </form>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading invite links...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invite links yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Settings</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="capitalize">{link.role}</TableCell>
                  <TableCell>
                    {link.useCount} / {link.maxUses ?? "∞"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {link.expiresAt ? formatDateTime(link.expiresAt) : "No expiry"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {link.autoApprove ? (
                        <Badge variant="outline">Auto-approve</Badge>
                      ) : (
                        <Badge variant="outline">Approval required</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[240px] text-xs">
                    {buildLinkUrl(link.token)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void copyLink(link.token)}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => revokeMutation.mutate(link.id)}
                        disabled={revokeMutation.isPending}
                      >
                        Revoke
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
