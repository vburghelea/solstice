import { useState } from "react";
import type { AvailabilityData, DayAvailability } from "~/db/schema/auth.schema";
import { cn } from "~/shared/lib/utils";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

  const handleSlotClick = (day: keyof AvailabilityData, index: number) => {
    if (readOnly) return;
    const newDayAvailability = [...value[day]];
    newDayAvailability[index] = !newDayAvailability[index];
    onChange({ ...value, [day]: newDayAvailability });
  };

  const handleMouseDown = (
    day: keyof AvailabilityData,
    slotIndex: number,
    isSlotSelected: boolean,
  ) => {
    if (readOnly) return;
    setIsDragging(true);
    const newDragValue = !isSlotSelected;
    setDragValue(newDragValue);
    updateSlot(day, slotIndex, newDragValue);
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    setIsDragging(false);
  };

  const handleMouseEnter = (day: keyof AvailabilityData, slotIndex: number) => {
    if (readOnly || !isDragging) return;
    updateSlot(day, slotIndex, dragValue);
  };

  const updateSlot = (
    day: keyof AvailabilityData,
    slotIndex: number,
    newValue: boolean,
  ) => {
    const newDayAvailability = [...value[day]];
    if (newDayAvailability[slotIndex] !== newValue) {
      newDayAvailability[slotIndex] = newValue;
      onChange({ ...value, [day]: newDayAvailability });
    }
  };

  return (
    <div
      className="space-y-4"
      onMouseUp={handleMouseUp}
      data-testid="availability-editor"
    >
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div />
        <div className="grid grid-cols-24 gap-px">
          {HOURS.map((hour) => (
            <div key={hour} className="text-muted-foreground text-center text-xs">
              {hour}
            </div>
          ))}
        </div>
      </div>
      {DAYS.map((day) => (
        <div key={day} className="grid grid-cols-[auto_1fr] items-center gap-2">
          <div className="text-right text-sm font-medium capitalize">
            {day.slice(0, 3)}
          </div>
          <div className="grid grid-cols-96 gap-px">
            {(value[day] as DayAvailability).map((isAvailable, index) => (
              <div
                key={`${day}-${index}`}
                onMouseDown={() => handleMouseDown(day, index, isAvailable)}
                onMouseEnter={() => handleMouseEnter(day, index)}
                onClick={() => handleSlotClick(day, index)}
                className={cn(
                  "h-6 w-full",
                  isAvailable ? "bg-primary" : "bg-muted",
                  !readOnly && "hover:bg-primary/80 cursor-pointer",
                  index % 4 === 0 && "border-l",
                )}
                data-testid={`slot-${day}-${index}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
