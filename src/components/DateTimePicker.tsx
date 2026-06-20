import * as React from "react";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { CalendarIcon, Clock } from "lucide-react";

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

const PACIFIC_TIMEZONE = "America/Los_Angeles";

function parsePacificDateTime(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value.includes("T")) {
    return fromZonedTime(value, PACIFIC_TIMEZONE);
  }
  return fromZonedTime(`${value}T00:00:00`, PACIFIC_TIMEZONE);
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

function parse24hTime(timeStr: string) {
  if (!timeStr) return { hour: "12", minute: "00", ampm: "AM" as const };
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return { hour: "12", minute: "00", ampm: "AM" as const };
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hour = h.toString();
  const minute = m < 10 ? `0${m}` : m.toString();
  return { hour, minute, ampm };
}

export function DateTimePicker({ name, defaultValue, required, className, id }: Props) {

  const [date, setDate] = React.useState<Date | undefined>(() => parsePacificDateTime(defaultValue));
  const [time, setTime] = React.useState<string>(() => {
    const d = parsePacificDateTime(defaultValue);
    return d ? format(toZonedTime(d, PACIFIC_TIMEZONE), "HH:mm") : "";
  });
  const [open, setOpen] = React.useState(false);
  const [hasManuallyEdited, setHasManuallyEdited] = React.useState(() => defaultValue !== undefined);

  // Split state for custom Shadcn-style time picker
  const initialTimeParsed = React.useMemo(() => parse24hTime(time), []);
  const [hour, setHour] = React.useState<string>(initialTimeParsed.hour);
  const [minute, setMinute] = React.useState<string>(initialTimeParsed.minute);
  const [ampm, setAmpm] = React.useState<"AM" | "PM">(initialTimeParsed.ampm);

  // Sync internal split states when time state is updated externally
  React.useEffect(() => {
    const { hour: h, minute: m, ampm: ap } = parse24hTime(time);
    setHour(current => (current === "" && h === "12" ? current : h));
    setMinute(current => (current === "" && m === "00" ? current : m));
    setAmpm(ap);
  }, [time]);

  const updateTimeStr = (h: string, m: string, ap: "AM" | "PM") => {
    let hourNum = parseInt(h, 10);
    let minNum = parseInt(m, 10);
    if (isNaN(hourNum)) hourNum = 12;
    if (isNaN(minNum)) minNum = 0;

    hourNum = Math.max(1, Math.min(12, hourNum));
    minNum = Math.max(0, Math.min(59, minNum));

    let finalH = hourNum;
    if (ap === "PM" && hourNum < 12) {
      finalH += 12;
    } else if (ap === "AM" && hourNum === 12) {
      finalH = 0;
    }

    const hStr = finalH < 10 ? `0${finalH}` : `${finalH}`;
    const mStr = minNum < 10 ? `0${minNum}` : `${minNum}`;
    setTime(`${hStr}:${mStr}`);
  };

  const combined = React.useMemo(() => {
    if (!date) return "";
    const [hStr, mStr] = (time || "00:00").split(":");
    const h = isNaN(parseInt(hStr, 10)) ? 0 : parseInt(hStr, 10);
    const m = isNaN(parseInt(mStr, 10)) ? 0 : parseInt(mStr, 10);
    
    const zoned = toZonedTime(date, PACIFIC_TIMEZONE);
    const year = zoned.getFullYear();
    const month = String(zoned.getMonth() + 1).padStart(2, "0");
    const day = String(zoned.getDate()).padStart(2, "0");
    
    const isoString = `${year}-${month}-${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    return fromZonedTime(isoString, PACIFIC_TIMEZONE).toISOString();
  }, [date, time]);

  // Sync relative date/time offsets from starts_at to other fields
  React.useEffect(() => {
    if (name === "starts_at") {
      if (combined) {
        window.dispatchEvent(new CustomEvent("qroll-starts-at-changed", { detail: { value: combined } }));
      }
      return;
    }

    const handleStartsAtChange = (e: Event) => {
      if (hasManuallyEdited) return;

      const customEvent = e as CustomEvent<{ value: string }>;
      const startsAtStr = customEvent.detail.value;
      if (!startsAtStr) return;

      const startsAtDate = new Date(startsAtStr);
      if (isNaN(startsAtDate.getTime())) return;

      let targetDate: Date;
      if (name === "checkin_opens_at") {
        // Default check-in opens 15 minutes before start
        targetDate = new Date(startsAtDate.getTime() - 15 * 60 * 1000);
      } else if (name === "late_after_at") {
        // Default mark late after 10 minutes after start
        targetDate = new Date(startsAtDate.getTime() + 10 * 60 * 1000);
      } else if (name === "checkin_closes_at") {
        // Default check-in closes 2 hours after start
        targetDate = new Date(startsAtDate.getTime() + 2 * 60 * 60 * 1000);
      } else {
        return;
      }

      setDate(targetDate);
      setTime(format(toZonedTime(targetDate, PACIFIC_TIMEZONE), "HH:mm"));
    };

    window.addEventListener("qroll-starts-at-changed", handleStartsAtChange);
    return () => {
      window.removeEventListener("qroll-starts-at-changed", handleStartsAtChange);
    };
  }, [name, combined, hasManuallyEdited]);

  const handleDateSelect = (d: Date | undefined) => {
    setHasManuallyEdited(true);
    if (d) {
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const isoDateOnly = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const ptDate = fromZonedTime(`${isoDateOnly}T00:00:00`, PACIFIC_TIMEZONE);
      setDate(ptDate);
    } else {
      setDate(undefined);
    }
  };

  const displayText = React.useMemo(() => {
    if (!date) return "Select date & time";
    const zoned = toZonedTime(date, PACIFIC_TIMEZONE);
    const dateFormatted = format(zoned, "PPP");
    const timeFormatted = time ? formatTime12h(time) : "12:00 AM";
    return `${dateFormatted} at ${timeFormatted}`;
  }, [date, time]);

  return (
    <div className={cn("relative flex w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left h-11 rounded-2xl transition-all duration-200",
              date 
                ? "bg-muted/40 border-primary/20 text-foreground font-semibold" 
                : "text-muted-foreground font-normal hover:bg-muted/50"
            )}
          >
            <CalendarIcon className={cn("mr-2 h-4 w-4 shrink-0 transition-colors", date ? "text-primary" : "text-muted-foreground")} />
            <span className="truncate">{displayText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date ? toZonedTime(date, PACIFIC_TIMEZONE) : undefined}
            onSelect={handleDateSelect}
          />

          <div className="p-3 border-t flex items-center justify-between gap-4 bg-muted/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={hour}
                  onChange={e => {
                    setHasManuallyEdited(true);
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setHour(val);
                    updateTimeStr(val, minute, ampm);
                  }}
                  onBlur={() => {
                    let h = parseInt(hour, 10);
                    if (isNaN(h) || h < 1 || h > 12) h = 12;
                    setHour(h.toString());
                    updateTimeStr(h.toString(), minute, ampm);
                  }}
                  className="w-9 h-8 p-0 text-center font-bold text-sm bg-transparent border-0 focus-visible:ring-0 focus:bg-muted/50 rounded-lg outline-none"
                />
                <span className="text-muted-foreground font-bold select-none">:</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={minute}
                  onChange={e => {
                    setHasManuallyEdited(true);
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setMinute(val);
                    updateTimeStr(hour, val, ampm);
                  }}
                  onBlur={() => {
                    let m = parseInt(minute, 10);
                    if (isNaN(m) || m < 0 || m > 59) m = 0;
                    const mStr = m < 10 ? `0${m}` : m.toString();
                    setMinute(mStr);
                    updateTimeStr(hour, mStr, ampm);
                  }}
                  className="w-9 h-8 p-0 text-center font-bold text-sm bg-transparent border-0 focus-visible:ring-0 focus:bg-muted/50 rounded-lg outline-none"
                />
                <div className="flex border-l border-border pl-1.5 ml-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setHasManuallyEdited(true);
                      setAmpm("AM");
                      updateTimeStr(hour, minute, "AM");
                    }}
                    className={cn(
                      "px-2 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      ampm === "AM" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasManuallyEdited(true);
                      setAmpm("PM");
                      updateTimeStr(hour, minute, "PM");
                    }}
                    className={cn(
                      "px-2 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      ampm === "PM" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="h-8 rounded-lg text-xs font-medium cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={combined} required={required} />
    </div>
  );
}
