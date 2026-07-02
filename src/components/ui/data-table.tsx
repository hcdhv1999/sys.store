"use client";

import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Input } from "./input";
import { EmptyState } from "./empty-state";
import { Button } from "./button";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  /** extra controls rendered beside the search box (filters etc.) */
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({ data, columns, searchPlaceholder, toolbar, onRowClick, pageSize = 10 }: DataTableProps<T>) {
  const { t, locale } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;
  const { pageIndex } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 ltr:left-3 rtl:right-3" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder ?? t("common.search")}
            className="ps-9"
            aria-label={t("common.search")}
          />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-start text-[11px] font-bold tracking-wide text-ink-3 uppercase whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          className="inline-flex cursor-pointer items-center gap-1 hover:text-ink"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : dir === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-surface-2/60",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <EmptyState /> : null}
      </div>

      {total > pageSize ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs text-ink-2 tabular-nums">
            {t("common.showing")} {nf.format(from)}–{nf.format(to)} {t("common.of")} {nf.format(total)}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label={t("common.previous")}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t("common.previous")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label={t("common.next")}>
              {t("common.next")}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
