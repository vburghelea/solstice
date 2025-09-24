import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FieldComponentProps, isFieldApi } from "~/lib/form-shared";

interface DateTimePickerProps extends FieldComponentProps {
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker(props: DateTimePickerProps) {
  const { field, label } = props;

  // Parse the current value or set default to next week at 18:00
  const currentValue = field.state.value ? new Date(field.state.value) : null;
  // Set to next week (7 days from now) at 18:00
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  defaultDate.setHours(18, 0, 0, 0); // Set to 18:00

  // If no value is set, use the default date
  const initialDate = field.state.value ? currentValue : defaultDate;

  const [date, setDate] = useState<string>(
    initialDate
      ? initialDate.toISOString().split("T")[0]
      : defaultDate.toISOString().split("T")[0],
  );
  const [hour, setHour] = useState<string>(
    initialDate ? String(initialDate.getHours()).padStart(2, "0") : "18",
  );
  const [minute, setMinute] = useState<string>(
    initialDate
      ? String(Math.floor(initialDate.getMinutes() / 15) * 15).padStart(2, "0")
      : "00",
  );

  // Update the field value when the date, hour, or minute changes
  useEffect(() => {
    // Validate time constraints (9-22 hours)
    const hourNum = parseInt(hour);
    if (hourNum < 9 || hourNum > 22) return;

    // Validate minute constraints (0, 15, 30, 45)
    const minuteNum = parseInt(minute);
    if (![0, 15, 30, 45].includes(minuteNum)) return;

    // Create the datetime string in ISO format
    const datetime = new Date(`${date}T${hour}:${minute}:00`);

    // Check if the date is valid
    if (isNaN(datetime.getTime())) return;

    // Update the field value
    field.handleChange(datetime.toISOString());
  }, [date, hour, minute, field]);

  // Check if field is valid (moved after hooks)
  if (!isFieldApi(field)) {
    console.error("DateTimePicker requires a valid field prop.", { field, props });
    return null;
  }

  // Generate time options
  const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 9 to 22
  const minutes = [0, 15, 30, 45];

  // Get the day of the week for the selected date
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "short" });

  // Calculate min date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Combined Date and Time Picker */}
      <div className="flex items-center gap-2">
        <span className="inline-block w-8 text-sm font-medium">{dayOfWeek}</span>
        <div className="relative flex-1">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="h-9 pl-10 text-sm"
          />
          <CalendarIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        </div>

        {/* Time Picker */}
        <div className="flex gap-1">
          <div className="w-20">
            <Select value={hour} onValueChange={setHour}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={String(h).padStart(2, "0")}>
                    {String(h).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-20">
            <Select value={minute} onValueChange={setMinute}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={String(m).padStart(2, "0")}>
                    {String(m).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error display */}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <div className="text-destructive text-sm font-medium">
          {field.state.meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
}
