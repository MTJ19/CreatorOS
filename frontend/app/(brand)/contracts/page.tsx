"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import client from "@/lib/api";
import { StatusPill, StatusVariant } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { loadSession } from "@/lib/auth";
import type { components } from "@/lib/api-types";

type Contract = components["schemas"]["Contract"];
type Deal = components["schemas"]["Deal"];
type Creator = components["schemas"]["Creator"];

function variantFor(status: string): StatusVariant {
  switch (status) {
    case "signed": return "success";
    case "pending_review": return "warning";
    case "void": return "danger";
    default: return "neutral";
  }
}

export default function ContractsPage() {
  const [items, setItems] = useState<Contract[] | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [newDeal, setNewDeal] = useState(false);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [isBrand, setIsBrand] = useState(false);

  function reload() {
    client.GET("/contracts").then(({ data, error: apiError }) => {
      if (apiError) { setError(true); return; }
      setItems(data ?? []);
    });
  }

  useEffect(() => {
    const brand = loadSession()?.role === "brand";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see AppShell.tsx
    setIsBrand(brand);
    reload();
    client.GET("/deals", { params: { query: { limit: 100 } } }).then(({ data }) => setDeals(data ?? []));
    if (brand) {
      client.GET("/creators", { params: { query: { limit: 100 } } }).then(({ data }) => setCreators(data ?? []));
    }
  }, []);

  async function uploadPersonalContract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setFormError("");
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/creators/me/contracts`,
      { method: "POST", headers: { Authorization: `Bearer ${loadSession()?.access_token ?? ""}` }, body }
    );
    setBusy(false);
    if (!res.ok) { setFormError("Couldn't upload contract."); return; }
    formEl.reset();
    setShowPersonalForm(false);
    reload();
  }

  async function acceptContract(c: Contract) {
    const deal = deals.find((d) => d.id === c.deal_id);
    if (!deal) return;
    setAcceptError("");
    if (c.status === "draft") {
      const { error } = await client.PATCH("/contracts/{id}/status", { params: { path: { id: c.id } }, body: { status: "uploaded" } });
      if (error) { setAcceptError("Couldn't accept — it may have an open review flag that needs resolving first."); return; }
    }
    const { error: signError } = await client.PATCH("/contracts/{id}/status", { params: { path: { id: c.id } }, body: { status: "signed" } });
    if (signError) { setAcceptError("Couldn't accept — it may have an open review flag that needs resolving first."); return; }
    await client.PATCH("/deals/{id}/status", { params: { path: { id: deal.id } }, body: { status: "in_production" } });
    reload();
  }

  function creatorNameFor(c: Contract): string {
    const deal = deals.find((d) => d.id === c.deal_id);
    if (!deal) return "—";
    return creators.find((cr) => cr.id === deal.creator_id)?.display_name ?? "—";
  }

  async function uploadContract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setFormError("");
    const form = new FormData(formEl);
    let dealId = String(form.get("deal_id"));
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if ((!dealId && !newDeal) || !file) return;

    setBusy(true);

    if (newDeal) {
      const { data: created, error: dealError } = await client.POST("/deals", {
        body: {
          creator_id: String(form.get("new_creator_id")),
          campaign_name: String(form.get("new_campaign_name")),
          contact_email: String(form.get("new_contact_email")),
        },
      });
      if (dealError || !created) {
        setBusy(false);
        setFormError("Couldn't create the new deal.");
        return;
      }
      dealId = created.id;
    }

    const body = new FormData();
    body.append("file", file);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/deals/${dealId}/contracts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${loadSession()?.access_token ?? ""}` },
        body,
      }
    );
    setBusy(false);
    if (!res.ok) { setFormError("Couldn't upload contract."); return; }
    formEl.reset();
    setShowForm(false);
    setNewDeal(false);
    reload();
  }

  if (error) {
    return <EmptyState icon={FileText} message="Couldn't load contracts. Try signing in again." />;
  }
  if (items === null) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px", gap: "8px" }}>
        {!isBrand && (
          <button className="btn" onClick={() => setShowPersonalForm((v) => !v)}>
            {showPersonalForm ? "Cancel" : "+ Upload for review"}
          </button>
        )}
        {isBrand && (
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Upload contract"}
          </button>
        )}
      </div>

      {showPersonalForm && (
        <form onSubmit={uploadPersonalContract} className="mtile" style={{ marginBottom: "14px", display: "flex", gap: "8px", alignItems: "end" }}>
          <label className="text-label" style={{ flex: 1 }}>Contract file (PDF) — not linked to any brand
            <input name="file" type="file" accept="application/pdf" required className="field" />
          </label>
          <button className="btn" disabled={busy} type="submit">{busy ? "Uploading…" : "Upload"}</button>
        </form>
      )}

      {showForm && isBrand && (
        <form onSubmit={uploadContract} className="mtile" style={{ marginBottom: "14px", display: "grid", gap: "10px" }}>
          <label className="text-label">Deal
            <select
              name="deal_id"
              required={!newDeal}
              className="field"
              onChange={(e) => setNewDeal(e.target.value === "__new__")}
            >
              <option value="">Select deal…</option>
              <option value="__new__">+ Name a new deal…</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.campaign_name}</option>)}
            </select>
          </label>
          {newDeal && (
            <div style={{ display: "grid", gap: "8px" }}>
              <label className="text-label">Creator
                <select name="new_creator_id" required className="field">
                  <option value="">Select creator…</option>
                  {creators.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                </select>
              </label>
              <label className="text-label">Campaign name<input name="new_campaign_name" required className="field" /></label>
              <label className="text-label">Contact email<input name="new_contact_email" type="email" required className="field" /></label>
            </div>
          )}
          <label className="text-label">Contract file (PDF)
            <input name="file" type="file" accept="application/pdf" required className="field" />
          </label>
          <div style={{ fontSize: "11.5px", color: "var(--color-ink-faint)" }}>
            Scanned automatically for red-flag clauses after upload.
          </div>
          <div>
            <button className="btn" disabled={busy} type="submit">{busy ? "Uploading…" : "Upload"}</button>
          </div>
        </form>
      )}

      {formError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginBottom: "10px" }}>{formError}</div>}
      {acceptError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginBottom: "10px" }}>{acceptError}</div>}

      {items.length === 0 ? (
        <EmptyState icon={FileText} message="No contracts yet. Upload one once terms are agreed." />
      ) : isBrand ? (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
      <thead>
        <tr style={{ color: "var(--color-ink-faint)", textAlign: "left" }}>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Creator</th>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Contract</th>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Reviewed</th>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}></th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.id}>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{creatorNameFor(c)}</td>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
              <Link href={`/contracts/${c.id}/clauses`} style={{ color: "var(--color-accent)" }}>View clauses →</Link>
            </td>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
              <StatusPill status={c.raw_text ? "Reviewed" : "Not yet"} variant={c.raw_text ? "success" : "neutral"} />
            </td>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
              {c.status === "signed" ? (
                <StatusPill status="Accepted" variant="success" />
              ) : (
                <button className="btn btn-ghost" onClick={() => acceptContract(c)}>Accept</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      ) : (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
      <thead>
        <tr style={{ color: "var(--color-ink-faint)", textAlign: "left" }}>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Status</th>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Uploaded</th>
          <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}></th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.id}>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
              <StatusPill status={c.status.replace(/_/g, " ")} variant={variantFor(c.status)} />
            </td>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)", color: "var(--color-ink-soft)" }}>
              {new Date(c.created_at).toLocaleDateString()}
            </td>
            <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
              <Link href={`/contracts/${c.id}/clauses`} style={{ color: "var(--color-accent)" }}>View clauses →</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      )}
    </>
  );
}
