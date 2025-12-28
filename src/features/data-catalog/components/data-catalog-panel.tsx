import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { syncDataCatalog } from "../data-catalog.mutations";
import { listDataCatalogEntries } from "../data-catalog.queries";

const sourceOptions = [
  { value: "all", label: "All sources" },
  { value: "form", label: "Forms" },
  { value: "import_template", label: "Import templates" },
  { value: "saved_report", label: "Saved reports" },
  { value: "template", label: "Templates" },
];

export function DataCatalogPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["data-catalog", search, source],
    queryFn: () =>
      listDataCatalogEntries({
        data: {
          search: search.trim() ? search.trim() : undefined,
          sourceType: source === "all" ? undefined : source,
        },
      }),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncDataCatalog({ data: {} }),
    onSuccess: (result) => {
      toast.success(`Catalog synced (${result.count} entries).`);
      void queryClient.invalidateQueries({ queryKey: ["data-catalog"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Catalog sync failed.");
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Data catalog</CardTitle>
        <Button size="sm" variant="outline" onClick={() => syncMutation.mutate()}>
          Sync catalog
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search catalog"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading catalog…</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No catalog entries yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm font-medium">{entry.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {entry.sourceType}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {entry.organizationId ?? "Global"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {entry.sourceUpdatedAt
                        ? new Date(entry.sourceUpdatedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
