import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "~/components/ui/button";
import { tutorials, type TutorialId } from "../tutorials.config";

type GuidedTourProps = {
  tutorialId: TutorialId;
  onClose: () => void;
  onComplete: () => void;
  onDismiss: () => void;
};

type TourStep = {
  title: string;
  body: string;
  target: string;
  route?: string;
};

const highlightPadding = 8;

export function GuidedTour({
  tutorialId,
  onClose,
  onComplete,
  onDismiss,
}: GuidedTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetFound, setTargetFound] = useState(true);

  const tutorial = useMemo(
    () => tutorials.find((item) => item.id === tutorialId) ?? null,
    [tutorialId],
  );
  const steps = (tutorial?.tourSteps ?? []) as TourStep[];
  const step = steps[stepIndex] ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStepIndex(0);
  }, [tutorialId]);

  useEffect(() => {
    if (!step?.route) return;
    if (location.pathname === step.route) return;
    void navigate({ to: step.route });
  }, [location.pathname, navigate, step?.route]);

  useLayoutEffect(() => {
    if (!step?.target) {
      setTargetFound(false);
      setTargetRect(null);
      return;
    }

    const resolveTarget = () => {
      const element = document.querySelector(step.target) as HTMLElement | null;
      if (!element) {
        setTargetFound(false);
        setTargetRect(null);
        return;
      }
      setTargetFound(true);
      setTargetRect(element.getBoundingClientRect());
    };

    resolveTarget();

    const onScroll = () => resolveTarget();
    const onResize = () => resolveTarget();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [step?.target, location.pathname]);

  if (!mounted || !tutorial || steps.length === 0) return null;

  const totalSteps = steps.length;
  const isLastStep = stepIndex === totalSteps - 1;

  const highlightStyle =
    targetRect && targetFound
      ? {
          top: Math.max(targetRect.top - highlightPadding, 8),
          left: Math.max(targetRect.left - highlightPadding, 8),
          width: Math.max(targetRect.width + highlightPadding * 2, 24),
          height: Math.max(targetRect.height + highlightPadding * 2, 24),
        }
      : null;

  const panelTop = highlightStyle
    ? Math.min(highlightStyle.top + highlightStyle.height + 16, window.innerHeight - 260)
    : Math.min(120, window.innerHeight - 260);

  const panelLeft = highlightStyle
    ? Math.min(highlightStyle.left, window.innerWidth - 360)
    : Math.max(24, window.innerWidth / 2 - 160);

  const panelStyle = {
    top: Math.max(panelTop, 24),
    left: Math.max(panelLeft, 24),
  };

  const body = (
    <div className="fixed inset-0 z-[60]">
      {highlightStyle ? (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]"
          style={highlightStyle}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-slate-900/40" />
      )}

      <div
        className="fixed z-[70] w-[320px] rounded-xl border bg-white p-4 shadow-xl"
        style={panelStyle}
      >
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <p className="text-base font-semibold">{step?.title ?? "Step"}</p>
          <p className="text-muted-foreground text-sm">
            {targetFound ? step?.body : "Target not available on this page."}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDismiss();
              onClose();
            }}
          >
            Exit tour
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                  onClose();
                  return;
                }
                setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
              }}
            >
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
