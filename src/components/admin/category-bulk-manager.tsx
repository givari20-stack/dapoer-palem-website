"use client";

import { useState } from "react";

import type { CmsRecord } from "@/components/admin/cms-manager";
import { Button } from "@/components/ui/button";

type Props = {
  selectedIds: Set<string>;
  onItemsChanged: (items: CmsRecord[]) => void;
  onSelectionChanged: (ids: Set<string>) => void;
};

export function CategoryBulkManager({ selectedIds, onItemsChanged, onSelectionChanged }: Props) {
  const [displayOrder, setDisplayOrder] = useState("0");
  const [notice, setNotice] = useState<string | null>(null);
  const selectedCount = selectedIds.size;

  async function apply(intent: "archive" | "restore" | "reorder") {
    if (!selectedCount) return;
    const order = Number(displayOrder);
    if (intent === "reorder" && (!Number.isInteger(order) || order < 0)) {
      setNotice("Display order must be a non-negative integer.");
      return;
    }
    const label = intent === "archive" ? "archive" : intent === "restore" ? "restore as draft" : `set display order to ${order} for`;
    if (!window.confirm(`Confirm ${label} ${selectedCount} selected categories?`)) return;
    const response = await fetch("/api/admin/menu/categories/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds], intent, displayOrder: order }),
    });
    const payload = await response.json() as { message?: string; result?: { updated: number; items: CmsRecord[] } };
    if (!response.ok || !payload.result) {
      setNotice(payload.message ?? "Category bulk action failed.");
      return;
    }
    onItemsChanged(payload.result.items);
    onSelectionChanged(new Set());
    setNotice(`${payload.result.updated} categories updated.`);
  }

  return (
    <div className="mt-6 rounded-lg border border-gold/30 bg-cream/45 p-4 sm:p-5">
      <p className="text-sm leading-6 text-dark-green/65">Categories with menu items are never hard-deleted. Archive them to preserve every item relationship.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">{selectedCount} selected</span>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => void apply("archive")}>Archive</Button>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => void apply("restore")}>Restore</Button>
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
          Display order
          <input type="number" min="0" step="1" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} className="min-h-11 w-24 rounded border border-dark-green/20 bg-white px-3" />
        </label>
        <Button type="button" variant="secondary" disabled={!selectedCount} onClick={() => void apply("reorder")}>Apply order</Button>
      </div>
      {notice ? <p role="status" className="mt-4 rounded-md bg-white px-4 py-3 text-sm">{notice}</p> : null}
    </div>
  );
}
