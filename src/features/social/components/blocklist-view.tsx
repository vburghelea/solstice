import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, LoaderCircle, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { unblockUser } from "../social.mutations";
import { getBlocklist } from "../social.queries";
import type { BlocklistItem } from "../social.types";

export function BlocklistView() {
  const queryClient = useQueryClient();
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [confirmUnblock, setConfirmUnblock] = useState<string | null>(null);

  const {
    data: blocklistResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blocklist"],
    queryFn: async () => getBlocklist({}),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const blocklist = blocklistResult?.success ? blocklistResult.data : null;

  const handleUnblockUser = async (userId: string) => {
    setUnblockingUserId(userId);
    try {
      const result = await unblockUser({ data: { userId } });

      if (result.success) {
        toast.success("User unblocked successfully");
        setConfirmUnblock(null);
        // Invalidate blocklist cache
        queryClient.invalidateQueries({ queryKey: ["blocklist"] });
      } else {
        const errorMessage = result.errors?.[0]?.message || "Failed to unblock user";
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setUnblockingUserId(null);
    }
  };

  // Handle loading state
  if (isLoading && !blocklistResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">Loading blocklist...</span>
      </div>
    );
  }

  // Handle error state
  if (error && !blocklist) {
    const errorMessage =
      (blocklistResult && !blocklistResult.success
        ? blocklistResult.errors?.[0]?.message
        : undefined) ||
      error?.message ||
      "Failed to load blocklist";
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  // If we don't have data but also don't have an error, show loading
  if (!blocklist) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">Loading blocklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            <CardTitle>Blocklist</CardTitle>
          </div>
          <CardDescription>
            Users you have blocked from interacting with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blocklist.items.length === 0 ? (
              <div className="py-8 text-center">
                <Ban className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-medium">No blocked users</h3>
                <p className="text-muted-foreground text-sm">
                  You haven't blocked any users yet.
                </p>
              </div>
            ) : (
              <>
                <div className="text-muted-foreground text-sm">
                  {blocklist.totalCount} {blocklist.totalCount === 1 ? "user" : "users"}{" "}
                  blocked
                </div>

                <div className="space-y-3">
                  {blocklist.items.map((item: BlocklistItem) => (
                    <BlockedUserItem
                      key={item.id}
                      item={item}
                      onUnblock={() => setConfirmUnblock(item.user.id)}
                      unblockingUserId={unblockingUserId}
                      confirmUnblock={confirmUnblock}
                      onConfirmUnblock={handleUnblockUser}
                      onCancelUnblock={() => setConfirmUnblock(null)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BlockedUserItemProps {
  item: BlocklistItem;
  onUnblock: () => void;
  unblockingUserId: string | null;
  confirmUnblock: string | null;
  onConfirmUnblock: (userId: string) => Promise<void>;
  onCancelUnblock: () => void;
}

function BlockedUserItem({
  item,
  onUnblock,
  unblockingUserId,
  confirmUnblock,
  onConfirmUnblock,
  onCancelUnblock,
}: BlockedUserItemProps) {
  const isUnblocking = unblockingUserId === item.user.id;
  const isConfirming = confirmUnblock === item.user.id;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar
            className="h-10 w-10"
            name={item.user.name}
            email={item.user.email}
            srcUploaded={item.user.uploadedAvatarPath ?? null}
            srcProvider={item.user.image ?? null}
          />
          <div className="space-y-1">
            <div className="font-medium">{item.user.name}</div>
            <div className="text-muted-foreground text-sm">{item.user.email}</div>
            <div className="text-muted-foreground text-xs">
              Blocked {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            <UserX className="mr-1 h-3 w-3" />
            Blocked
          </Badge>
        </div>
      </div>

      {item.reason && (
        <>
          <Separator />
          <div>
            <div className="mb-1 text-sm font-medium">Reason</div>
            <div className="text-muted-foreground text-sm">{item.reason}</div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Dialog open={isConfirming} onOpenChange={(open) => !open && onCancelUnblock()}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onUnblock}
              disabled={isUnblocking}
            >
              {isUnblocking ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Unblocking...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unblock
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unblock User</DialogTitle>
              <DialogDescription>
                Are you sure you want to unblock {item.user.name}? They will be able to
                follow you, invite you to games, and interact with you again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onCancelUnblock} disabled={isUnblocking}>
                Cancel
              </Button>
              <Button
                onClick={() => onConfirmUnblock(item.user.id)}
                disabled={isUnblocking}
              >
                {isUnblocking ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Unblocking...
                  </>
                ) : (
                  "Yes, Unblock"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
