import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GuidedTour } from "./guided-tour";
import { tutorials, type TutorialId } from "../tutorials.config";
import { completeTutorial, dismissTutorial, startTutorial } from "../tutorials.mutations";
import { listTutorialProgress } from "../tutorials.queries";

const statusLabel = (status: string) => {
  if (status === "completed") return "Completed";
  if (status === "dismissed") return "Dismissed";
  if (status === "started") return "In progress";
  return "Not started";
};

export function TutorialPanel({
  title,
  tutorialIds,
}: {
  title?: string;
  tutorialIds?: TutorialId[];
}) {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTourId, setActiveTourId] = useState<TutorialId | null>(null);

  const filteredTutorials = useMemo(() => {
    if (!tutorialIds || tutorialIds.length === 0) return tutorials;
    return tutorials.filter((tutorial) => tutorialIds.includes(tutorial.id));
  }, [tutorialIds]);

  const { data: progress = [] } = useQuery({
    queryKey: ["tutorials", "progress", tutorialIds ?? "all"],
    queryFn: () =>
      listTutorialProgress({
        data: { tutorialIds: filteredTutorials.map((tutorial) => tutorial.id) },
      }),
  });

  const progressById = useMemo(
    () => new Map(progress.map((item) => [item.tutorialId, item])),
    [progress],
  );

  const mutationHandlers = {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tutorials", "progress"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Tutorial update failed.");
    },
  };

  const startMutation = useMutation({
    mutationFn: (tutorialId: string) => startTutorial({ data: { tutorialId } }),
    ...mutationHandlers,
  });

  const completeMutation = useMutation({
    mutationFn: (tutorialId: string) => completeTutorial({ data: { tutorialId } }),
    ...mutationHandlers,
  });

  const dismissMutation = useMutation({
    mutationFn: (tutorialId: string) => dismissTutorial({ data: { tutorialId } }),
    ...mutationHandlers,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? "Guided walkthroughs"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredTutorials.map((tutorial) => {
          const progressItem = progressById.get(tutorial.id);
          const status = progressItem?.status ?? "not_started";
          const isOpen = openId === tutorial.id;

          return (
            <div key={tutorial.id} className="space-y-3 rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{tutorial.title}</p>
                  <p className="text-muted-foreground text-xs">{tutorial.description}</p>
                </div>
                <Badge variant={status === "completed" ? "secondary" : "outline"}>
                  {statusLabel(status)}
                </Badge>
              </div>

              {isOpen ? (
                <div className="space-y-3">
                  <ol className="space-y-2 text-sm">
                    {tutorial.steps.map((step, index) => (
                      <li key={step.title} className="bg-muted/30 rounded-md p-2">
                        <p className="font-medium">
                          {index + 1}. {step.title}
                        </p>
                        <p className="text-muted-foreground text-xs">{step.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenId(isOpen ? null : tutorial.id)}
                >
                  {isOpen ? "Hide steps" : "View steps"}
                </Button>
                {status === "not_started" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      startMutation.mutate(tutorial.id);
                      setActiveTourId(tutorial.id);
                    }}
                  >
                    Start tour
                  </Button>
                ) : null}
                {status === "started" ? (
                  <>
                    <Button size="sm" onClick={() => setActiveTourId(tutorial.id)}>
                      Resume tour
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => completeMutation.mutate(tutorial.id)}
                    >
                      Mark complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        dismissMutation.mutate(tutorial.id);
                        if (activeTourId === tutorial.id) {
                          setActiveTourId(null);
                        }
                      }}
                    >
                      Dismiss
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
      {activeTourId ? (
        <GuidedTour
          tutorialId={activeTourId}
          onClose={() => setActiveTourId(null)}
          onComplete={() => completeMutation.mutate(activeTourId)}
          onDismiss={() => dismissMutation.mutate(activeTourId)}
        />
      ) : null}
    </Card>
  );
}
