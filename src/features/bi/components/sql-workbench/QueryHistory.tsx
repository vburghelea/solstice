import { Button } from "~/components/ui/button";

export type QueryHistoryEntry = {
  id: string;
  sql: string;
  datasetId: string;
  organizationId: string | null;
  createdAt: string;
};

export function QueryHistory({
  history,
  datasetLabels,
  onSelect,
}: {
  history: QueryHistoryEntry[];
  datasetLabels: Map<string, string>;
  onSelect: (entry: QueryHistoryEntry) => void;
}) {
  if (history.length === 0) {
    return <p className="text-muted-foreground text-xs">No queries yet.</p>;
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <Button
          key={entry.id}
          variant="ghost"
          className="w-full justify-start text-left text-xs"
          onClick={() => onSelect(entry)}
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{datasetLabels.get(entry.datasetId) ?? entry.datasetId}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <span className="text-xs font-medium">{entry.sql.slice(0, 140)}</span>
          </div>
        </Button>
      ))}
    </div>
  );
}
