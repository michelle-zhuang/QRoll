import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { AttendeeStat } from "../lib/attendanceTypes";

export type LeaderboardVariant = "top" | "least" | "late";

interface LeaderboardModalProps {
  title: string;
  description?: string;
  rows: AttendeeStat[];
  variant: LeaderboardVariant;
  triggerLabel?: string;
}

function rowMeta(row: AttendeeStat, variant: LeaderboardVariant) {
  if (variant === "top") {
    return {
      sub: `${row.present} present · ${row.late} late · ${row.absent} absent`,
      badge: `${row.attendanceRate}%`,
      badgeClass: "border-transparent bg-emerald-100 text-emerald-700",
    };
  }
  if (variant === "least") {
    return {
      sub: `${row.absent} missed · ${row.attendanceRate}% rate`,
      badge: `${row.present + row.late}/${row.total}`,
      badgeClass: "border-border text-foreground",
    };
  }
  return {
    sub: `${row.present} present · ${row.absent} absent`,
    badge: `${row.late} late`,
    badgeClass: "border-transparent bg-amber-100 text-amber-700",
  };
}

export default function LeaderboardModal({
  title,
  description,
  rows,
  variant,
  triggerLabel = "View all",
}: LeaderboardModalProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Trap Tab focus inside the dialog while it is open
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the trigger that opened the modal
      trigger?.focus();
    };
  }, [open ]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {triggerLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                  {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {rows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No records yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {rows.map((row, i) => {
                      const meta = rowMeta(row, variant);
                      return (
                        <li
                          key={row.id}
                          className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3"
                        >
                          <span className="w-7 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{meta.sub}</p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-full border px-3 py-0.5 text-xs font-semibold",
                              meta.badgeClass
                            )}
                          >
                            {meta.badge}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "member" : "members"} total
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
