"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { MenuBulkManager } from "@/components/admin/menu-bulk-manager";
import { CategoryBulkManager } from "@/components/admin/category-bulk-manager";
import { Button } from "@/components/ui/button";
import type { CmsField, CmsModuleConfig } from "@/lib/cms/config";

export type CmsRecord = Record<string, unknown> & { id: string };
export type CmsOption = { value: string; label: string; previewUrl?: string | null };

type CmsManagerProps = {
  config: CmsModuleConfig;
  initialItems: CmsRecord[];
  mediaOptions: CmsOption[];
  relationOptions?: Record<string, CmsOption[]>;
  readOnly: boolean;
};

export function CmsManager({
  config,
  initialItems,
  mediaOptions,
  relationOptions = {},
  readOnly,
}: CmsManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [featured, setFeatured] = useState("all");
  const [selected, setSelected] = useState<CmsRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        const title = String(item[config.titleField] ?? "").toLocaleLowerCase();
        const matchesSearch = !term || title.includes(term);
        const matchesStatus =
          status === "all" ||
          String(item.status ?? (item.active ? "active" : "inactive")) === status;
        const matchesCategory =
          category === "all" || String(item.category_id ?? "") === category;
        const matchesFeatured =
          featured === "all" || String(Boolean(item.featured)) === featured;
        return matchesSearch && matchesStatus && matchesCategory && matchesFeatured;
      })
      .sort((a, b) =>
        Number(a.display_order ?? 0) - Number(b.display_order ?? 0) ||
        String(a[config.titleField] ?? "").localeCompare(
          String(b[config.titleField] ?? ""),
        ),
      );
  }, [category, config.titleField, featured, items, search, status]);

  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const pageItems = visibleItems.slice(page * pageSize, page * pageSize + pageSize);

  function mergeItems(changedItems: CmsRecord[]) {
    setItems((current) => {
      const changed = new Map(changedItems.map((item) => [item.id, item]));
      const merged = current.map((item) => changed.has(item.id) ? { ...item, ...changed.get(item.id) } : item);
      const currentIds = new Set(current.map((item) => item.id));
      return [...changedItems.filter((item) => !currentIds.has(item.id)), ...merged];
    });
  }

  function open(item: CmsRecord | null) {
    setSelected(item);
    setCreating(!item);
    dialogRef.current?.showModal();
  }

  function saved(item: CmsRecord) {
    setItems((current) => {
      const exists = current.some((existing) => existing.id === item.id);
      return exists
        ? current.map((existing) => (existing.id === item.id ? { ...existing, ...item } : existing))
        : [config.key === "menu-categories" ? { ...item, menu_items: [{ count: 0 }] } : item, ...current];
    });
    setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} saved.`);
    dialogRef.current?.close();
  }

  const filterOptions = config.statuses
    ? config.statuses
    : config.activeField
      ? ["active", "inactive"]
      : [];

  return (
    <section className="rounded-lg border border-dark-green/10 bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl">{config.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-green/60">
            {config.description}
          </p>
        </div>
        {!readOnly ? <Button onClick={() => open(null)}>Create</Button> : null}
      </div>

      {readOnly ? (
        <p className="mt-5 rounded-md border border-gold/35 bg-cream/60 px-4 py-3 text-sm">
          Read-only access. You do not have permission to change this content.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-5 rounded-md bg-cream px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      {config.key === "menu-items" && !readOnly ? (
        <MenuBulkManager
          selectedIds={selectedIds}
          categories={relationOptions.categories ?? []}
          onItemsChanged={mergeItems}
          onSelectionChanged={setSelectedIds}
        />
      ) : null}
      {config.key === "menu-categories" && !readOnly ? (
        <CategoryBulkManager selectedIds={selectedIds} onItemsChanged={mergeItems} onSelectionChanged={setSelectedIds} />
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0); }}
            className="min-h-12 w-full rounded-md border border-dark-green/20 px-3"
            placeholder={`Search ${config.title.toLocaleLowerCase()}`}
          />
        </label>
        {filterOptions.length ? (
          <label>
            <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Status</span>
            <select
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(0); }}
              className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3 capitalize"
            >
              <option value="all">All</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {config.key === "menu-items" ? (
          <>
            <label>
              <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Category</span>
              <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }} className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3">
                <option value="all">All categories</option>
                {(relationOptions.categories ?? []).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold tracking-wide uppercase">Featured</span>
              <select value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(0); }} className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3">
                <option value="all">All items</option>
                <option value="true">Featured</option>
                <option value="false">Not featured</option>
              </select>
            </label>
          </>
        ) : null}
      </div>

      {visibleItems.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-dark-green/15 text-xs tracking-wide text-dark-green/55 uppercase">
                {(config.key === "menu-items" || config.key === "menu-categories") && !readOnly ? (
                  <th className="w-12 px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select all ${config.title.toLocaleLowerCase()} on this page`}
                      checked={pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id))}
                      onChange={(event) => setSelectedIds((current) => {
                        const next = new Set(current);
                        pageItems.forEach((item) => event.target.checked ? next.add(item.id) : next.delete(item.id));
                        return next;
                      })}
                      className="size-4 accent-palem-green"
                    />
                  </th>
                ) : null}
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Order</th>
                {config.key === "menu-categories" ? <th className="px-3 py-3">Items</th> : null}
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className="border-b border-dark-green/8 last:border-0">
                  {(config.key === "menu-items" || config.key === "menu-categories") && !readOnly ? (
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${String(item[config.titleField] ?? "menu item")}`}
                        checked={selectedIds.has(item.id)}
                        onChange={(event) => setSelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(item.id); else next.delete(item.id);
                          return next;
                        })}
                        className="size-4 accent-palem-green"
                      />
                    </td>
                  ) : null}
                  <td className="px-3 py-4 font-semibold">
                    {String(item[config.titleField] ?? "Untitled")}
                    {item.price !== undefined ? (
                      <span className="mt-1 block text-xs font-normal text-dark-green/55">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(item.price))}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 capitalize">
                    {String(item.status ?? (item.active ? "active" : "inactive"))}
                  </td>
                  <td className="px-3 py-4">{String(item.display_order ?? "—")}</td>
                  {config.key === "menu-categories" ? <td className="px-3 py-4">{categoryItemCount(item)}</td> : null}
                  <td className="px-3 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => open(item)}
                      className="rounded-full px-4 py-2 text-xs font-bold tracking-wide text-palem-green uppercase hover:bg-cream"
                    >
                      {readOnly ? "View" : "Edit"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-md border border-dashed border-dark-green/20 px-5 py-12 text-center text-sm text-dark-green/60">
          No content records found.
        </p>
      )}

      {visibleItems.length > pageSize ? (
        <div className="mt-5 flex items-center justify-end gap-3 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded px-3 py-2 font-semibold disabled:opacity-40">Previous</button>
          <span>Page {page + 1} of {pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="rounded px-3 py-2 font-semibold disabled:opacity-40">Next</button>
        </div>
      ) : null}

      <CmsEditor
        key={`${selected?.id ?? "new"}-${creating}`}
        dialogRef={dialogRef}
        config={config}
        item={selected}
        mediaOptions={mediaOptions}
        relationOptions={relationOptions}
        readOnly={readOnly}
        onSaved={saved}
      />
    </section>
  );
}

type CmsEditorProps = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  config: CmsModuleConfig;
  item: CmsRecord | null;
  mediaOptions: CmsOption[];
  relationOptions: Record<string, CmsOption[]>;
  readOnly: boolean;
  onSaved: (item: CmsRecord) => void;
};

function CmsEditor({
  dialogRef,
  config,
  item,
  mediaOptions,
  relationOptions,
  readOnly,
  onSaved,
}: CmsEditorProps) {
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    dialogRef.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setBusy(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};

    for (const field of config.fields) {
      values[field.name] =
        field.kind === "checkbox"
          ? formData.get(field.name) === "on"
          : formData.get(field.name);
    }

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value;
    if (intent === "published" && !window.confirm("Publish this content to the public website?")) { setBusy(false); return; }
    if (intent === "archived" && !window.confirm("Archive this content and remove it from normal public visibility?")) { setBusy(false); return; }
    const action = intent === "published" ? "publish" : intent === "archived" ? "archive" : intent === "draft" ? "save_draft" : item ? "update" : "create";

    const response = await fetch(`/api/admin/cms/${config.key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item?.id, values, intent: action, expectedUpdatedAt: item?.updated_at, changeSummary: formData.get("change_summary") }),
    });
    const payload = (await response.json()) as { item?: CmsRecord; message?: string };

    if (!response.ok || !payload.item) {
      setError(payload.message ?? "Content could not be saved. Please try again.");
    } else {
      setDirty(false);
      onSaved(payload.item);
    }
    setBusy(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${config.key}-editor-title`}
      className="m-auto max-h-[calc(100vh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white p-0 text-dark-green shadow-2xl backdrop:bg-dark-green/70"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form onSubmit={submit} onChange={() => setDirty(true)} onInput={(event) => {
        if (config.key !== "menu-categories" || item || !(event.target instanceof HTMLInputElement) || event.target.name !== "name") return;
        const form = event.currentTarget;
        const slug = form.elements.namedItem("slug");
        if (slug instanceof HTMLInputElement && slug.dataset.edited !== "true") slug.value = createSlug(event.target.value);
      }} className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-palem-green uppercase">
              {item ? "Edit" : "Create"}
            </p>
            <h3 id={`${config.key}-editor-title`} className="mt-2 font-serif text-3xl">
              {config.singular[0].toUpperCase() + config.singular.slice(1)}
            </h3>
          </div>
          <button type="button" onClick={close} className="rounded px-3 py-2 text-xl hover:bg-cream" aria-label="Close editor">
            ×
          </button>
        </div>

        <fieldset disabled={readOnly || busy} className="mt-7 grid gap-5 sm:grid-cols-2">
          {config.fields.map((field) => (
            <CmsInput
              key={field.name}
              field={field}
              value={item?.[field.name]}
              mediaOptions={mediaOptions}
              relationOptions={relationOptions}
            />
          ))}
        </fieldset>

        {!readOnly ? <label className="mt-5 block"><span className="mb-2 block text-sm font-semibold">Change summary <span className="font-normal text-dark-green/50">(optional)</span></span><input name="change_summary" maxLength={240} className="min-h-12 w-full rounded-md border border-dark-green/20 px-3" placeholder="Briefly describe this meaningful change" /></label> : null}

        {error ? (
          <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          {item ? <><a href={`/preview/${config.key}/${item.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-full px-5 text-xs font-bold tracking-wide text-palem-green uppercase hover:bg-cream">Preview</a><a href={`/admin/history/${config.key}/${item.id}`} className="inline-flex min-h-12 items-center rounded-full px-5 text-xs font-bold tracking-wide text-palem-green uppercase hover:bg-cream">History</a></> : null}
          <Button type="button" variant="ghost" onClick={close}>Close</Button>
          {!readOnly ? (
            <>
              {config.statuses?.includes("archived") || config.activeField ? (
                <Button type="submit" name="intent" value="archived" variant="secondary" disabled={busy}>
                  Archive
                </Button>
              ) : null}
              {config.statuses?.includes("draft") ? (
                <Button type="submit" name="intent" value="draft" variant="secondary" disabled={busy}>
                  Save draft
                </Button>
              ) : null}
              {config.statuses?.includes("published") ? (
                <Button type="submit" name="intent" value="published" disabled={busy}>
                  Publish
                </Button>
              ) : (
                <Button type="submit" disabled={busy}>Save</Button>
              )}
            </>
          ) : null}
        </div>
      </form>
    </dialog>
  );
}

