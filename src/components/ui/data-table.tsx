import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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
  manualPagination?: boolean;
  pageIndex?: number;
  pageCount?: number;
  onPageChange?: (pageIndex: number) => void;
  isLoading?: boolean;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  onExport,
  enableColumnToggle = true,
  manualPagination = false,
  pageIndex = 0,
  pageCount,
  onPageChange,
  isLoading = false,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const paginationState = manualPagination ? { pageIndex, pageSize } : undefined;
  const resolvedPageCount = manualPagination ? (pageCount ?? -1) : undefined;
  const resolvedRowSelection = enableRowSelection
    ? (rowSelection ?? internalRowSelection)
    : undefined;
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> | undefined =
    enableRowSelection ? (onRowSelectionChange ?? setInternalRowSelection) : undefined;

  const paginationState = manualPagination ? { pageIndex, pageSize } : undefined;
  const resolvedPageCount = manualPagination ? (pageCount ?? -1) : undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(getRowId ? { getRowId } : {}),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableRowSelection ? { enableRowSelection: true } : {}),
    ...(handleRowSelectionChange
      ? { onRowSelectionChange: handleRowSelectionChange }
      : {}),
    state: {
      sorting,
      columnVisibility,
      ...(paginationState ? { pagination: paginationState } : {}),
      ...(resolvedRowSelection ? { rowSelection: resolvedRowSelection } : {}),
    },
    manualPagination,
    ...(resolvedPageCount == null ? {} : { pageCount: resolvedPageCount }),
    ...(manualPagination
      ? {}
      : {
          initialState: {
            pagination: {
              pageSize,
            },
          },
        }),
  });

  const canRenderToolbar = enableColumnToggle || Boolean(onExport);
  const canPreviousPage = manualPagination ? pageIndex > 0 : table.getCanPreviousPage();
  const canNextPage = manualPagination
    ? pageCount != null && pageCount > 0
      ? pageIndex < pageCount - 1
      : data.length === pageSize
    : table.getCanNextPage();

  const handlePrevious = () => {
    if (manualPagination) {
      if (onPageChange && pageIndex > 0) {
        onPageChange(pageIndex - 1);
      }
      return;
    }

    table.previousPage();
  };

  const handleNext = () => {
    if (manualPagination) {
      if (onPageChange && (!pageCount || pageIndex < pageCount - 1)) {
        onPageChange(pageIndex + 1);
      }
      return;
    }

    table.nextPage();
  };

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
        {onExport && (
          <Button onClick={onExport} variant="outline">
            Export CSV
          </Button>
        )}
      </div>
      <div className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm">
        <Table className="w-full min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          onClick={handlePrevious}
          disabled={!canPreviousPage || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canNextPage || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
