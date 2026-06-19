import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "src/lib/utils";
import { Button } from "src/components/ui/button";
import { Calendar } from "src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover";
import { Input } from "src/components/ui/input";

interface Props {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

function parseLocalDateTime(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function DateTimePicker({ name, defaultValue, required, className, id }: Props) {

  const [date, setDate] = React.useState<Date | undefined>(() => parseLocalDateTime(defaultValue));
  const [time, setTime] = React.useState<string>(() => {
    const d = parseLocalDateTime(defaultValue);
    return d ? format(d, "HH:mm") : "";
  });
  const [open, setOpen] = React.useState(false);

  const combined = React.useMemo(() => {
    if (!date) return "";
    const [h, m] = (time || "00:00").split(":").map(Number);
    const d = new Date(date);
    d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
    return d.toISOString();
  }, [date, time]);

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "flex-1 min-w-0 justify-start text-left font-normal h-11 rounded-2xl",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{date ? format(date, "PPP") : "Pick a date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d: Date | undefined) => {
              setDate(d);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        className="w-32 shrink-0 h-11 px-3"
      />
      <input type="hidden" name={name} value={combined} required={required} />
    </div>
  );
}
