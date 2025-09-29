import { ThumbsDown, ThumbsUp } from "lucide-react";
import { FormEvent, useId, useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { trackComingSoonFeedback } from "~/features/roles/role-analytics";
import { useActivePersona } from "~/features/roles/role-switcher-context";
import { useFeatureFlag } from "~/lib/feature-flags";
import { cn } from "~/shared/lib/utils";

export interface PersonaComingSoonProps {
  title: string;
  description: string;
  personaLabel?: string;
  featureFlag?: string;
  feedbackPrompt?: string;
  suggestionPlaceholder?: string;
  className?: string;
}

type QuickFeedbackType = "like" | "dislike";
type FeedbackType = QuickFeedbackType | "suggest";

const FEEDBACK_ERROR_MESSAGE =
  "We couldn't record that feedback. Please try again in a moment.";

export function PersonaComingSoon({
  title,
  description,
  personaLabel,
  featureFlag,
  feedbackPrompt,
  suggestionPlaceholder,
  className,
}: PersonaComingSoonProps) {
  const activePersona = useActivePersona();
  const { analytics, id, namespacePath, label } = activePersona;
  const resolvedPersonaLabel = personaLabel ?? label;
  const resolvedFeatureFlag = useMemo(
    () => featureFlag ?? `persona-coming-soon-${id}`,
    [featureFlag, id],
  );
  const isVisible = useFeatureFlag(resolvedFeatureFlag, true);
  const textareaId = useId();
  const [message, setMessage] = useState("");
  const [pendingType, setPendingType] = useState<FeedbackType | null>(null);
  const [acknowledgedType, setAcknowledgedType] = useState<FeedbackType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isVisible) {
    return null;
  }

  const thankYouMessage = `Thanks! Your perspective is shaping the ${resolvedPersonaLabel.toLowerCase()} workspace.`;
  const promptText =
    feedbackPrompt ??
    `What should the ${resolvedPersonaLabel.toLowerCase()} experience unlock first?`;
  const placeholderText =
    suggestionPlaceholder ??
    `Share workflows, KPIs, or decisions this ${resolvedPersonaLabel.toLowerCase()} surface should support.`;

  const suggestionSubmitted = acknowledgedType === "suggest";

  const handleQuickFeedback = async (type: QuickFeedbackType) => {
    if (pendingType !== null || acknowledgedType === type) {
      return;
    }

    setPendingType(type);
    setErrorMessage(null);

    try {
      await trackComingSoonFeedback(analytics, {
        personaId: id,
        namespacePath,
        feedbackType: type,
      });
      setAcknowledgedType(type);
    } catch (submissionError) {
      console.error("Failed to send quick persona feedback", submissionError);
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : FEEDBACK_ERROR_MESSAGE,
      );
    } finally {
      setPendingType(null);
    }
  };

  const handleSuggestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pendingType === "suggest" || suggestionSubmitted) {
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage("Add a quick note before sending your suggestion.");
      return;
    }

    setPendingType("suggest");
    setErrorMessage(null);

    try {
      await trackComingSoonFeedback(analytics, {
        personaId: id,
        namespacePath,
        feedbackType: "suggest",
        message: trimmed,
      });
      setAcknowledgedType("suggest");
      setMessage("");
    } catch (submissionError) {
      console.error("Failed to send persona suggestion", submissionError);
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : FEEDBACK_ERROR_MESSAGE,
      );
    } finally {
      setPendingType(null);
    }
  };

  return (
    <Card className={cn("border-border/80 bg-card/70 border border-dashed", className)}>
      <CardHeader className="space-y-3">
        <Badge
          className="border-primary/40 bg-primary/10 text-primary w-fit uppercase"
          variant="outline"
        >
          Coming soon
        </Badge>
        <CardTitle className="text-xl leading-tight font-semibold">{title}</CardTitle>
        <CardDescription className="space-y-2 text-base leading-relaxed">
          <p>{description}</p>
          <p className="text-muted-foreground text-sm">
            {`We're actively interviewing ${resolvedPersonaLabel.toLowerCase()} voices to prioritize delivery.`}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void handleQuickFeedback("like")}
            disabled={pendingType !== null || acknowledgedType === "like"}
          >
            <ThumbsUp className="size-4" />
            I'm excited
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleQuickFeedback("dislike")}
            disabled={pendingType !== null || acknowledgedType === "dislike"}
          >
            <ThumbsDown className="size-4" />
            Needs more
          </Button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(event) => void handleSuggestionSubmit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor={textareaId}>{promptText}</Label>
            <Textarea
              id={textareaId}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={placeholderText}
              disabled={pendingType === "suggest" || suggestionSubmitted}
              rows={4}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="secondary"
              disabled={pendingType === "suggest" || suggestionSubmitted}
            >
              Share suggestion
            </Button>
            {pendingType === "suggest" ? (
              <span className="text-muted-foreground text-sm">Sending…</span>
            ) : null}
          </div>
        </form>
        <div className="space-y-2" aria-live="polite">
          {acknowledgedType ? (
            <p className="text-sm font-semibold text-emerald-600">{thankYouMessage}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {`We'll fold this into the next release of the ${resolvedPersonaLabel.toLowerCase()} workspace.`}
            </p>
          )}
          {errorMessage ? (
            <p className="text-destructive text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
