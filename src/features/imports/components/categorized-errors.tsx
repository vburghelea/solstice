import { Info, Sparkles, Wand2 } from "lucide-react";
import type { AnalysisResult, CategorizedError } from "~/features/imports/error-analyzer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface CategorizedErrorsProps {
  analysis: AnalysisResult;
  ignoredErrorIds: Set<string>;
  onAutofix: (error: CategorizedError) => void;
  onIgnoreError: (errorId: string) => void;
}

const categoryLabels: Record<CategorizedError["category"], string> = {
  structural: "Structural Issues",
  data_quality: "Data Quality Issues",
  completeness: "Completeness Issues",
  referential: "Referential Issues",
};

/**
 * Display confidence level with color-coded badge and optional tooltip.
 */
function ConfidenceBadge({
  confidence,
  reason,
}: {
  confidence: number;
  reason?: string;
}) {
  const percent = Math.round(confidence * 100);

  // Color based on confidence level
  const variant: "default" | "secondary" | "outline" =
    confidence >= 0.9 ? "default" : confidence >= 0.7 ? "secondary" : "outline";

  const badgeContent = (
    <Badge variant={variant} className="gap-1 text-xs">
      {confidence >= 0.9 && <Sparkles className="h-3 w-3" />}
      {percent}%
    </Badge>
  );

  if (!reason) {
    return badgeContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{badgeContent}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <p className="text-xs">{reason}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CategorizedErrors(props: CategorizedErrorsProps) {
  const visibleErrors = props.analysis.errors.filter(
    (error) => !props.ignoredErrorIds.has(error.id),
  );
  if (visibleErrors.length === 0) {
    return <p className="text-sm text-muted-foreground">No errors detected.</p>;
  }

  const grouped = visibleErrors.reduce<Record<string, CategorizedError[]>>(
    (acc, error) => {
      const key = error.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(error);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, errors]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{categoryLabels[category as CategorizedError["category"]]}</span>
            <span className="text-muted-foreground">{errors.length}</span>
          </div>
          <div className="space-y-2">
            {errors.map((error) => (
              <div key={error.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{error.summary}</p>
                    <p className="text-xs text-muted-foreground">{error.details}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {error.autofix ? (
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <ConfidenceBadge
                            confidence={error.autofix.confidence}
                            {...(error.autofix.confidenceReason && {
                              reason: error.autofix.confidenceReason,
                            })}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant={
                                  error.autofix.confidence >= 0.8 ? "default" : "outline"
                                }
                                className="gap-1"
                                onClick={() => props.onAutofix(error)}
                              >
                                <Wand2 className="h-3 w-3" />
                                Autofix
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-medium">{error.autofix.preview}</p>
                              {error.autofix.confidenceReason && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {error.autofix.confidenceReason}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.onIgnoreError(error.id)}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
                {error.affectedColumns.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Columns: {error.affectedColumns.join(", ")}
                  </p>
                ) : null}
                {error.autofix?.preview ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Autofix preview: {error.autofix.preview}
                  </p>
                ) : null}
                {error.sampleValues.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Examples: {error.sampleValues.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
