import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";

import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { Badge } from "src/components/ui/badge";
import { formatPacificDate, formatPacificTime } from "src/lib/timeLogic";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  is_historical: boolean;
  description: string | null;
  qr_token: string | null;
  series_id?: string | null;
  occurrence_index?: number | null;
  cancelled_at?: string | null;
};

interface Props {
  events: EventRow[];
}

export function EventsTable({ events }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "starts_at", desc: true },
  ]);
  const [filter, setFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<EventRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const ev = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-sm font-medium truncate ${ev.cancelled_at ? "line-through text-muted-foreground" : ""}`}>
                {ev.title}
              </span>
              {ev.is_historical && <Badge variant="outline">Historical</Badge>}
              {ev.series_id && (
                <Badge variant="secondary" title={`Occurrence #${(ev.occurrence_index ?? 0) + 1}`}>
                  Recurring
                </Badge>
              )}
              {ev.cancelled_at && <Badge variant="destructive">Cancelled</Badge>}
            </div>
          );
        },
      },
      {
        accessorKey: "starts_at",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className="text-sm tabular-nums whitespace-nowrap">
              {formatPacificDate(v)}
            </span>
          );
        },
        sortingFn: "datetime",
      },
      {
        accessorKey: "starts_at",
        id: "time",
        header: () => (
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Time
          </span>
        ),
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
              {formatPacificTime(v)}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const ev = row.original;
          return (
            <div className="flex justify-end gap-2">
              <form method="post" action={`/api/events/${ev.id}/cancel`} onClick={e => e.stopPropagation()}>
                  {ev.cancelled_at && <input type="hidden" name="undo" value="1" />}
                  <Button type="submit" variant="outline" size="sm">
                    {ev.cancelled_at ? "Restore" : "Cancel"}
                  </Button>
                </form>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _id, value) =>
      row.original.title.toLowerCase().includes((value as string).toLowerCase()),
  });

  if (!events.length) {
    return (
      <div className="border border-dashed rounded-xl text-center py-16 px-6 flex flex-col items-center bg-card">
        <div className="p-3 rounded-full bg-muted mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-base font-medium">No events yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first event to generate a check-in QR code.
        </p>
        <a href="/admin/events/new" className="mt-5">
          <Button variant="outline" size="sm">
            Create first event
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search events..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="hidden md:block rounded-xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-muted/30">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="text-left px-4 py-3 first:pl-6 last:pr-6">
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const ev = row.original;
              const cells = row.getVisibleCells();
              return (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/60 transition-colors">
                  {cells.map((cell, idx) => {
                    const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                    if (cell.column.id === "actions") {
                      return (
                        <td key={cell.id} className="px-4 py-3 first:pl-6 last:pr-6">
                          {content}
                        </td>
                      );
                    }
                    const isFirst = idx === 0;
                    const isLast = idx === cells.length - 1;
                    return (
                      <td key={cell.id} className="p-0">
                        <a
                          href={`/admin/events/${ev.id}`}
                          className={`block py-3 h-full w-full ${isFirst ? "pl-6 pr-4" : isLast ? "pl-4 pr-6" : "px-4"}`}
                        >
                          {content}
                        </a>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {!table.getRowModel().rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No events match "{filter}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map(row => {
          const ev = row.original;
          return (
            <a
              key={row.id}
              href={`/admin/events/${ev.id}`}
              className="block rounded-xl border bg-card p-4 flex flex-col gap-4 hover:bg-muted/40 transition-colors text-card-foreground hover:no-underline"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`text-sm font-medium truncate min-w-0 ${
                    ev.cancelled_at ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {ev.title}
                </span>
                {ev.is_historical && <Badge variant="outline">Historical</Badge>}
                {ev.series_id && (
                  <Badge variant="secondary">Recurring</Badge>
                )}
                {ev.cancelled_at && (
                  <Badge variant="destructive">Cancelled</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground tabular-nums">
                {formatPacificDate(ev.starts_at)}
                {" · "}
                {formatPacificTime(ev.starts_at)}
              </div>
              {ev.series_id && (
                <div className="flex flex-wrap gap-2">
                  <form method="post" action={`/api/events/${ev.id}/cancel`} onClick={e => e.stopPropagation()}>
                    {ev.cancelled_at && <input type="hidden" name="undo" value="1" />}
                    <Button type="submit" variant="outline" size="sm">
                      {ev.cancelled_at ? "Restore" : "Cancel"}
                    </Button>
                  </form>
                </div>
              )}
            </a>
          );
        })}
        {!table.getRowModel().rows.length && (
          <div className="rounded-xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No events match "{filter}"
          </div>
        )}
      </div>
    </div>
  );
}
