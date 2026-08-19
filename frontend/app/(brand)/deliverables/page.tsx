"use client";

import React, { useEffect, useState } from "react";
import { PackageOpen } from "lucide-react";
import client from "@/lib/api";
import { StatusPill, StatusVariant } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { loadSession } from "@/lib/auth";
import type { components } from "@/lib/api-types";

type Deliverable = components["schemas"]["Deliverable"];
type Deal = components["schemas"]["Deal"];

const NEXT_STATUS: Record<string, string> = {
  pending: "in_production",
  in_production: "editing",
  editing: "submitted",
  revision_requested: "editing",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Not started",
  in_production: "In progress",
  editing: "Video editing phase",
  submitted: "Delivered — awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested",
};

function variantFor(status: string): StatusVariant {
  switch (status) {
    case "approved": return "success";
    case "rejected": return "danger";
    case "revision_requested": return "warning";
    case "submitted": return "accent";
    default: return "neutral";
  }
}

export default function DeliverablesPage() {
  const [items, setItems] = useState<Deliverable[] | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isBrand, setIsBrand] = useState(false);

  function reload() {
    client.GET("/deliverables").then(({ data, error: apiError }) => {
      if (apiError) { setError(true); return; }
      setItems(data ?? []);
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see AppShell.tsx
    setIsBrand(loadSession()?.role === "brand");
    reload();
    client.GET("/deals", { params: { query: { limit: 100 } } }).then(({ data }) => setDeals(data ?? []));
  }, []);

  async function createDeliverable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const dealId = String(form.get("deal_id"));
    setBusy(true);
    await client.POST("/deals/{deal_id}/deliverables", {
      params: { path: { deal_id: dealId } },
      body: {
        deal_id: dealId,
        title: String(form.get("title")),
        description: String(form.get("description")),
      },
    });
    setBusy(false);
    formEl.reset();
    setShowForm(false);
    reload();
  }

  async function advance(d: Deliverable) {
    const next = NEXT_STATUS[d.status];
    if (!next) return;
    await client.PATCH("/deliverables/{id}/status", {
      params: { path: { id: d.id }, query: { deal_id: d.deal_id } },
      body: { status: next as "in_production" | "editing" | "submitted" },
    });
    reload();
  }

  if (error) {
    return <EmptyState icon={PackageOpen} message="Couldn't load deliverables. Try signing in again." />;
  }
  if (items === null) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  return (
    <>
      {isBrand && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New deliverable"}
        </button>
      </div>
      )}

      {isBrand && showForm && (
        <form onSubmit={createDeliverable} className="mtile" style={{ marginBottom: "14px", display: "grid", gap: "10px" }}>
          <label className="text-label">Deal
            <select name="deal_id" required className="field">
              <option value="">Select deal…</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.campaign_name}</option>)}
            </select>
          </label>
          <label className="text-label">Title<input name="title" required className="field" /></label>
          <label className="text-label">Description<input name="description" required className="field" /></label>
          <div>
            <button className="btn" disabled={busy} type="submit">Create</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState icon={PackageOpen} message="No deliverables yet. They'll show up here once a deal has content in flight." />
      ) : (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
        <thead>
          <tr style={{ color: "var(--color-ink-faint)", textAlign: "left" }}>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Title</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Description</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Status</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{d.title}</td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)", color: "var(--color-ink-soft)" }}>{d.description}</td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                <StatusPill status={STATUS_LABEL[d.status] ?? d.status} variant={variantFor(d.status)} />
              </td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                {isBrand && NEXT_STATUS[d.status] && (
                  <button className="btn btn-ghost" onClick={() => advance(d)}>
                    Mark as {STATUS_LABEL[NEXT_STATUS[d.status]]}
                  </button>
                )}
                {isBrand && d.status === "submitted" && (
                  <button className="btn btn-ghost" onClick={async () => {
                    await client.PATCH("/deliverables/{id}/status", {
                      params: { path: { id: d.id }, query: { deal_id: d.deal_id } },
                      body: { status: "approved" },
                    });
                    reload();
                  }}>Approve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </>
  );
}
