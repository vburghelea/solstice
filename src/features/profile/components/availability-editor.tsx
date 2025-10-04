import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AvailabilityData, DayAvailability } from "~/db/schema/auth.schema";
import { cn } from "~/shared/lib/utils";
import { AVAILABILITY_CONFIG } from "~/shared/types/common";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/shared/ui/tooltip";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type TimeInterval = {
  time: string;
  endTime: string;
  displayIndex: number;
  dataSlots: number[];
};

function createTimeIntervals(displayIntervalMinutes: number): TimeInterval[] {
  const totalIntervals = Math.round(
    ((AVAILABILITY_CONFIG.endHour - AVAILABILITY_CONFIG.startHour) * 60) /
      displayIntervalMinutes,
  );

  return Array.from({ length: totalIntervals }, (_, index) => {
    const minutesFromStart = index * displayIntervalMinutes;
    const absoluteStartMinutes = AVAILABILITY_CONFIG.startHour * 60 + minutesFromStart;
    const absoluteEndMinutes = absoluteStartMinutes + displayIntervalMinutes;

    const startHour = Math.floor(absoluteStartMinutes / 60);
    const startMinute = absoluteStartMinutes % 60;
    const endHour = Math.floor(absoluteEndMinutes / 60);
    const endMinute = absoluteEndMinutes % 60;

    const time = `${startHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")}`;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute
      .toString()
      .padStart(2, "0")}`;

    const startDataSlot = Math.floor(
      absoluteStartMinutes / AVAILABILITY_CONFIG.dataIntervalMinutes,
    );
    const slotLength = Math.round(
      displayIntervalMinutes / AVAILABILITY_CONFIG.dataIntervalMinutes,
    );

    const dataSlots = Array.from({ length: slotLength }, (_, offset) => {
      return startDataSlot + offset;
    });

    return {
      time,
      endTime,
      displayIndex: index,
      dataSlots,
    };
  });
}

const DESKTOP_TIME_INTERVALS = createTimeIntervals(
  AVAILABILITY_CONFIG.displayIntervalMinutes,
);
const MOBILE_TIME_INTERVALS = createTimeIntervals(60);

const DESKTOP_CELL_MIN_WIDTH_REM = 1.35;
const DESKTOP_LABEL_COLUMN_WIDTH_REM = 5.5;
const MOBILE_CELL_MIN_WIDTH_REM = 1.2;
const MOBILE_LABEL_COLUMN_WIDTH_REM = 3.75;

const DESKTOP_EDITOR_MIN_WIDTH_REM =
  DESKTOP_CELL_MIN_WIDTH_REM * DESKTOP_TIME_INTERVALS.length +
  DESKTOP_LABEL_COLUMN_WIDTH_REM;
const MOBILE_EDITOR_MIN_WIDTH_REM =
  MOBILE_CELL_MIN_WIDTH_REM * MOBILE_TIME_INTERVALS.length +
  MOBILE_LABEL_COLUMN_WIDTH_REM;

type DragState = {
  isDragging: boolean;
  startDay: string | null;
  startIntervalIndex: number | null;
  dragMode: "select" | "deselect" | null;
  startAvailability: DayAvailability | null;
  pointerId: number | null;
};

const DEFAULT_DRAG_STATE: DragState = {
  isDragging: false,
  startDay: null,
  startIntervalIndex: null,
  dragMode: null,
  startAvailability: null,
  pointerId: null,
};

function isSlotAvailable(dayAvailability: DayAvailability, dataSlots: number[]): boolean {
  return dataSlots.every(
    (slotIndex) =>
      slotIndex < dayAvailability.length && dayAvailability[slotIndex] === true,
  );
}

function createHeaderLabelIndexes(totalIntervals: number): number[] {
  if (totalIntervals <= 0) return [];
  if (totalIntervals <= 3) {
    return Array.from({ length: totalIntervals }, (_, index) => index);
  }

  const indexes = new Set<number>();
  indexes.add(0);
  indexes.add(totalIntervals - 1);

  const middleStep = (totalIntervals - 1) / 2;
  indexes.add(Math.round(middleStep));

  return Array.from(indexes).sort((a, b) => a - b);
}

interface AvailabilityEditorGridProps {
  value: AvailabilityData;
  onChange: (value: AvailabilityData) => void;
  readOnly?: boolean;
  intervals: TimeInterval[];
  cellMinWidthRem: number;
  editorMinWidthRem: number;
  labelColumnClassName: string;
  dayGridClassName: string;
  rowHeightClassName: string;
  headerLabelIndexes: number[];
  containerClassName?: string;
  renderHeaderLabel?: (
    interval: TimeInterval,
    index: number,
    labelIndexes: number[],
  ) => ReactNode;
  dayLabelFormatter?: (day: (typeof DAYS)[number]) => string;
  testId?: string;
}

const defaultHeaderRenderer = (
  interval: TimeInterval,
  index: number,
  labelIndexes: number[],
) => (
  <>
    <span className="lg:hidden">{labelIndexes.includes(index) ? interval.time : ""}</span>
    <span className="hidden lg:inline">{index % 2 === 0 ? interval.time : ""}</span>
  </>
);

const defaultDayLabelFormatter = (day: (typeof DAYS)[number]) => day.slice(0, 3);

function AvailabilityEditorGrid({
  value,
  onChange,
  readOnly = false,
  intervals,
  cellMinWidthRem,
  editorMinWidthRem,
  labelColumnClassName,
  dayGridClassName,
  rowHeightClassName,
  headerLabelIndexes,
  containerClassName,
  renderHeaderLabel = defaultHeaderRenderer,
  dayLabelFormatter = defaultDayLabelFormatter,
  testId = "availability-editor",
}: AvailabilityEditorGridProps) {
  const [dragState, setDragState] = useState<DragState>({ ...DEFAULT_DRAG_STATE });

  const handlePointerUp = useCallback(() => {
    setDragState((previous) =>
      previous.isDragging ? { ...DEFAULT_DRAG_STATE } : previous,
    );
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerUp]);

  const handlePointerDown = useCallback(
    (day: string, intervalIndex: number, event: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly) return;
      if (event.button !== undefined && event.button !== 0) return;

      event.preventDefault();

      const dayAvailability = value[day as keyof AvailabilityData];
      const interval = intervals[intervalIndex];
      if (!dayAvailability || !interval) return;

      const mode = isSlotAvailable(dayAvailability, interval.dataSlots)
        ? "deselect"
        : "select";

      const newAvailability = [...dayAvailability];
      interval.dataSlots.forEach((slot) => {
        if (slot < newAvailability.length) {
          newAvailability[slot] = mode === "select";
        }
      });

      onChange({ ...value, [day]: newAvailability });

      setDragState({
        isDragging: true,
        startDay: day,
        startIntervalIndex: intervalIndex,
        dragMode: mode,
        startAvailability: dayAvailability,
        pointerId: event.pointerId ?? null,
      });
    },
    [intervals, onChange, readOnly, value],
  );

  const handlePointerHover = useCallback(
    (day: string, intervalIndex: number, event: ReactPointerEvent<HTMLDivElement>) => {
      const {
        isDragging,
        startDay,
        startIntervalIndex,
        dragMode,
        startAvailability,
        pointerId,
      } = dragState;
      if (
        !isDragging ||
        !startAvailability ||
        startDay !== day ||
        startIntervalIndex === null ||
        dragMode === null
      ) {
        return;
      }
      if (pointerId !== null && event.pointerId !== pointerId) {
        return;
      }

      event.preventDefault();

      const safeIndex = Math.max(0, Math.min(intervalIndex, intervals.length - 1));
      const start = Math.min(startIntervalIndex, safeIndex);
      const end = Math.max(startIntervalIndex, safeIndex);

      const updatedAvailability = [...startAvailability];
      for (let i = start; i <= end; i++) {
        const currentInterval = intervals[i];
        if (!currentInterval) continue;
        currentInterval.dataSlots.forEach((slot) => {
          if (slot < updatedAvailability.length) {
            updatedAvailability[slot] = dragMode === "select";
          }
        });
      }

      onChange({ ...value, [day]: updatedAvailability });
    },
    [dragState, intervals, onChange, value],
  );

  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-x-auto select-none",
        containerClassName,
      )}
      data-testid={testId}
    >
      <div
        className="space-y-3"
        style={{ minWidth: `${editorMinWidthRem.toFixed(2)}rem` }}
      >
        <div className={cn("grid items-end", labelColumnClassName)}>
          <div className="text-muted-foreground text-xs font-medium sm:text-sm">Time</div>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${intervals.length}, minmax(${cellMinWidthRem}rem, 1fr))`,
            }}
          >
            {intervals.map((interval, index) => (
              <div
                key={`${interval.time}-${interval.displayIndex}`}
                className="text-muted-foreground pb-1 text-center text-[10px] font-medium tracking-wide uppercase sm:text-xs"
              >
                {renderHeaderLabel(interval, index, headerLabelIndexes)}
              </div>
            ))}
          </div>
        </div>

        {DAYS.map((day) => (
          <DayRow
            key={day}
            day={day}
            value={value}
            readOnly={readOnly}
            intervals={intervals}
            onPointerDown={handlePointerDown}
            onPointerHover={handlePointerHover}
            cellMinWidthRem={cellMinWidthRem}
            rowHeightClassName={rowHeightClassName}
            dayGridClassName={dayGridClassName}
            dayLabelFormatter={dayLabelFormatter}
          />
        ))}
      </div>
    </div>
  );
}

