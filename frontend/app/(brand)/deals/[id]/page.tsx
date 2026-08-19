"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import client from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { loadSession } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import type { components } from "@/lib/api-types";

type Deal = components["schemas"]["Deal"];
type Creator = components["schemas"]["Creator"];
type Contract = components["schemas"]["Contract"];
type NegotiationSession = components["schemas"]["NegotiationSession"];
type NegotiationOffer = components["schemas"]["NegotiationOffer"];
type Deliverable = components["schemas"]["Deliverable"];
type Payment = components["schemas"]["Payment"];
type ChecklistState = components["schemas"]["ChecklistState"];

const CHECKLIST_LABELS: [keyof ChecklistState, string][] = [
  ["usage_rights_duration_set", "Usage rights duration"],
  ["exclusivity_scope_set", "Exclusivity scope"],
  ["revision_limit_set", "Revision limit"],
  ["payment_timeline_set", "Payment timeline"],
];

const DEAL_STAGE_LABEL: Record<string, string> = {
  lead: "Lead", negotiating: "Negotiating", contracted: "Contracted",
  in_production: "In production", completed: "Completed", cancelled: "Cancelled",
};

const NEXT_DELIVERABLE_STATUS: Record<string, string> = {
  pending: "in_production", in_production: "editing", editing: "submitted", revision_requested: "editing",
};
const DELIVERABLE_STATUS_LABEL: Record<string, string> = {
  pending: "Not started", in_production: "In progress", editing: "Video editing phase",
  submitted: "Delivered — awaiting approval", approved: "Approved", rejected: "Rejected", revision_requested: "Revision requested",
};

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deal, setDeal] = useState<Deal | null | undefined>(undefined);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [offers, setOffers] = useState<NegotiationOffer[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  function reload() {
    Promise.all([
      client.GET("/deals", { params: { query: { limit: 200 } } }),
      client.GET("/contracts"),
      client.GET("/negotiation/sessions"),
      client.GET("/deliverables"),
      client.GET("/payments", { params: { query: { limit: 200 } } }),
    ]).then(([dealsRes, contractsRes, sessionsRes, deliverablesRes, paymentsRes]) => {
      if (dealsRes.error) { setError(true); return; }
      const foundDeal = (dealsRes.data ?? []).find((d) => d.id === id) ?? null;
      setDeal(foundDeal);
      if (foundDeal) {
        client.GET("/creators/{id}", { params: { path: { id: foundDeal.creator_id } } })
          .then(({ data }) => setCreator(data ?? null));
      }
      setContracts((contractsRes.data ?? []).filter((c) => c.deal_id === id));
      const dealSession = (sessionsRes.data ?? []).find((s) => s.deal_id === id) ?? null;
      setSession(dealSession);
      if (dealSession) {
        client.GET("/negotiation/sessions/{id}/offers", { params: { path: { id: dealSession.id } } })
          .then(({ data }) => setOffers(data ?? []));
      }
      setDeliverables((deliverablesRes.data ?? []).filter((d) => d.deal_id === id));
      const contractIds = new Set((contractsRes.data ?? []).filter((c) => c.deal_id === id).map((c) => c.id));
      setPayments((paymentsRes.data ?? []).filter((p) => contractIds.has(p.contract_id)));
    });
  }

  useEffect(() => { reload(); }, [id]);

  async function uploadContract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/deals/${id}/contracts`,
      { method: "POST", headers: { Authorization: `Bearer ${loadSession()?.access_token ?? ""}` }, body }
    );
    setBusy(false);
    if (res.ok) { formEl.reset(); reload(); }
  }

  async function createSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    await client.POST("/negotiation/sessions", {
      body: {
        deal_id: id,
        views_per_week: Number(form.get("views_per_week")),
        niche_cpm: Number(form.get("niche_cpm")),
        follower_tier_multiplier: Number(form.get("follower_tier_multiplier")),
        engagement_rate_adjustment: Number(form.get("engagement_rate_adjustment")),
      },
    });
    setBusy(false);
    formEl.reset();
    reload();
  }

  async function toggleChecklist(key: keyof ChecklistState) {
    if (!session) return;
    const next = { ...session.checklist, [key]: !session.checklist[key] };
    await client.PATCH("/negotiation/sessions/{id}/checklist", { params: { path: { id: session.id } }, body: next });
    reload();
  }

  async function logOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    await client.POST("/negotiation/sessions/{id}/counter-offer", {
      params: { path: { id: session.id } },
      body: {
        amount: Number(form.get("amount")),
        message: String(form.get("message") || "") || null,
      },
    });
    setBusy(false);
    formEl.reset();
    reload();
  }

  async function createDeliverable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    await client.POST("/deals/{deal_id}/deliverables", {
      params: { path: { deal_id: id } },
      body: { deal_id: id, title: String(form.get("title")), description: String(form.get("description")) },
    });
    setBusy(false);
    formEl.reset();
    reload();
  }

  async function advanceDeliverable(d: Deliverable) {
    const next = NEXT_DELIVERABLE_STATUS[d.status];
    if (!next) return;
    await client.PATCH("/deliverables/{id}/status", {
      params: { path: { id: d.id }, query: { deal_id: id } },
      body: { status: next as "in_production" | "editing" | "submitted" },
    });
    reload();
  }

  async function approveDeliverable(d: Deliverable) {
    await client.PATCH("/deliverables/{id}/status", {
      params: { path: { id: d.id }, query: { deal_id: id } },
      body: { status: "approved" },
    });
    reload();
  }

  async function createInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const contractId = String(form.get("contract_id"));
    setBusy(true);
    await client.POST("/payments", {
      params: { query: { deal_id: id } },
      body: {
        contract_id: contractId,
        amount_inr: Number(form.get("amount_inr")),
        due_date: String(form.get("due_date") || "") || null,
      },
    });
    setBusy(false);
    formEl.reset();
    reload();
  }

  async function markPaid(p: Payment) {
    await client.PATCH("/payments/{contract_id}/mark-paid", {
      params: { path: { contract_id: p.contract_id }, query: { payment_id: p.id, deal_id: id } },
    });
    reload();
  }

  if (error) return <EmptyState icon={ArrowLeft} message="Couldn't load this deal." />;
  if (deal === undefined) return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  if (!deal) return <EmptyState icon={ArrowLeft} message="Deal not found." />;

  const checklistDone = session ? CHECKLIST_LABELS.filter(([key]) => session.checklist[key]).length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Link href="/brand" style={{ fontSize: "12px", color: "var(--color-ink-soft)" }}>← Back to deals</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
          <h1 className="text-h2" style={{ margin: 0 }}>{deal.campaign_name}</h1>
          <StatusPill status={DEAL_STAGE_LABEL[deal.status] ?? deal.status} variant="accent" />
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--color-ink-soft)", marginTop: "4px" }}>
          {creator ? <Link href={`/creators/${creator.id}`} style={{ color: "var(--color-accent)" }}>{creator.display_name}</Link> : "—"}
          {" · "}{deal.contact_email}
        </div>
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Contracts</div>
        {contracts.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)", marginBottom: "10px" }}>No contract uploaded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {contracts.map((c) => (
              <div key={c.id} style={{ fontSize: "12.5px", display: "flex", gap: "10px", alignItems: "center" }}>
                <StatusPill status={c.status.replace(/_/g, " ")} variant={c.status === "pending_review" ? "warning" : c.status === "signed" ? "success" : "neutral"} />
                <Link href={`/contracts/${c.id}/clauses`} style={{ color: "var(--color-accent)" }}>View clauses →</Link>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={uploadContract} style={{ display: "flex", gap: "8px", alignItems: "end" }}>
          <label className="text-label" style={{ flex: 1 }}>Upload contract (PDF)
            <input name="file" type="file" accept="application/pdf" required className="field" />
          </label>
          <button className="btn" disabled={busy} type="submit">Upload</button>
        </form>
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Negotiation</div>
        {!session ? (
          <form onSubmit={createSession} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
            <label className="text-label">Views/week<input name="views_per_week" type="number" required className="field" defaultValue={10000} /></label>
            <label className="text-label">Niche CPM (₹)<input name="niche_cpm" type="number" step="0.01" required className="field" defaultValue={50} /></label>
            <label className="text-label">Tier mult. (₹)<input name="follower_tier_multiplier" type="number" step="0.01" required className="field" defaultValue={0} /></label>
            <label className="text-label">Engagement adj. (₹)<input name="engagement_rate_adjustment" type="number" step="0.01" required className="field" defaultValue={0} /></label>
            <button className="btn" disabled={busy} type="submit">Start negotiation</button>
          </form>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", gap: "16px", fontSize: "12.5px" }}>
              <span>Base rate: <strong>{money(session.base_rate)}</strong></span>
              <span>Range: {money(session.range_low)}–{money(session.range_high)}</span>
            </div>
            <div>
              <div className="lbl" style={{ marginBottom: "6px" }}>Checklist · {checklistDone}/4</div>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12.5px" }}>
                {CHECKLIST_LABELS.map(([key, label]) => (
                  <label key={key} style={{ display: "flex", gap: "5px", alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!session.checklist[key]} onChange={() => toggleChecklist(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="lbl" style={{ marginBottom: "6px" }}>Offer thread</div>
              {offers.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>No offers yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {offers.map((o) => (
                    <div key={o.id} style={{ fontSize: "12.5px", display: "flex", gap: "8px" }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize", minWidth: "56px" }}>{o.sender}</span>
                      <span>{money(o.amount)}</span>
                      {o.message && <span style={{ color: "var(--color-ink-soft)" }}>— {o.message}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={logOffer} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "end" }}>
              <label className="text-label">Your offer (₹)<input name="amount" type="number" step="0.01" required className="field" /></label>
              <label className="text-label">Message<input name="message" className="field" /></label>
              <button className="btn" disabled={busy} type="submit">Send</button>
            </form>
          </div>
        )}
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Deliverables</div>
        {deliverables.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
            {deliverables.map((d) => (
              <div key={d.id} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12.5px" }}>
                <span style={{ flex: 1 }}>{d.title}</span>
                <StatusPill status={DELIVERABLE_STATUS_LABEL[d.status] ?? d.status} variant={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "neutral"} />
                {NEXT_DELIVERABLE_STATUS[d.status] && (
                  <button className="btn btn-ghost" onClick={() => advanceDeliverable(d)}>Advance</button>
                )}
                {d.status === "submitted" && (
                  <button className="btn btn-ghost" onClick={() => approveDeliverable(d)}>Approve</button>
                )}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={createDeliverable} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "end" }}>
          <label className="text-label">Title<input name="title" required className="field" /></label>
          <label className="text-label">Description<input name="description" required className="field" /></label>
          <button className="btn" disabled={busy} type="submit">Add</button>
        </form>
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Payments</div>
        {payments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
            {payments.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "12.5px" }}>
                <span>{p.invoice_number}</span>
                <span>{money(Number(p.amount_inr))}</span>
                <StatusPill status={p.status} variant={p.status === "paid" ? "success" : "warning"} />
                {p.status !== "paid" && <button className="btn btn-ghost" onClick={() => markPaid(p)}>Mark paid</button>}
              </div>
            ))}
          </div>
        )}
        {contracts.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>Upload a contract before creating an invoice.</div>
        ) : (
          <form onSubmit={createInvoice} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
            <label className="text-label">Contract
              <select name="contract_id" required className="field">
                <option value="">Select…</option>
                {contracts.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} — {c.status}</option>)}
              </select>
            </label>
            <label className="text-label">Amount (₹)<input name="amount_inr" type="number" step="0.01" required className="field" /></label>
            <label className="text-label">Due date<input name="due_date" type="date" className="field" /></label>
            <button className="btn" disabled={busy} type="submit">Create invoice</button>
          </form>
        )}
      </div>
    </div>
  );
}
