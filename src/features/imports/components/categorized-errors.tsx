import type { AnalysisResult, CategorizedError } from "~/features/imports/error-analyzer";
import { Button } from "~/components/ui/button";

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
                    {error.autofix && error.autofix.confidence >= 0.8 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => props.onAutofix(error)}
                      >
                        Autofix
                      </Button>
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
