import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeftIcon } from "~/components/ui/icons";
import { EventForm } from "~/features/events/components/EventForm";
import { createEvent } from "~/features/events/events.mutations";
import { createEventSchema } from "~/features/events/events.schemas";

export const Route = createFileRoute("/dashboard/events/create")({
  component: CreateEventPage,
});

function CreateEventPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (args: { data: z.infer<typeof createEventSchema> }) => {
      return await createEvent({ data: args.data });
    },
    onSuccess: (res) => {
      if (res.success) {
        navigate({ to: `/dashboard/events/${res.data!.id}` });
      } else {
        const msg =
          ("errors" in res && res.errors?.[0]?.message) || "Failed to create event";
        setServerError(msg);
      }
    },
    onError: (err: unknown) => {
      setServerError(err instanceof Error ? err.message : "Failed to create event");
    },
  });

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/events">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Create a New Event</CardTitle>
          <CardDescription>Set up your event and open registration</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 mb-4 flex items-start gap-3 rounded-lg border p-4">
              <div className="flex-1">
                <p className="font-medium">Error creating event</p>
                <p className="mt-1 text-sm">{serverError}</p>
              </div>
            </div>
          )}

          <EventForm
            onSubmit={async (values) => {
              setServerError(null);
              await createMutation.mutateAsync({ data: values });
            }}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
