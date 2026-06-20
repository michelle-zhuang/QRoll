import * as React from "react";
import { cn } from "src/lib/utils";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Calendar } from "src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "src/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

type Freq = "weekly" | "biweekly" | "daily" | "monthly";
type EndKind = "count" | "until";

const WEEKDAYS = [
  { idx: 0, label: "Sun" },
  { idx: 1, label: "Mon" },
  { idx: 2, label: "Tue" },
  { idx: 3, label: "Wed" },
  { idx: 4, label: "Thu" },
  { idx: 5, label: "Fri" },
  { idx: 6, label: "Sat" },
];

export function RecurrenceFields() {
  const [enabled, setEnabled] = React.useState(false);
  const [freq, setFreq] = React.useState<Freq>("weekly");
  const [byweekday, setByweekday] = React.useState<number[]>([]);
  const [endKind, setEndKind] = React.useState<EndKind>("count");
  const [count, setCount] = React.useState<string>("8");
  const [until, setUntil] = React.useState<string>("");
  const [untilOpen, setUntilOpen] = React.useState(false);
  const [tz, setTz] = React.useState<string>("UTC");

  const untilDate = React.useMemo(() => {
    if (!until) return undefined;
    const [y, m, d] = until.split("-").map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
    return new Date(y, m - 1, d);
  }, [until]);

  const handleUntilSelect = (d: Date | undefined) => {
    if (!d) {
      setUntil("");
    } else {
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, "0");
      const dStr = String(d.getDate()).padStart(2, "0");
      setUntil(`${yStr}-${mStr}-${dStr}`);
    }
  };

  React.useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      setTz("UTC");
    }
  }, []);

  const showWeekdays = freq === "weekly" || freq === "biweekly";

  const toggleWeekday = (idx: number) => {
    setByweekday(prev => (prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx].sort()));
  };

  const submitFreq = enabled ? freq : "";
  const submitByweekday = enabled && showWeekdays && byweekday.length > 0 ? byweekday.join(",") : "";
  const submitCount = enabled && endKind === "count" ? count : "";
  const submitUntil = enabled && endKind === "until" ? until : "";
  const submitTz = enabled ? tz : "";

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
        />
        <span className="text-sm font-medium">Repeat this event</span>
      </label>

      {enabled && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="flex flex-wrap gap-2">
              {(["daily", "weekly", "biweekly", "monthly"] as Freq[]).map(f => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={freq === f ? "default" : "outline"}
                  onClick={() => setFreq(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {showWeekdays && (
            <div className="space-y-2">
              <Label>On these days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(wd => (
                  <Button
                    key={wd.idx}
                    type="button"
                    size="sm"
                    variant={byweekday.includes(wd.idx) ? "default" : "outline"}
                    onClick={() => toggleWeekday(wd.idx)}
                    className="w-14"
                  >
                    {wd.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to repeat on the same weekday as the start date.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ends</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recurrence_end_kind"
                  checked={endKind === "count"}
                  onChange={() => setEndKind("count")}
                />
                <span className="text-sm">After</span>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  className="h-9 w-20"
                  disabled={endKind !== "count"}
                />
                <span className="text-sm">occurrences</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="recurrence_end_kind"
                  checked={endKind === "until"}
                  onChange={() => {
                    setEndKind("until");
                    setUntilOpen(true);
                  }}
                />
                <span className="text-sm">Until</span>
                <Popover open={untilOpen} onOpenChange={(o) => {
                  if (endKind === "until") setUntilOpen(o);
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={endKind !== "until"}
                      className={cn(
                        "h-9 px-3 text-xs justify-start text-left font-normal rounded-xl transition-all duration-200 min-w-[140px] cursor-pointer",
                        untilDate 
                          ? "bg-muted/40 border-primary/20 text-foreground font-semibold" 
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{untilDate ? format(untilDate, "PPP") : "Select date"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={untilDate}
                      onSelect={(d) => {
                        handleUntilSelect(d);
                        setUntilOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </label>
            </div>
          </div>

          <p className={cn("text-xs text-muted-foreground")}>Time zone: {tz}</p>
        </div>
      )}

      <input type="hidden" name="recurrence_freq" value={submitFreq} />
      <input type="hidden" name="recurrence_byweekday" value={submitByweekday} />
      <input type="hidden" name="recurrence_count" value={submitCount} />
      <input type="hidden" name="recurrence_until" value={submitUntil} />
      <input type="hidden" name="recurrence_timezone" value={submitTz} />
    </div>
  );
}
