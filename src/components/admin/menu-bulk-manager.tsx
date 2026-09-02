"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import type { CmsOption, CmsRecord } from "@/components/admin/cms-manager";
import { Button } from "@/components/ui/button";
import { parseMenuCsv, type MenuCsvRow } from "@/lib/menu/csv";
import type { MenuImportPreviewRow } from "@/lib/menu/import-validation";

type Preview = {
  rows: MenuImportPreviewRow[];
  summary: { total: number; valid: number; warnings: number; errors: number; newRecords: number; updates: number; duplicates: number };
};

type MenuBulkManagerProps = {
  selectedIds: Set<string>;
  categories: CmsOption[];
  onItemsChanged: (items: CmsRecord[]) => void;
  onSelectionChanged: (ids: Set<string>) => void;
};

export function MenuBulkManager({ selectedIds, categories, onItemsChanged, onSelectionChanged }: MenuBulkManagerProps) {
  const importDialog = useRef<HTMLDialogElement>(null);
  const bulkDialog = useRef<HTMLDialogElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedCount = selectedIds.size;

  async function directAction(intent: "archive" | "restore") {
    if (!selectedCount) return;
    const label = intent === "archive" ? "Archive" : "Restore as draft";
    if (!window.confirm(`${label} ${selectedCount} selected menu items?`)) return;
    const response = await fetch("/api/admin/menu/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: [...selectedIds], intent, changes: {} }) });
    const payload = await response.json() as { message?: string; result?: { updated: number; items: CmsRecord[] } };
    if (!response.ok || !payload.result) setNotice(payload.message ?? "Bulk action failed.");
    else {
      onItemsChanged(payload.result.items);
      onSelectionChanged(new Set());
      setNotice(`${payload.result.updated} menu items ${intent === "archive" ? "archived" : "restored as draft"}.`);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gold/30 bg-cream/45 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => importDialog.current?.showModal()}>Import Menu</Button>
        <a href="/api/admin/menu/export?template=1" className="inline-flex min-h-12 items-center rounded-full border border-dark-green/20 px-5 text-xs font-bold tracking-wide uppercase hover:bg-white">Download CSV Template</a>
        <a href="/api/admin/menu/export" className="inline-flex min-h-12 items-center rounded-full border border-dark-green/20 px-5 text-xs font-bold tracking-wide uppercase hover:bg-white">Export Menu</a>
        <span className="ml-auto text-sm font-semibold">{selectedCount} selected</span>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => bulkDialog.current?.showModal()}>Bulk edit</Button>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => void directAction("archive")}>Archive</Button>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => void directAction("restore")}>Restore</Button>
      </div>
      {notice ? <p role="status" className="mt-4 rounded-md bg-white px-4 py-3 text-sm">{notice}</p> : null}
      <ImportDialog dialogRef={importDialog} onImported={(changed, message) => { onItemsChanged(changed); setNotice(message); }} />
      <BulkDialog dialogRef={bulkDialog} ids={[...selectedIds]} categories={categories} onSaved={(changed, message) => { onItemsChanged(changed); onSelectionChanged(new Set()); setNotice(message); }} />
    </div>
  );
}

