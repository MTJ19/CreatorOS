"use client";

import React, { useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import client from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import type { components } from "@/lib/api-types";

type NegotiationSession = components["schemas"]["NegotiationSession"];
type NegotiationOffer = components["schemas"]["NegotiationOffer"];
type Deal = components["schemas"]["Deal"];
type Creator = components["schemas"]["Creator"];
type ChecklistState = components["schemas"]["ChecklistState"];

const CHECKLIST_LABELS: [keyof ChecklistState, string][] = [
  ["usage_rights_duration_set", "Usage rights duration"],
  ["exclusivity_scope_set", "Exclusivity scope"],
  ["revision_limit_set", "Revision limit"],
  ["payment_timeline_set", "Payment timeline"],
];

function checklistDone(c: ChecklistState): number {
  return CHECKLIST_LABELS.filter(([key]) => c[key]).length;
}

export default function NegotiatePage() {
  const [items, setItems] = useState<NegotiationSession[] | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [newDeal, setNewDeal] = useState(false);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  function reload() {
    client.GET("/negotiation/sessions").then(({ data, error: apiError }) => {
      if (apiError) { setError(true); return; }
      setItems(data ?? []);
    });
  }

  useEffect(() => {
    reload();
    client.GET("/deals", { params: { query: { limit: 100 } } }).then(({ data }) => setDeals(data ?? []));
    client.GET("/creators", { params: { query: { limit: 100 } } }).then(({ data }) => setCreators(data ?? []));
  }, []);

  async function createSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    let dealId = String(form.get("deal_id"));
    if (!dealId && !newDeal) return;
    setBusy(true);

    if (newDeal) {
      const { data: created, error: dealError } = await client.POST("/deals", {
        body: {
          creator_id: String(form.get("new_creator_id")),
          campaign_name: String(form.get("new_campaign_name")),
          contact_email: String(form.get("new_contact_email")),
        },
      });
      if (dealError || !created) { setBusy(false); return; }
      dealId = created.id;
      setDeals((prev) => [...prev, created]);
    }

    await client.POST("/negotiation/sessions", {
      body: {
        deal_id: dealId,
        views_per_week: Number(form.get("views_per_week")),
        niche_cpm: Number(form.get("niche_cpm")),
        follower_tier_multiplier: Number(form.get("follower_tier_multiplier")),
        engagement_rate_adjustment: Number(form.get("engagement_rate_adjustment")),
      },
    });
    setBusy(false);
    formEl.reset();
    setShowForm(false);
    setNewDeal(false);
    reload();
  }

  if (error) {
    return <EmptyState icon={Handshake} message="Couldn't load negotiations. Try signing in again." />;
  }
  if (items === null) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  const dealName = (id: string) => deals.find((d) => d.id === id)?.campaign_name ?? "—";
  const dealCreatedAt = (id: string) => deals.find((d) => d.id === id)?.created_at;

  function formatCreated(iso: string | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New negotiation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSession} className="mtile" style={{ marginBottom: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label className="text-label" style={{ gridColumn: "1 / -1" }}>Deal
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
            <>
              <label className="text-label">Creator
                <select name="new_creator_id" required className="field">
                  <option value="">Select creator…</option>
                  {creators.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
                </select>
              </label>
              <label className="text-label">Campaign name<input name="new_campaign_name" required className="field" /></label>
              <label className="text-label" style={{ gridColumn: "1 / -1" }}>Contact email<input name="new_contact_email" type="email" required className="field" /></label>
            </>
          )}
          <label className="text-label">Views / week<input name="views_per_week" type="number" required className="field" defaultValue={10000} /></label>
          <label className="text-label">Niche CPM (₹)<input name="niche_cpm" type="number" step="0.01" required className="field" defaultValue={50} /></label>
          <label className="text-label">Tier multiplier (₹)<input name="follower_tier_multiplier" type="number" step="0.01" required className="field" defaultValue={0} /></label>
          <label className="text-label">Engagement adjustment (₹)<input name="engagement_rate_adjustment" type="number" step="0.01" required className="field" defaultValue={0} /></label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" disabled={busy} type="submit">Create</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Handshake} message="No negotiations yet. They start once a deal's rate is calculated." />
      ) : (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
        <thead>
          <tr style={{ color: "var(--color-ink-faint)", textAlign: "left" }}>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Deal</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Created</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Base rate</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Range</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Checklist</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <React.Fragment key={s.id}>
              <tr onClick={() => setOpenId(openId === s.id ? null : s.id)} style={{ cursor: "pointer" }}>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{dealName(s.deal_id)}</td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)", color: "var(--color-ink-soft)" }}>{formatCreated(dealCreatedAt(s.deal_id))}</td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>₹{s.base_rate.toLocaleString()}</td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)", color: "var(--color-ink-soft)" }}>
                  ₹{s.range_low.toLocaleString()}–{s.range_high.toLocaleString()}
                </td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{checklistDone(s.checklist)}/4</td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                  <StatusPill status={s.status} variant={s.status === "active" ? "accent" : "neutral"} />
                </td>
              </tr>
              {openId === s.id && (
                <tr>
                  <td colSpan={6} style={{ padding: "0 4px 14px" }}>
                    <SessionDetail session={s} onChanged={reload} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      )}
    </>
  );
}