const DESKTOP_HEADER_INDEXES = createHeaderLabelIndexes(DESKTOP_TIME_INTERVALS.length);
const MOBILE_HEADER_INDEXES = createHeaderLabelIndexes(MOBILE_TIME_INTERVALS.length);

interface AvailabilityEditorProps {
  value: AvailabilityData;
  onChange: (value: AvailabilityData) => void;
  readOnly?: boolean;
}

export function AvailabilityEditor({
  value,
  onChange,
  readOnly = false,
}: AvailabilityEditorProps) {
  return (
    <AvailabilityEditorGrid
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      intervals={DESKTOP_TIME_INTERVALS}
      cellMinWidthRem={DESKTOP_CELL_MIN_WIDTH_REM}
      editorMinWidthRem={DESKTOP_EDITOR_MIN_WIDTH_REM}
      labelColumnClassName="grid-cols-[5.5rem_1fr] gap-2 lg:grid-cols-[6.5rem_1fr]"
      dayGridClassName="grid-cols-[5.5rem_1fr] items-center gap-2 lg:grid-cols-[6.5rem_1fr]"
      rowHeightClassName="h-7 lg:h-8"
      headerLabelIndexes={DESKTOP_HEADER_INDEXES}
      containerClassName="px-2 sm:px-0"
    />
  );
}

