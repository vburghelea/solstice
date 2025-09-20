import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

interface DataErrorStateProps {
  title?: string;
  description?: string | undefined;
  retryLabel?: string;
  onRetry?: () => void;
}

export function DataErrorState({
  title = "Something went wrong",
  description = "We couldn’t load this data. Please try again in a moment.",
  retryLabel = "Retry",
  onRetry,
}: DataErrorStateProps) {
  return (
    <div className="border-destructive/20 bg-destructive/10 flex flex-col items-center justify-center gap-4 rounded-xl border p-6 text-center">
      <div className="text-destructive flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-wide uppercase">Error</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
