import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "src/lib/utils";
import type { AttendanceData, AttendanceStatus, AttendanceRecord } from "src/lib/attendanceTypes";

interface Props {
  data: AttendanceData;
  /** URL to POST { roster_member_id, date, note } to. When set, persists to backend instead of localStorage. */
  noteApiUrl?: string;
  /** Whether the current user can edit notes. */
  canEditNotes?: boolean;
}

const STORAGE_KEY = "qroll:matrix-notes";

interface Hover {
  name: string;
  date: string;
  x: number;
  y: number;
}

const formatDate = (d: string) => {
  const parts = d.split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${month}/${day}`;
  }
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

const formatCheckinTime = (isoStr?: string) => {
  if (!isoStr) return "";
  try {
    const date = new Date(isoStr);
    return date.toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const statusLabel = (s: AttendanceStatus | null | undefined) => {
  if (s === "present") return "Present";
  if (s === "late") return "Late";
  if (s === "absent") return "Absent";
  return "No record";
};

const statusClass = (s: AttendanceStatus | null | undefined) => {
  if (s === "present") return "bg-emerald-300 hover:bg-emerald-400";
  if (s === "late") return "bg-amber-300 hover:bg-amber-400";
  if (s === "absent") return "bg-rose-300 hover:bg-rose-400";
  return "bg-muted hover:bg-foreground/10";
};

const statusDotClass = (s: AttendanceStatus | null | undefined) => {
  if (s === "present") return "bg-emerald-500";
  if (s === "late") return "bg-amber-500";
  if (s === "absent") return "bg-rose-500";
  return "bg-muted-foreground/40";
};

export const AttendanceMatrix = ({ data, noteApiUrl, canEditNotes = true }: Props) => {
  const [localData, setLocalData] = useState(data);
  const { dates, attendees } = localData;
  const usingRemote = !!noteApiUrl;

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ name: string; date: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [draftStatus, setDraftStatus] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [hasScrollLeft, setHasScrollLeft] = useState(false);
  const [hasScrollRight, setHasScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setHasScrollLeft(scrollLeft > 5);
    setHasScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scrollByAmount = (amount: number) => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Initial check
    updateScrollState();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateScrollState();
      });
      observer.observe(el);
    }

    // Backup listener for window resizing
    window.addEventListener("resize", updateScrollState);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [dates, attendees]);

  useEffect(() => {
    if (usingRemote) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setNotes(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, [usingRemote]);

  useEffect(() => {
    if (!editing) return;
    const handleClick = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setEditing(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [editing]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [editing]);

  const memberByName = useMemo(() => {
    const m: Record<string, string> = {};
    attendees.forEach(a => { m[a.name] = a.id; });
    return m;
  }, [attendees]);

  const recordIndex = useMemo(() => {
    const idx: Record<string, Record<string, AttendanceRecord>> = {};
    attendees.forEach(a => {
      idx[a.name] = {};
      a.records.forEach(r => {
        idx[a.name][r.date] = r;
      });
    });
    return idx;
  }, [attendees]);

  const noteKey = (name: string, date: string) => `${name}|||${date}`;

  const getNote = (name: string, date: string) => {
    const k = noteKey(name, date);
    if (notes[k] !== undefined) return notes[k];
    return recordIndex[name]?.[date]?.reason || "";
  };

  const hasOverride = (name: string, date: string) =>
    notes[noteKey(name, date)] !== undefined;

  const persistNote = async (name: string, date: string, value: string, selectedStatus: string) => {
    const k = noteKey(name, date);
    const trimmed = value.trim();
    const next = { ...notes };
    if (trimmed === "") delete next[k];
    else next[k] = trimmed;
    setNotes(next);

    if (usingRemote && noteApiUrl) {
      const memberId = memberByName[name];
      if (!memberId) return;
      try {
        setSaving(true);
        const res = await fetch(noteApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roster_member_id: memberId, date, note: trimmed, status: selectedStatus }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save note");
        }

        // B1 fix: update local data so cells re-render immediately
        setLocalData(prev => ({
          ...prev,
          attendees: prev.attendees.map(a => {
            if (a.name !== name) return a;
            if (selectedStatus === 'none') {
              // API deletes the row — remove the record locally
              return { ...a, records: a.records.filter(r => r.date !== date) };
            }
            const existing = a.records.find(r => r.date === date);
            if (existing) {
              return {
                ...a,
                records: a.records.map(r =>
                  r.date === date
                    ? { ...r, status: selectedStatus as AttendanceStatus, reason: trimmed || null }
                    : r
                ),
              };
            }
            // No prior record — insert a new one locally
            const newStatus = (selectedStatus && selectedStatus !== 'none')
              ? selectedStatus as AttendanceStatus
              : 'absent' as AttendanceStatus;
            return {
              ...a,
              records: [...a.records, { date, status: newStatus, reason: trimmed || null }],
            };
          }),
        }));
      } finally {
        setSaving(false);
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  };

  const stats = useMemo(
    () =>
      attendees.map(a => {
        const present = a.records.filter(r => r.status === "present").length;
        const late = a.records.filter(r => r.status === "late").length;
        const absent = a.records.filter(r => r.status === "absent").length;
        const total = a.records.length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        return { name: a.name, present, late, absent, total, rate };
      }),
    [attendees]
  );

  const sortedAttendees = useMemo(
    () => [...attendees].sort((a, b) => a.name.localeCompare(b.name)),
    [attendees]
  );

  const totalsByDate = useMemo(
    () =>
      dates.map(d => {
        let present = 0;
        attendees.forEach(a => {
          const rec = a.records.find(r => r.date === d);
          if (rec?.status === "present" || rec?.status === "late") present++;
        });
        return { date: d, present };
      }),
    [dates, attendees]
  );

  const onCellClick = (name: string, date: string, e: React.MouseEvent) => {
    if (!canEditNotes) return;
    e.stopPropagation();
    setHover(null);
    setEditing({ name, date });
    setDraft(getNote(name, date));
    const rec = recordIndex[name]?.[date];
    setDraftStatus(rec?.status || "none");
  };

  const onCellEnter = (name: string, date: string, e: React.MouseEvent) => {
    if (editing) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ name, date, x: rect.left + rect.width / 2, y: rect.top });
  };

  const onCellLeave = () => setHover(null);

  const renderTooltip = () => {
    if (!hover || editing) return null;
    const rec = recordIndex[hover.name]?.[hover.date];
    const note = getNote(hover.name, hover.date);
    const overridden = hasOverride(hover.name, hover.date);
    return (
      <div
        className="pointer-events-none fixed z-50"
        style={{ left: hover.x, top: hover.y - 8, transform: "translate(-50%, -100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="rounded-2xl border bg-popover text-popover-foreground shadow-[0_8px_30px_rgba(47,39,56,0.12),0_2px_8px_rgba(228,193,249,0.18)] px-3.5 py-2.5 min-w-[180px] max-w-[260px]"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate">{hover.name}</p>
            <p className="text-[10px] text-muted-foreground tabular-nums shrink-0">{hover.date}</p>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={cn("h-2 w-2 rounded-full", statusDotClass(rec?.status))} />
            <span className="text-xs font-medium">{statusLabel(rec?.status)}</span>
            {rec?.checked_in_at && (
              <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                {formatCheckinTime(rec.checked_in_at)}
              </span>
            )}
          </div>
          {note ? (
            <p className="text-xs text-muted-foreground italic leading-snug">
              &ldquo;{note}&rdquo;
              {overridden && <span className="ml-1.5 not-italic text-[9px] uppercase tracking-wide text-[#A9DEF9] font-semibold">edited</span>}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 italic">Click to add a note</p>
          )}

          {/* Geofence verification details */}
          {rec?.verification_status && (
            <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className={cn(
                  "font-semibold",
                  rec.verification_status.startsWith('out_of_bounds') ? "text-rose-500" :
                  rec.verification_status === 'unverified' ? "text-amber-500" : "text-emerald-500"
                )}>
                  {rec.verification_status.startsWith('out_of_bounds') ? "Out of Bounds" :
                   rec.verification_status === 'unverified' ? "Collected" : "Verified"}
                  {rec.verification_method === 'ip' && " (IP)"}
                  {rec.verification_method === 'gps' && " (GPS)"}
                </span>
              </div>
              {rec.calculated_distance_meters !== null && rec.calculated_distance_meters !== undefined && (
                <div className="flex justify-between mt-0.5">
                  <span>Distance:</span>
                  <span>{Math.round(rec.calculated_distance_meters)}m</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const renderEditor = () => {
    if (!editing) return null;
    const rec = recordIndex[editing.name]?.[editing.date];
    const original = rec?.reason || "";
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <motion.div
            ref={editorRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="bg-popover text-popover-foreground border rounded-3xl shadow-[0_20px_60px_rgba(47,39,56,0.12),0_4px_16px_rgba(228,193,249,0.2)] p-6 w-full max-w-md"
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <p className="text-base font-semibold">{editing.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("h-2 w-2 rounded-full", statusDotClass(rec?.status))} />
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(rec?.status)} · {editing.date}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="cursor-pointer p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Status Override
            </label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {["present", "late", "absent", "none"].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraftStatus(s)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all",
                    draftStatus === s 
                      ? s === "present" ? "border-emerald-500 bg-[#D0F4DE] text-[#2F2738]"
                        : s === "late" ? "border-amber-500 bg-amber-50 text-amber-950"
                        : s === "absent" ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-[#2F2738] bg-[#F5EFFA] text-[#2F2738]"
                      : "border-border bg-card text-[#6B6377] hover:bg-muted/40"
                  )}
                >
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full mb-1",
                    s === "present" ? "bg-emerald-500" :
                    s === "late" ? "bg-amber-500" :
                    s === "absent" ? "bg-rose-500" : "bg-muted-foreground"
                  )} />
                  {s === "none" ? "N/A Clear" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Note
            </label>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="e.g. Sick, work conflict, family emergency..."
              className="w-full min-h-[100px] rounded-2xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-all hover:border-foreground/20"
            />

            {original && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Original: <span className="italic">&ldquo;{original}&rdquo;</span>
              </p>
            )}

            {(rec?.verification_status || rec?.checked_in_at) && (
              <div className="mt-4 p-3 bg-muted/50 rounded-2xl text-[11px] text-muted-foreground border">
                <p className="font-semibold text-foreground mb-1">Check-in Audit Log</p>
                {rec.checked_in_at && (
                  <p>Time: {new Date(rec.checked_in_at).toLocaleTimeString("en-US", {
                    timeZone: "America/Los_Angeles",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit"
                  })} (Pacific)</p>
                )}
                {rec.verification_method && <p>Method: {rec.verification_method.toUpperCase()}</p>}
                {rec.verification_status && <p>Status: {rec.verification_status.toUpperCase()}</p>}
                {rec.calculated_distance_meters !== null && rec.calculated_distance_meters !== undefined && (
                  <p>Calculated Distance: {Math.round(rec.calculated_distance_meters)} meters</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-5">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (editing) {
                    await persistNote(editing.name, editing.date, "", draftStatus);
                    setEditing(null);
                  }
                }}
                className="cursor-pointer text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                Clear note
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="cursor-pointer h-9 px-4 rounded-full text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (editing) {
                      await persistNote(editing.name, editing.date, draft, draftStatus);
                      setEditing(null);
                    }
                  }}
                  className="cursor-pointer h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <div className="relative group/matrix">
        {/* Left Gradient Overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-[140px] sm:left-[180px] w-10 bg-gradient-to-r from-card to-transparent z-10 transition-opacity duration-300",
            hasScrollLeft ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />

        {/* Left Scroll Button Container */}
        <div className="absolute inset-y-0 left-[130px] sm:left-[170px] z-20 w-8 pointer-events-none flex items-start justify-center">
          <button
            type="button"
            disabled={!hasScrollLeft}
            onClick={() => scrollByAmount(-200)}
            className={cn(
              "sticky top-[50%] -translate-y-1/2 p-2 text-primary hover:scale-110 active:scale-95 transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center pointer-events-auto",
              hasScrollLeft ? "opacity-60 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.5} />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className="overflow-x-auto premium-scrollbar [scrollbar-width:thin]"
        >
          <table className="border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card z-10 text-left pl-1 pr-3 pb-2 font-medium text-xs text-muted-foreground shadow-[2px_0_0_0_var(--color-card)]">
                <div className="w-[140px] sm:w-[180px]">Attendee</div>
              </th>
              {dates.map(d => (
                <th
                  key={d}
                  className="px-1 pb-2 font-normal text-[10px] text-muted-foreground tabular-nums whitespace-nowrap"
                >
                  {formatDate(d)}
                </th>
              ))}
              <th className="pl-2 pr-2 pb-2 font-medium text-xs text-muted-foreground text-right whitespace-nowrap">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAttendees.map(a => {
              const stat = stats.find(s => s.name === a.name)!;
              return (
                <tr key={a.name} className="group hover:bg-muted/30 transition-colors">
                  <td className="sticky left-0 bg-card group-hover:bg-muted/60 z-10 pl-1 pr-3 py-1 text-sm font-medium transition-colors shadow-[2px_0_0_0_var(--color-card)] group-hover:shadow-[2px_0_0_0_var(--color-muted)]">
                    <div className="w-[140px] sm:w-[180px] truncate" title={a.name}>{a.name}</div>
                  </td>
                  {dates.map(d => {
                    const rec = recordIndex[a.name]?.[d];
                    const note = getNote(a.name, d);
                    const overridden = hasOverride(a.name, d);
                    return (
                      <td key={d} className="px-0.5 py-0.5">
                        <div className="w-7 mx-auto flex justify-center">
                        <button
                          type="button"
                          onClick={e => onCellClick(a.name, d, e)}
                          onMouseEnter={e => onCellEnter(a.name, d, e)}
                          onMouseLeave={onCellLeave}
                          className={cn(
                            "relative h-6 w-6 rounded-md cursor-pointer transition-all hover:scale-125 hover:shadow-md hover:z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            statusClass(rec?.status)
                          )}
                          aria-label={`${a.name} ${d} ${statusLabel(rec?.status)}`}
                        >
                          {(rec?.verification_status === 'out_of_bounds' || rec?.verification_status === 'out_of_bounds_ip') && (
                            <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse border border-card" />
                          )}
                          {note && (
                            <span
                              className={cn(
                                "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-card",
                                overridden ? "bg-[#A9DEF9]" : "bg-foreground/40"
                              )}
                            />
                          )}
                        </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="pl-2 pr-2 py-1 text-sm tabular-nums text-right text-muted-foreground whitespace-nowrap">
                    <span
                      className={cn(
                        stat.rate >= 80
                          ? "text-emerald-600 font-medium"
                          : stat.rate < 50
                            ? "text-rose-600 font-medium"
                            : ""
                      )}
                    >
                      {stat.rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="sticky left-0 bg-card z-10 pl-1 pr-3 pt-3 text-xs font-medium text-muted-foreground whitespace-nowrap shadow-[2px_0_0_0_var(--color-card)]">
                <div className="w-[140px] sm:w-[180px]">Total present</div>
              </td>
              {totalsByDate.map(t => (
                <td
                  key={t.date}
                  className="px-0.5 pt-3 text-center text-[10px] tabular-nums text-muted-foreground"
                >
                  {t.present}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
          </table>
        </div>

        {/* Right Scroll Button Container */}
        <div className="absolute inset-y-0 right-2 z-20 w-8 pointer-events-none flex items-start justify-center">
          <button
            type="button"
            disabled={!hasScrollRight}
            onClick={() => scrollByAmount(200)}
            className={cn(
              "sticky top-[50%] -translate-y-1/2 p-2 text-primary hover:scale-110 active:scale-95 transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center pointer-events-auto",
              hasScrollRight ? "opacity-60 hover:opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Gradient Overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent z-10 transition-opacity duration-300",
            hasScrollRight ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      </div>

      {renderTooltip()}
      {renderEditor()}
    </>
  );
};
