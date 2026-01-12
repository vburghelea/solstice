import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useLiveAnnouncer } from "~/hooks/useLiveAnnouncer";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  onExport?: () => void;
  enableColumnToggle?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  onExport,
  enableColumnToggle = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const { announcePolite } = useLiveAnnouncer();
  const previousVisibility = useRef<VisibilityState>({});
  const hasAnnouncedPagination = useRef(false);
  const hasAnnouncedSorting = useRef(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const canRenderToolbar = enableColumnToggle || Boolean(onExport);
  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const totalPages = table.getPageCount();

  const getColumnLabel = (columnId: string) => {
    const column = table.getColumn(columnId);
    const header = column?.columnDef.header;
    if (typeof header === "string") return header;
    if (typeof header === "number") return String(header);
    return columnId;
  };

  useEffect(() => {
    if (!announcePolite) return;
    if (!sorting.length) {
      if (hasAnnouncedSorting.current) {
        announcePolite("Sorting cleared");
      }
      hasAnnouncedSorting.current = true;
      return;
    }
    const [currentSort] = sorting;
    const direction = currentSort.desc ? "descending" : "ascending";
    const label = getColumnLabel(currentSort.id);
    announcePolite(`Sorted by ${label} ${direction}`);
    hasAnnouncedSorting.current = true;
  }, [announcePolite, sorting]);

  useEffect(() => {
    if (!announcePolite) return;
    if (!hasAnnouncedPagination.current) {
      hasAnnouncedPagination.current = true;
      return;
    }
    const totalPages = table.getPageCount();
    announcePolite(
      `Page ${pageIndex + 1} of ${totalPages || 1}, showing up to ${currentPageSize} rows`,
    );
  }, [announcePolite, currentPageSize, pageIndex, totalPages]);

  useEffect(() => {
    if (!announcePolite) return;

    const changedColumn = Object.keys(columnVisibility).find(
      (key) => previousVisibility.current[key] !== columnVisibility[key],
    );

    if (changedColumn) {
      const isVisible = columnVisibility[changedColumn] ?? true;
      const label = getColumnLabel(changedColumn);
      announcePolite(`${label} ${isVisible ? "shown" : "hidden"}`);
    }

    previousVisibility.current = columnVisibility;
  }, [announcePolite, columnVisibility]);

  return (
    <div className="space-y-4">
      {canRenderToolbar && (
        <div className="flex items-center justify-between">
          {enableColumnToggle ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span />
          )}
          {onExport && (
            <Button onClick={onExport} variant="outline">
              Export CSV
            </Button>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortState = header.column.getIsSorted();
                  const ariaSort =
                    sortState === "asc"
                      ? "ascending"
                      : sortState === "desc"
                        ? "descending"
                        : header.column.getCanSort()
                          ? "none"
                          : undefined;
                  return (
                    <TableHead key={header.id} aria-sort={ariaSort}>
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center space-x-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="data-[state=open]:bg-accent -ml-3 h-8"
                              onClick={header.column.getToggleSortingHandler()}
                              aria-label={`Sort by ${getColumnLabel(header.column.id)}`}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
