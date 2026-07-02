"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  HardDrive,
  History,
  PenTool,
  Upload,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { employeeName, storageUsedMB } from "@/lib/data/queries";
import { files as seedFiles, folders as seedFolders, TENANT_ID } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types";

const columnHelper = createColumnHelper<FileItem>();

const typeMeta: Record<FileItem["type"], { icon: typeof FileText; className: string }> = {
  pdf: { icon: FileText, className: "bg-danger-bg text-danger" },
  doc: { icon: FileText, className: "bg-info-bg text-info" },
  sheet: { icon: FileSpreadsheet, className: "bg-success-bg text-success" },
  image: { icon: FileImage, className: "bg-warning-bg text-warning" },
  video: { icon: FileVideo, className: "bg-accent/12 text-accent" },
  design: { icon: PenTool, className: "bg-info-bg text-info" },
};

const STORAGE_QUOTA_MB = 5 * 1024;

const uploadSchema = z.object({
  name: z.string().min(3),
  folder: z.string().min(1),
  type: z.enum(["pdf", "doc", "sheet", "image", "video", "design"]),
  sizeMB: z.coerce.number().positive().max(1024),
});
type UploadForm = z.infer<typeof uploadSchema>;

export default function FilesPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [files, setFiles] = useState<FileItem[]>(seedFiles);
  const [folders, setFolders] = useState<string[]>([...seedFolders]);
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const usedMB = useMemo(() => files.reduce((s, f) => s + f.sizeMB, storageUsedMB() - seedFiles.reduce((x, f) => x + f.sizeMB, 0)), [files]);
  const usedPct = Math.min(100, (usedMB / STORAGE_QUOTA_MB) * 100);

  const filtered = folderFilter === "all" ? files : files.filter((f) => f.folder === folderFilter);

  const columns = useMemo<ColumnDef<FileItem, unknown>[]>(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("common.name"),
          cell: (info) => {
            const meta = typeMeta[info.row.original.type];
            return (
              <span className="flex items-center gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.className)}>
                  <meta.icon className="h-4 w-4" />
                </span>
                <span className="max-w-72 truncate font-semibold text-ink">{info.getValue()}</span>
              </span>
            );
          },
        }),
        columnHelper.accessor("folder", {
          header: t("files.folders"),
          cell: (info) => <Badge tone="neutral">{info.getValue()}</Badge>,
        }),
        columnHelper.accessor("sizeMB", {
          header: t("files.size"),
          cell: (info) => {
            const size = info.getValue();
            return (
              <span className="text-ink-2 tabular-nums" dir="ltr">
                {size >= 1024 ? `${formatNumber(size / 1024, locale, 1)} GB` : `${formatNumber(size, locale, 1)} MB`}
              </span>
            );
          },
        }),
        columnHelper.accessor((row) => employeeName(row.ownerId), {
          id: "owner",
          header: t("files.owner"),
          cell: (info) => (
            <span className="flex items-center gap-2 text-ink-2">
              <Avatar name={info.getValue() as string} size="sm" />
              {info.getValue() as string}
            </span>
          ),
        }),
        columnHelper.accessor("modifiedAt", {
          header: t("files.modified"),
          cell: (info) => <span className="text-ink-2 tabular-nums">{formatDate(info.getValue(), locale)}</span>,
        }),
        columnHelper.accessor("versions", {
          header: t("files.versions"),
          cell: (info) => (
            <span className="flex items-center gap-1 text-ink-2 tabular-nums">
              <History className="h-3.5 w-3.5 text-ink-3" />
              {formatNumber(info.getValue(), locale)}
            </span>
          ),
        }),
      ] as ColumnDef<FileItem, unknown>[],
    [t, locale],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({ resolver: zodResolver(uploadSchema), defaultValues: { type: "pdf", sizeMB: 1 } });

  const onUpload = handleSubmit((values) => {
    setFiles((prev) => [
      {
        id: `f-${Date.now()}`,
        tenantId: TENANT_ID,
        name: values.name,
        folder: values.folder,
        type: values.type,
        sizeMB: values.sizeMB,
        ownerId: "e-1",
        modifiedAt: new Date().toISOString(),
        versions: 1,
      },
      ...prev,
    ]);
    reset({ type: "pdf", sizeMB: 1 });
    setUploadOpen(false);
    toast(`${t("files.upload")}: ${values.name} ✓`);
  });

  function createFolder() {
    const name = newFolderName.trim();
    if (name.length < 2 || folders.includes(name)) return;
    setFolders((prev) => [...prev, name]);
    setNewFolderName("");
    setFolderOpen(false);
    toast(`${t("files.newFolder")}: ${name} ✓`);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t("files.title")}
        subtitle={t("files.subtitle")}
        actions={
          <>
            <Button variant="outline" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              {t("files.newFolder")}
            </Button>
            <Button variant="accent" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              {t("files.upload")}
            </Button>
          </>
        }
      />

      {/* Storage usage */}
      <Card className="mb-6 flex flex-wrap items-center gap-5 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary dark:bg-primary/15">
          <HardDrive className="h-5 w-5" />
        </span>
        <div className="min-w-56 flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-2">{t("files.storageUsed")}</span>
            <span className="font-bold text-ink tabular-nums" dir="ltr">
              {formatNumber(usedMB / 1024, locale, 1)} / {formatNumber(STORAGE_QUOTA_MB / 1024, locale, 0)} GB
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usedPct}%` }} />
          </div>
        </div>
        <p className="text-xs text-ink-3 tabular-nums">{formatNumber(files.length, locale)} {t("files.title")}</p>
      </Card>

      {/* Folders */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {folders.map((folder) => {
          const items = files.filter((f) => f.folder === folder);
          const active = folderFilter === folder;
          return (
            <button
              key={folder}
              onClick={() => setFolderFilter(active ? "all" : folder)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-start transition-all",
                active ? "border-accent bg-accent/8 shadow-soft" : "border-border bg-surface hover:border-accent/50",
              )}
            >
              <Folder className={cn("h-6 w-6", active ? "text-accent" : "text-ink-3")} fill={active ? "currentColor" : "none"} />
              <p className="mt-2 truncate text-sm font-bold text-ink">{folder}</p>
              <p className="mt-0.5 text-[11px] text-ink-3 tabular-nums">{formatNumber(items.length, locale)} {t("files.title")}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <DataTable data={filtered} columns={columns} searchPlaceholder={t("common.search")} />
      </Card>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} title={t("files.upload")}
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={onUpload} disabled={isSubmitting}>{t("files.upload")}</Button>
          </>
        }
      >
        <form onSubmit={onUpload} className="space-y-4" noValidate>
          <Field label={t("common.name")} error={errors.name && t("common.noResultsHint")}>
            <Input placeholder="عرض-الخدمات-2026.pdf" {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("files.folders")} error={errors.folder && t("common.noResultsHint")}>
              <Select {...register("folder")}>
                <option value="">—</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("files.size")} error={errors.sizeMB && t("common.noResultsHint")}>
              <Input type="number" min={0.1} step={0.1} dir="ltr" {...register("sizeMB")} />
            </Field>
          </div>
          <Field label={t("common.status")}>
            <Select {...register("type")}>
              {(Object.keys(typeMeta) as FileItem["type"][]).map((type) => (
                <option key={type} value={type}>{type.toUpperCase()}</option>
              ))}
            </Select>
          </Field>
        </form>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={folderOpen} onClose={() => setFolderOpen(false)} title={t("files.newFolder")}
        footer={
          <>
            <Button variant="outline" onClick={() => setFolderOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={createFolder} disabled={newFolderName.trim().length < 2}>{t("common.create")}</Button>
          </>
        }
      >
        <Field label={t("common.name")}>
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} />
        </Field>
      </Dialog>
    </div>
  );
}