function ImportDialog({ dialogRef, onImported }: { dialogRef: React.RefObject<HTMLDialogElement | null>; onImported: (items: CmsRecord[], message: string) => void }) {
  const [rows, setRows] = useState<MenuCsvRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importValidOnly, setImportValidOnly] = useState(false);
  const [allowUpdates, setAllowUpdates] = useState(false);
  const [page, setPage] = useState(0);
  const pageRows = useMemo(() => preview?.rows.slice(page * 50, page * 50 + 50) ?? [], [page, preview]);

  function reset() { setRows([]); setPreview(null); setError(null); setImportValidOnly(false); setAllowUpdates(false); setPage(0); }
  function close() { if (!busy) { dialogRef.current?.close(); reset(); } }

  async function chooseFile(file: File | undefined) {
    reset();
    if (!file) return;
    if (file.size > 2_000_000) { setError("CSV files must be 2 MB or smaller."); return; }
    const parsed = parseMenuCsv(await file.text());
    if (!parsed.ok) { setError(parsed.message); return; }
    if (parsed.rows.length > 1000) { setError("CSV imports are limited to 1,000 rows per batch."); return; }
    setRows(parsed.rows);
    setBusy(true);
    const response = await fetch("/api/admin/menu/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows: parsed.rows }) });
    const payload = await response.json() as Preview & { message?: string };
    setBusy(false);
    if (!response.ok) setError(payload.message ?? "CSV preview could not be prepared.");
    else setPreview(payload);
  }

  async function confirmImport() {
    if (!preview) return;
    const importCount = preview.summary.newRecords + (allowUpdates ? preview.summary.updates : 0);
    if (!importCount) { setError("No new or explicitly confirmed update rows are available."); return; }
    if (preview.summary.errors && !importValidOnly) { setError("Choose “Import valid rows only” or cancel the import."); return; }
    if (!window.confirm(`Import ${importCount} valid menu items?${allowUpdates ? ` This includes ${preview.summary.updates} confirmed updates.` : ""}`)) return;
    setBusy(true); setError(null);
    const response = await fetch("/api/admin/menu/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows, importValidOnly, allowUpdates }) });
    const payload = await response.json() as { message?: string; result?: { created: number; updated: number; items: CmsRecord[] }; skipped?: number };
    setBusy(false);
    if (!response.ok || !payload.result) { setError(payload.message ?? "Import failed."); return; }
    onImported(payload.result.items, `Import complete: ${payload.result.created} created, ${payload.result.updated} updated, ${payload.skipped ?? 0} skipped.`);
    close();
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="menu-import-title" className="m-auto max-h-[calc(100vh-2rem)] w-[min(72rem,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white p-0 text-dark-green shadow-2xl backdrop:bg-dark-green/70" onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-palem-green uppercase">CSV workflow</p><h3 id="menu-import-title" className="mt-2 font-serif text-4xl">Import Menu</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-dark-green/60">Choose a CSV, review every classification, then explicitly confirm new records and optional updates. Categories are never created automatically.</p></div><button type="button" onClick={close} aria-label="Close import" className="rounded px-3 py-2 text-xl hover:bg-cream">×</button></div>
        <label className="mt-7 block rounded-lg border border-dashed border-dark-green/25 bg-cream/40 p-5"><span className="block text-sm font-bold">Menu CSV file</span><input type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => void chooseFile(event.target.files?.[0])} className="mt-3 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-palem-green file:px-5 file:py-3 file:text-xs file:font-bold file:text-white file:uppercase" /></label>
        {busy ? <p role="status" className="mt-5">Processing CSV…</p> : null}
        {error ? <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p> : null}
        {preview ? <>
          <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">{Object.entries({ Total: preview.summary.total, Valid: preview.summary.valid, Warnings: preview.summary.warnings, Errors: preview.summary.errors, New: preview.summary.newRecords, Updates: preview.summary.updates, Duplicates: preview.summary.duplicates }).map(([label, value]) => <div key={label} className="rounded-md border border-dark-green/10 bg-cream/45 p-3"><dt className="text-[0.65rem] font-bold tracking-wide uppercase">{label}</dt><dd className="mt-1 font-serif text-3xl">{value}</dd></div>)}</dl>
          <div className="mt-6 max-h-[24rem] overflow-auto rounded-md border border-dark-green/10"><table className="w-full min-w-[54rem] text-left text-sm"><thead className="sticky top-0 bg-dark-green text-white"><tr><th className="p-3">Row</th><th className="p-3">Result</th><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Details</th></tr></thead><tbody>{pageRows.map((row) => <tr key={row.rowNumber} className="border-t border-dark-green/10 align-top"><td className="p-3">{row.rowNumber}</td><td className="p-3 font-bold">{row.classification}</td><td className="p-3">{row.source.name || "—"}</td><td className="p-3">{row.source.category || "—"}</td><td className="p-3"><ul>{[...row.errors, ...row.warnings].map((message) => <li key={message} className={row.errors.includes(message) ? "text-red-800" : "text-amber-800"}>{message}</li>)}</ul></td></tr>)}</tbody></table></div>
          {preview.rows.length > 50 ? <div className="mt-3 flex items-center justify-end gap-3"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm">Page {page + 1} of {Math.ceil(preview.rows.length / 50)}</span><button type="button" disabled={(page + 1) * 50 >= preview.rows.length} onClick={() => setPage((value) => value + 1)} className="rounded px-3 py-2 text-sm disabled:opacity-40">Next</button></div> : null}
          <div className="mt-6 grid gap-3"><label className="flex items-start gap-3"><input type="checkbox" checked={importValidOnly} onChange={(event) => setImportValidOnly(event.target.checked)} className="mt-1 size-4 accent-palem-green" /><span><strong>Import valid rows only</strong><span className="block text-sm text-dark-green/60">Required when errors or duplicates exist; invalid rows are skipped.</span></span></label>{preview.summary.updates ? <label className="flex items-start gap-3"><input type="checkbox" checked={allowUpdates} onChange={(event) => setAllowUpdates(event.target.checked)} className="mt-1 size-4 accent-palem-green" /><span><strong>Update {preview.summary.updates} existing records</strong><span className="block text-sm text-dark-green/60">Explicitly permits rows matched by SKU or slug to overwrite CSV-managed fields only.</span></span></label> : null}</div>
        </> : null}
        <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={close}>Cancel</Button><Button type="button" disabled={!preview || busy} onClick={() => void confirmImport()}>Confirm import</Button></div>
      </div>
    </dialog>
  );
}

function BulkDialog({ dialogRef, ids, categories, onSaved }: { dialogRef: React.RefObject<HTMLDialogElement | null>; ids: string[]; categories: CmsOption[]; onSaved: (items: CmsRecord[], message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget); const changes: Record<string, unknown> = {};
    if (data.get("use_category")) changes.category_id = data.get("category_id");
    if (data.get("use_featured")) changes.featured = data.get("featured") === "true";
    if (data.get("use_availability")) changes.availability = data.get("availability");
    if (data.get("use_status")) changes.status = data.get("status");
    if (data.get("use_display_order")) changes.display_order = Number(data.get("display_order"));
    if (!Object.keys(changes).length) { setError("Select at least one field to change."); return; }
    if (!window.confirm(`Apply the selected field changes to ${ids.length} menu items?`)) return;
    setBusy(true); setError(null);
    const response = await fetch("/api/admin/menu/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids, intent: "update", changes }) });
    const payload = await response.json() as { message?: string; result?: { updated: number; items: CmsRecord[] } };
    setBusy(false);
    if (!response.ok || !payload.result) setError(payload.message ?? "Bulk edit failed.");
    else { onSaved(payload.result.items, `${payload.result.updated} menu items updated.`); dialogRef.current?.close(); }
  }
  return <dialog ref={dialogRef} aria-labelledby="bulk-menu-title" className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-lg bg-white p-0 text-dark-green shadow-2xl backdrop:bg-dark-green/70"><form onSubmit={submit} className="p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-[0.18em] text-palem-green uppercase">{ids.length} selected</p><h3 id="bulk-menu-title" className="mt-2 font-serif text-4xl">Bulk edit</h3></div><button type="button" disabled={busy} onClick={() => dialogRef.current?.close()} aria-label="Close bulk editor" className="rounded px-3 py-2 text-xl hover:bg-cream">×</button></div><p className="mt-4 text-sm text-dark-green/60">Only checked fields will be changed.</p><fieldset disabled={busy} className="mt-6 grid gap-4">{[
    ["category", "Category", <select key="category" name="category_id" className="min-h-11 flex-1 rounded border border-dark-green/20 bg-white px-3"><option value="">Choose category</option>{categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>],
    ["featured", "Featured", <select key="featured" name="featured" className="min-h-11 flex-1 rounded border border-dark-green/20 bg-white px-3"><option value="true">Featured</option><option value="false">Not featured</option></select>],
    ["availability", "Availability", <select key="availability" name="availability" className="min-h-11 flex-1 rounded border border-dark-green/20 bg-white px-3"><option value="available">Available</option><option value="unavailable">Unavailable</option></select>],
    ["status", "Status", <select key="status" name="status" className="min-h-11 flex-1 rounded border border-dark-green/20 bg-white px-3"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>],
    ["display_order", "Display order", <input key="display_order" name="display_order" type="number" min="0" step="1" defaultValue="0" className="min-h-11 flex-1 rounded border border-dark-green/20 px-3" />],
  ].map(([key, label, control]) => <label key={String(key)} className="flex flex-col gap-2 rounded-md border border-dark-green/10 p-3 sm:flex-row sm:items-center"><span className="flex min-w-40 items-center gap-2 font-semibold"><input type="checkbox" name={`use_${key}`} className="size-4 accent-palem-green" />{label}</span>{control}</label>)}</fieldset>{error ? <p role="alert" className="mt-5 rounded bg-red-50 p-3 text-sm text-red-900">{error}</p> : null}<div className="mt-7 flex justify-end gap-3"><Button type="button" variant="ghost" disabled={busy} onClick={() => dialogRef.current?.close()}>Cancel</Button><Button type="submit" disabled={busy}>Apply changes</Button></div></form></dialog>;
}
