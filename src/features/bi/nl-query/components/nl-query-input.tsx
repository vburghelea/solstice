import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { interpretNlQuery } from "../nl-query.mutations";
import type { QueryIntent } from "../nl-query.schemas";
import type { NlQueryExecutionResult } from "./nl-query.types";
import { QueryPreviewDialog } from "./query-preview";

export interface NlQueryInputProps {
  organizationId?: string | undefined;
  onQueryExecuted?: ((result: NlQueryExecutionResult) => void) | undefined;
}

const EXAMPLE_QUESTIONS = [
  "How many registrations by sport in 2023?",
  "Show me total participants by organization",
  "What are the monthly submission counts?",
];

export function NlQueryInput({ organizationId, onQueryExecuted }: NlQueryInputProps) {
  const [question, setQuestion] = useState("");
  const [preview, setPreview] = useState<QueryIntent | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const interpretMutation = useMutation({
    mutationFn: async (questionText: string) => {
      return interpretNlQuery({
        data: {
          question: questionText,
          organizationId,
        },
      });
    },
    onSuccess: (result) => {
      setPreview(result.intent);
      setLatencyMs(result.latencyMs);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to interpret question",
      );
    },
  });

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    interpretMutation.mutate(trimmed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    setQuestion(example);
    interpretMutation.mutate(example);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder="Ask a question about your data..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={interpretMutation.isPending}
          className="pr-24"
          aria-label="Natural language query input"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={interpretMutation.isPending || !question.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          {interpretMutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
          )}
          Ask AI
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLE_QUESTIONS.map((example) => (
          <Button
            key={example}
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => handleExampleClick(example)}
            disabled={interpretMutation.isPending}
          >
            {example}
          </Button>
        ))}
      </div>

      {preview && (
        <QueryPreviewDialog
          intent={preview}
          organizationId={organizationId}
          latencyMs={latencyMs}
          onClose={() => setPreview(null)}
          onQueryExecuted={(result) => {
            setPreview(null);
            setQuestion("");
            onQueryExecuted?.(result);
          }}
        />
      )}
    </div>
  );
}