function SessionDetail({ session, onChanged }: { session: NegotiationSession; onChanged: () => void }) {
  const [offers, setOffers] = useState<NegotiationOffer[] | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>(session.checklist);
  const [busy, setBusy] = useState(false);
  const [replyError, setReplyError] = useState("");

  function reloadOffers() {
    client.GET("/negotiation/sessions/{id}/offers", { params: { path: { id: session.id } } })
      .then(({ data }) => setOffers(data ?? []));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when switching sessions, not on every reloadOffers identity change
  useEffect(() => { reloadOffers(); }, [session.id]);

  async function toggleChecklist(key: keyof ChecklistState) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    await client.PATCH("/negotiation/sessions/{id}/checklist", {
      params: { path: { id: session.id } },
      body: next,
    });
    onChanged();
  }

  async function logReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setReplyError("");
    const form = new FormData(formEl);
    setBusy(true);
    const { error: apiError } = await client.POST("/negotiation/sessions/{id}/counter-offer", {
      params: { path: { id: session.id } },
      body: {
        amount: Number(form.get("amount")),
        message: String(form.get("message") || "") || null,
      },
    });
    setBusy(false);
    if (apiError) {
      setReplyError(
        (apiError as { detail?: string }).detail === "Checklist is not complete"
          ? "Finish the checklist above before sending your own ask."
          : "Couldn't send."
      );
      return;
    }
    formEl.reset();
    reloadOffers();
  }

  return (
    <div className="mtile" style={{ display: "grid", gap: "12px" }}>
      <div>
        <div className="lbl" style={{ marginBottom: "6px" }}>Pre-send checklist</div>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12.5px" }}>
          {CHECKLIST_LABELS.map(([key, label]) => (
            <label key={key} style={{ display: "flex", gap: "5px", alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={!!checklist[key]} onChange={() => toggleChecklist(key)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="lbl" style={{ marginBottom: "6px" }}>Offer thread</div>
        {offers === null ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>Loading…</div>
        ) : offers.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>No offers yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {offers.map((o) => (
              <div key={o.id} style={{ fontSize: "12.5px", display: "flex", gap: "8px", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, textTransform: "capitalize", minWidth: "56px" }}>{o.sender}</span>
                <span>₹{o.amount.toLocaleString()}</span>
                {o.message && <span style={{ color: "var(--color-ink-soft)" }}>— {o.message}</span>}
                <span style={{ color: "var(--color-ink-faint)", fontSize: "11px" }}>{new Date(o.sent_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={logReply} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "end" }}>
        <label className="text-label">Your offer (₹)<input name="amount" type="number" step="0.01" required className="field" /></label>
        <label className="text-label">Message<input name="message" className="field" placeholder="Optional note…" /></label>
        <button className="btn" disabled={busy} type="submit">Send</button>
      </form>
      {replyError && <div style={{ fontSize: "12px", color: "var(--color-danger)" }}>{replyError}</div>}
    </div>
  );
}
