import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { lockUserAccount, unlockUserAccount } from "../security.mutations";
import { listAccountLocks, listSecurityEvents } from "../security.queries";

export function SecurityDashboard() {
  const queryClient = useQueryClient();
  const [targetUserId, setTargetUserId] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [unlockReason, setUnlockReason] = useState("");

  const { data: events = [] } = useQuery({
    queryKey: ["security", "events"],
    queryFn: () => listSecurityEvents({ data: {} }),
  });

  const { data: locks = [] } = useQuery({
    queryKey: ["security", "locks"],
    queryFn: () => listAccountLocks(),
  });

  const lockMutation = useMutation({
    mutationFn: (payload: { userId: string; reason: string }) =>
      lockUserAccount({ data: payload }),
    onSuccess: () => {
      setLockReason("");
      void queryClient.invalidateQueries({ queryKey: ["security"] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (payload: { userId: string; reason?: string }) =>
      unlockUserAccount({ data: payload }),
    onSuccess: () => {
      setUnlockReason("");
      void queryClient.invalidateQueries({ queryKey: ["security"] });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Account Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Input
            placeholder="User ID"
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                placeholder="Lock reason"
                value={lockReason}
                onChange={(event) => setLockReason(event.target.value)}
              />
              <Button
                type="button"
                onClick={() =>
                  lockMutation.mutate({ userId: targetUserId, reason: lockReason })
                }
                disabled={!targetUserId || !lockReason || lockMutation.isPending}
              >
                {lockMutation.isPending ? "Locking..." : "Lock account"}
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Unlock reason (optional)"
                value={unlockReason}
                onChange={(event) => setUnlockReason(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  unlockMutation.mutate({
                    userId: targetUserId,
                    ...(unlockReason ? { reason: unlockReason } : {}),
                  })
                }
                disabled={!targetUserId || unlockMutation.isPending}
              >
                {unlockMutation.isPending ? "Unlocking..." : "Unlock account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {events.length === 0 ? (
            <p className="text-muted-foreground">No security events recorded.</p>
          ) : (
            events.slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <span>{event.eventType}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Locks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {locks.length === 0 ? (
            <p className="text-muted-foreground">No active locks.</p>
          ) : (
            locks.slice(0, 8).map((lock) => (
              <div key={lock.id} className="flex items-center justify-between">
                <span>{lock.reason}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(lock.lockedAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