function CmsInput({
  field,
  value,
  mediaOptions,
  relationOptions,
}: {
  field: CmsField;
  value: unknown;
  mediaOptions: CmsOption[];
  relationOptions: Record<string, CmsOption[]>;
}) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  const options =
    field.kind === "media"
      ? mediaOptions
      : field.kind === "relation"
        ? relationOptions[field.relationKey ?? ""] ?? []
        : field.options?.map((option) => ({ value: option, label: option.replaceAll("_", " ") })) ?? [];

  if (field.kind === "checkbox") {
    return (
      <label className="flex min-h-12 items-center gap-3 rounded-md border border-dark-green/15 px-4">
        <input name={field.name} type="checkbox" defaultChecked={value !== false} className="size-4 accent-palem-green" />
        <span className="text-sm font-semibold">{field.label}</span>
      </label>
    );
  }

  if (field.kind === "textarea") {
    return (
      <label className="sm:col-span-2">
        <FieldLabel field={field} />
        <textarea name={field.name} defaultValue={stringValue} required={field.required} maxLength={field.maxLength} rows={4} className="w-full rounded-md border border-dark-green/20 px-3 py-3" />
      </label>
    );
  }

  if (["select", "media", "relation"].includes(field.kind)) {
    return (
      <label>
        <FieldLabel field={field} />
        <select name={field.name} defaultValue={stringValue} required={field.required} className="min-h-12 w-full rounded-md border border-dark-green/20 bg-white px-3 capitalize">
          <option value="">None selected</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {field.kind === "media" ? (
          <a href="/admin/media" className="mt-2 inline-block text-xs font-semibold text-palem-green underline underline-offset-4">
            Open Media Library
          </a>
        ) : null}
      </label>
    );
  }

  let inputValue = stringValue;
  if (field.kind === "datetime-local" && stringValue) {
    const date = new Date(stringValue);
    if (!Number.isNaN(date.valueOf())) inputValue = date.toISOString().slice(0, 16);
  }

  return (
    <label>
      <FieldLabel field={field} />
      <input
        name={field.name}
        type={field.kind}
        defaultValue={inputValue}
        required={field.required}
        min={field.min}
        step={field.step}
        maxLength={field.maxLength}
        onChange={field.name === "slug" ? (event) => { event.currentTarget.dataset.edited = "true"; } : undefined}
        className="min-h-12 w-full rounded-md border border-dark-green/20 px-3"
      />
    </label>
  );
}

function categoryItemCount(item: CmsRecord) {
  const relation = item.menu_items;
  if (Array.isArray(relation) && relation[0] && typeof relation[0] === "object" && "count" in relation[0]) return String((relation[0] as { count: unknown }).count ?? 0);
  return "0";
}

function createSlug(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160).replace(/-+$/g, "");
}

function FieldLabel({ field }: { field: CmsField }) {
  return (
    <span className="mb-2 block text-sm font-semibold">
      {field.label}{field.required ? " *" : ""}
    </span>
  );
}
