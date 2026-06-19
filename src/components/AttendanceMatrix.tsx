import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "src/lib/utils";
import type { AttendanceData, AttendanceStatus } from "src/lib/attendanceTypes";

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
  const { dates, attendees } = data;
  const usingRemote = !!noteApiUrl;

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ name: string; date: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const idx: Record<string, Record<string, { status: AttendanceStatus; reason: string | null }>> = {};
    attendees.forEach(a => {
      idx[a.name] = {};
      a.records.forEach(r => {
        idx[a.name][r.date] = { status: r.status, reason: r.reason };
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

  const persistNote = async (name: string, date: string, value: string) => {
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
          body: JSON.stringify({ roster_member_id: memberId, date, note: trimmed }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save note");
        }
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
          </div>
          {note ? (
            <p className="text-xs text-muted-foreground italic leading-snug">
              &ldquo;{note}&rdquo;
              {overridden && <span className="ml-1.5 not-italic text-[9px] uppercase tracking-wide text-[#A9DEF9] font-semibold">edited</span>}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 italic">Click to add a note</p>
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

            <div className="flex items-center justify-between gap-2 mt-5">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (editing) {
                    await persistNote(editing.name, editing.date, "");
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
                      await persistNote(editing.name, editing.date, draft);
                      setEditing(null);
                    }
                  }}
                  className="cursor-pointer h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save note"}
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
      <div className="relative">
        <div className="overflow-x-auto -mx-6 [scrollbar-width:thin]">
          <table className="border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card z-10 text-left pl-6 pr-3 pb-2 font-medium text-xs text-muted-foreground shadow-[2px_0_0_0_var(--color-card)]">
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
              <th className="pl-2 pr-6 pb-2 font-medium text-xs text-muted-foreground text-right whitespace-nowrap">
                Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAttendees.map(a => {
              const stat = stats.find(s => s.name === a.name)!;
              return (
                <tr key={a.name} className="group">
                  <td className="sticky left-0 bg-card group-hover:bg-muted/40 z-10 pl-6 pr-3 py-1 text-sm font-medium transition-colors shadow-[2px_0_0_0_var(--color-card)] group-hover:shadow-[2px_0_0_0_var(--color-muted)]">
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
                  <td className="pl-2 pr-6 py-1 text-sm tabular-nums text-right text-muted-foreground whitespace-nowrap">
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
              <td className="sticky left-0 bg-card z-10 pl-6 pr-3 pt-3 text-xs font-medium text-muted-foreground whitespace-nowrap shadow-[2px_0_0_0_var(--color-card)]">
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
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent sm:hidden" aria-hidden />
      </div>

      {renderTooltip()}
      {renderEditor()}
    </>
  );
};
