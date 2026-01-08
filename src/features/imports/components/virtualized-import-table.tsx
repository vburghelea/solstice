import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { JsonRecord } from "~/shared/lib/json";
import { InlineCellEditor } from "./inline-cell-editor";

interface VirtualizedImportTableProps {
  headers: string[];
  rows: JsonRecord[];
  editedCells: Set<string>;
  onEditCell: (rowIndex: number, header: string, value: string) => void;
}

const buildCellKey = (rowIndex: number, header: string) => `${rowIndex}:${header}`;

export function VirtualizedImportTable(props: VirtualizedImportTableProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState<{ rowIndex: number; header: string } | null>(
    null,
  );

  const virtualizer = useVirtualizer({
    count: props.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  const columnStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${props.headers.length}, minmax(160px, 1fr))`,
    }),
    [props.headers.length],
  );

  return (
    <div className="rounded-md border border-muted">
      <div className="grid gap-px bg-muted/40 text-xs font-semibold" style={columnStyle}>
        {props.headers.map((header) => (
          <div key={header} className="bg-background px-2 py-2">
            {header}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="max-h-[420px] overflow-auto">
        <div
          className="relative min-w-max"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = props.rows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 top-0 grid gap-px bg-muted/30 text-xs"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  ...columnStyle,
                }}
              >
                {props.headers.map((header) => {
                  const rawValue = row?.[header];
                  const value =
                    rawValue === null || rawValue === undefined ? "" : String(rawValue);
                  const cellKey = buildCellKey(virtualRow.index, header);
                  const isEdited = props.editedCells.has(cellKey);
                  const isEditing =
                    editing?.rowIndex === virtualRow.index && editing.header === header;

                  return (
                    <div
                      key={header}
                      className={`bg-background px-2 py-1 ${
                        isEdited ? "border border-blue-200 bg-blue-50" : "border"
                      }`}
                      onClick={() => setEditing({ rowIndex: virtualRow.index, header })}
                    >
                      {isEditing ? (
                        <InlineCellEditor
                          value={value}
                          onCommit={(nextValue) => {
                            props.onEditCell(virtualRow.index, header, nextValue);
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <span className="block truncate">{value || "-"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
