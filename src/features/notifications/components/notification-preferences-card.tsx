import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { updateNotificationPreferences } from "../notifications.mutations";
import { getNotificationPreferences } from "../notifications.queries";

const categories = [
  { value: "reporting", label: "Reporting" },
  { value: "security", label: "Security" },
  { value: "support", label: "Support" },
  { value: "system", label: "System" },
];

const frequencies = [
  { value: "immediate", label: "Immediate" },
  { value: "daily_digest", label: "Daily digest" },
  { value: "weekly_digest", label: "Weekly digest" },
  { value: "never", label: "Never" },
];

export function NotificationPreferencesCard() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => getNotificationPreferences(),
  });

  const updateMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const preference = data.find((item) => item.category === category.value);
          return (
            <div
              key={category.value}
              className="flex flex-col gap-3 border-b border-gray-200 pb-4 last:border-none last:pb-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{category.label}</p>
                  <p className="text-muted-foreground text-xs">
                    Control how you receive {category.label.toLowerCase()} updates.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={preference?.channelInApp ?? true}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({
                        data: {
                          category: category.value,
                          channelInApp: Boolean(checked),
                        },
                      })
                    }
                  />
                  In-app
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={preference?.channelEmail ?? true}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({
                        data: {
                          category: category.value,
                          channelEmail: Boolean(checked),
                        },
                      })
                    }
                  />
                  Email
                </label>
                <Select
                  value={preference?.emailFrequency ?? "immediate"}
                  onValueChange={(value) =>
                    updateMutation.mutate({
                      data: {
                        category: category.value,
                        emailFrequency: value as
                          | "immediate"
                          | "daily_digest"
                          | "weekly_digest"
                          | "never",
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((frequency) => (
                      <SelectItem key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