export function MobileAvailabilityEditor({
  value,
  onChange,
  readOnly = false,
}: AvailabilityEditorProps) {
  return (
    <AvailabilityEditorGrid
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      intervals={MOBILE_TIME_INTERVALS}
      cellMinWidthRem={MOBILE_CELL_MIN_WIDTH_REM}
      editorMinWidthRem={MOBILE_EDITOR_MIN_WIDTH_REM}
      labelColumnClassName="grid-cols-[3.75rem_1fr] gap-1"
      dayGridClassName="grid-cols-[3.75rem_1fr] items-center gap-1"
      rowHeightClassName="h-9"
      headerLabelIndexes={MOBILE_HEADER_INDEXES}
      containerClassName="px-1"
      renderHeaderLabel={(interval, index, indexes) => (
        <span>{indexes.includes(index) ? interval.time : ""}</span>
      )}
      dayLabelFormatter={(day) => day.slice(0, 2).toUpperCase()}
      testId="availability-editor-mobile"
    />
  );
}

interface DayRowProps {
  day: (typeof DAYS)[number];
  value: AvailabilityData;
  readOnly?: boolean;
  intervals: TimeInterval[];
  onPointerDown: (
    day: string,
    intervalIndex: number,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onPointerHover: (
    day: string,
    intervalIndex: number,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  cellMinWidthRem: number;
  rowHeightClassName: string;
  dayGridClassName: string;
  dayLabelFormatter: (day: (typeof DAYS)[number]) => string;
}

function DayRow({
  day,
  value,
  readOnly,
  intervals,
  onPointerDown,
  onPointerHover,
  cellMinWidthRem,
  rowHeightClassName,
  dayGridClassName,
  dayLabelFormatter,
}: DayRowProps) {
  const dayAvailability = value[day];

  type Segment = { start: number; end: number; isAvailable: boolean };
  const segments: Segment[] = [];
  let currentSegment: Segment | null = null;

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const isAvailable = isSlotAvailable(dayAvailability, interval.dataSlots);
    if (currentSegment && currentSegment.isAvailable === isAvailable) {
      currentSegment.end = i;
    } else {
      if (currentSegment) segments.push(currentSegment);
      currentSegment = { start: i, end: i, isAvailable };
    }
  }
  if (currentSegment) segments.push(currentSegment);

  return (
    <div className={cn("grid", dayGridClassName)}>
      <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:text-sm sm:font-medium sm:capitalize">
        {dayLabelFormatter(day)}
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${intervals.length}, minmax(${cellMinWidthRem}rem, 1fr))`,
        }}
      >
        {segments.map((segment) => {
          const startTime = intervals[segment.start].time;
          const endTime = intervals[segment.end].endTime;
          const segmentWidth = segment.end - segment.start + 1;

          const segmentElement = (
            <div
              key={`${day}-${startTime}-${endTime}-${segment.isAvailable ? 1 : 0}`}
              className={cn("flex", rowHeightClassName)}
              style={{ gridColumn: `span ${segmentWidth}` }}
            >
              {Array.from({ length: segmentWidth }).map((_, offset) => {
                const intervalIndex = segment.start + offset;
                const interval = intervals[intervalIndex];
                return (
                  <div
                    key={`${day}-${interval.time}`}
                    className={cn(
                      "h-full flex-1 border-y border-r first:border-l",
                      segment.isAvailable ? "bg-primary" : "bg-background",
                      !readOnly && "cursor-pointer",
                      segment.isAvailable ? "hover:bg-primary/90" : "hover:bg-muted",
                    )}
                    onPointerDown={(event) => onPointerDown(day, intervalIndex, event)}
                    onPointerEnter={(event) => onPointerHover(day, intervalIndex, event)}
                    onPointerMove={(event) => onPointerHover(day, intervalIndex, event)}
                  />
                );
              })}
            </div>
          );

          if (!segment.isAvailable) {
            return segmentElement;
          }

          return (
            <TooltipProvider key={`${day}-${startTime}-${endTime}`}>
              <Tooltip>
                <TooltipTrigger asChild>{segmentElement}</TooltipTrigger>
                <TooltipContent>
                  <p>
                    Available: {startTime} - {endTime}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
