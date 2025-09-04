import { useCallback, useEffect, useState } from "react";
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
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const TIME_INTERVALS = Array.from(
  {
    length:
      ((AVAILABILITY_CONFIG.endHour - AVAILABILITY_CONFIG.startHour) * 60) /
        AVAILABILITY_CONFIG.displayIntervalMinutes +
      1,
  },
  (_, i) => {
    const totalMinutes = i * AVAILABILITY_CONFIG.displayIntervalMinutes;
    const hour = AVAILABILITY_CONFIG.startHour + Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const endTotalMinutes = totalMinutes + AVAILABILITY_CONFIG.displayIntervalMinutes;
    const endHour = AVAILABILITY_CONFIG.startHour + Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTimeString = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

    const startDataSlot = (hour * 60 + minute) / AVAILABILITY_CONFIG.dataIntervalMinutes;
    const dataSlots = Array.from(
      {
        length:
          AVAILABILITY_CONFIG.displayIntervalMinutes /
          AVAILABILITY_CONFIG.dataIntervalMinutes,
      },
      (_, k) => startDataSlot + k,
    );

    return {
      time: timeString,
      endTime: endTimeString,
      displayIndex: i,
      dataSlots,
    };
  },
);

function isSlotAvailable(dayAvailability: DayAvailability, dataSlots: number[]): boolean {
  return dataSlots.every(
    (slotIndex) =>
      slotIndex < dayAvailability.length && dayAvailability[slotIndex] === true,
  );
}

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
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startDay: string | null;
    startIntervalIndex: number | null;
    dragMode: "select" | "deselect" | null;
    startAvailability: DayAvailability | null;
  }>({
    isDragging: false,
    startDay: null,
    startIntervalIndex: null,
    dragMode: null,
    startAvailability: null,
  });

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        startDay: null,
        startIntervalIndex: null,
        dragMode: null,
        startAvailability: null,
      });
    }
  }, [dragState.isDragging]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleMouseDown = (day: string, intervalIndex: number) => {
    if (readOnly) return;
    const dayAvailability = value[day as keyof AvailabilityData];
    const currentSlots = TIME_INTERVALS[intervalIndex].dataSlots;
    const mode = isSlotAvailable(dayAvailability, currentSlots) ? "deselect" : "select";

    const newAvailability = [...dayAvailability];
    currentSlots.forEach((slot) => (newAvailability[slot] = mode === "select"));
    onChange({ ...value, [day]: newAvailability });

    setDragState({
      isDragging: true,
      startDay: day,
      startIntervalIndex: intervalIndex,
      dragMode: mode,
      startAvailability: dayAvailability,
    });
  };

  const handleMouseEnter = (day: string, intervalIndex: number) => {
    const { isDragging, startDay, startIntervalIndex, dragMode, startAvailability } =
      dragState;
    if (
      !isDragging ||
      startDay !== day ||
      startIntervalIndex === null ||
      !startAvailability
    )
      return;

    const newAvailability = [...startAvailability];
    const start = Math.min(startIntervalIndex, intervalIndex);
    const end = Math.max(startIntervalIndex, intervalIndex);

    for (let i = start; i <= end; i++) {
      const currentSlots = TIME_INTERVALS[i].dataSlots;
      currentSlots.forEach((slot) => (newAvailability[slot] = dragMode === "select"));
    }

    onChange({ ...value, [day]: newAvailability });
  };

  const headerLabelIndexes = [
    0,
    Math.floor((TIME_INTERVALS.length - 1) / 2),
    TIME_INTERVALS.length - 1,
  ];

  return (
    <div
      className="space-y-4 select-none"
      data-testid="availability-editor"
      onMouseUp={handleMouseUp}
    >
      <div className="grid grid-cols-[80px_1fr] gap-2 lg:grid-cols-[120px_1fr]">
        <div className="text-muted-foreground text-sm font-medium">Time</div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${TIME_INTERVALS.length}, 1fr)` }}
        >
          {TIME_INTERVALS.map((interval, index) => (
            <div
              key={interval.time}
              className="text-muted-foreground pb-2 text-center text-xs"
            >
              {/* Mobile/Tablet: show only start, middle, end time labels */}
              <span className="lg:hidden">
                {headerLabelIndexes.includes(index) ? interval.time : ""}
              </span>
              {/* Desktop (lg+): show every other label as before */}
              <span className="hidden lg:inline">
                {index % 2 === 0 ? interval.time : ""}
              </span>
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
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
        />
      ))}
    </div>
  );
}

interface DayRowProps {
  day: (typeof DAYS)[number];
  value: AvailabilityData;
  readOnly?: boolean;
  onMouseDown: (day: string, intervalIndex: number) => void;
  onMouseEnter: (day: string, intervalIndex: number) => void;
}

function DayRow({ day, value, readOnly, onMouseDown, onMouseEnter }: DayRowProps) {
  const dayAvailability = value[day];

  const segments = [];
  let currentSegment = null;

  for (let i = 0; i < TIME_INTERVALS.length; i++) {
    const isAvailable = isSlotAvailable(dayAvailability, TIME_INTERVALS[i].dataSlots);
    if (currentSegment && currentSegment.isAvailable === isAvailable) {
      currentSegment.end = i;
    } else {
      if (currentSegment) segments.push(currentSegment);
      currentSegment = { start: i, end: i, isAvailable };
    }
  }
  if (currentSegment) segments.push(currentSegment);

  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 lg:grid-cols-[120px_1fr]">
      <div className="text-sm font-medium capitalize">{day.slice(0, 3)}</div>
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${TIME_INTERVALS.length}, 1fr)` }}
      >
        {segments.map((segment) => {
          const startTime = TIME_INTERVALS[segment.start].time;
          const endTime = TIME_INTERVALS[segment.end].endTime;
          const segmentWidth = segment.end - segment.start + 1;

          const segmentElement = (
            <div
              key={`${day}-${startTime}-${endTime}-${segment.isAvailable ? 1 : 0}`}
              className="flex h-7 lg:h-8"
              style={{ gridColumn: `span ${segmentWidth}` }}
            >
              {Array.from({ length: segmentWidth }).map((_, i) => {
                const intervalIndex = segment.start + i;
                return (
                  <div
                    key={`${day}-${TIME_INTERVALS[intervalIndex].time}`}
                    className={cn(
                      "h-full flex-1 border-y border-r first:border-l",
                      segment.isAvailable ? "bg-primary" : "bg-background",
                      !readOnly && "cursor-pointer",
                      segment.isAvailable ? "hover:bg-primary/90" : "hover:bg-muted",
                    )}
                    onMouseDown={() => onMouseDown(day, intervalIndex)}
                    onMouseEnter={() => onMouseEnter(day, intervalIndex)}
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
