import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { markNotificationRead } from "../notifications.mutations";
import { getUnreadNotificationCount, listNotifications } from "../notifications.queries";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications({ data: { unreadOnly: false, limit: 10 } }),
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead({ data: { notificationId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <span className="text-muted-foreground text-xs">{unreadCount} unread</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <Button
                key={notification.id}
                type="button"
                variant="outline"
                className="h-auto w-full items-start justify-between gap-2 px-3 py-2 text-left whitespace-normal"
                onClick={() => {
                  if (!notification.readAt) {
                    markReadMutation.mutate(notification.id);
                  }
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold">{notification.title}</span>
                  {!notification.readAt && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{notification.body}</p>
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
