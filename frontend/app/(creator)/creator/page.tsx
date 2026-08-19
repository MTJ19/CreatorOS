"use client";

import React, { useEffect, useState } from "react";
import { Handshake, Briefcase } from "lucide-react";
import client from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill, StatusVariant } from "@/components/StatusPill";
import { loadSession } from "@/lib/auth";
import type { components } from "@/lib/api-types";

type Deal = components["schemas"]["Deal"];
type Creator = components["schemas"]["Creator"];
type Brand = components["schemas"]["Brand"];
type NegotiationSession = components["schemas"]["NegotiationSession"];
type NegotiationOffer = components["schemas"]["NegotiationOffer"];
type ForecastPoint = components["schemas"]["ForecastPoint"];
type BenchmarkOut = components["schemas"]["BenchmarkOut"];

const CHECKLIST_LABELS: [keyof NegotiationSession["checklist"], string][] = [
  ["usage_rights_duration_set", "Usage rights duration"],
  ["exclusivity_scope_set", "Exclusivity scope"],
  ["revision_limit_set", "Revision limit"],
  ["payment_timeline_set", "Payment timeline"],
];

const DEAL_STAGE_LABEL: Record<string, string> = {
  lead: "Lead",
  negotiating: "Negotiating",
  contracted: "Contracted",
  in_production: "In production",
  completed: "Completed",
  cancelled: "Cancelled",
};

function dealVariant(status: string): StatusVariant {
  switch (status) {
    case "negotiating": return "warning";
    case "contracted": return "success";
    case "completed": return "success";
    case "cancelled": return "danger";
    default: return "neutral";
  }
}

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function CreatorDashboard() {
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<Creator | null | undefined>(undefined);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [growthRate, setGrowthRate] = useState(5);
  const [offers, setOffers] = useState<NegotiationOffer[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkOut | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [linkedBrands, setLinkedBrands] = useState<Brand[]>([]);
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  function reloadBrands() {
    client.GET("/creators/me/brands").then(({ data }) => setLinkedBrands(data ?? []));
  }

  async function linkBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLinkError("");
    setLinkBusy(true);
    const { error: apiError } = await client.POST("/creators/me/link-brand", {
      body: { invite_code: linkCode.trim() },
    });
    setLinkBusy(false);
    if (apiError) { setLinkError("That invite code didn't match a brand."); return; }
    setLinkCode("");
    reloadBrands();
  }

  function reload() {
    const auth = loadSession();
    if (!auth?.creator_id) return;

    Promise.all([
      client.GET("/creators/{id}", { params: { path: { id: auth.creator_id } } }),
      client.GET("/deals", { params: { query: { limit: 50 } } }),
      client.GET("/negotiation/sessions", { params: { query: { limit: 20 } } }),
    ]).then(([profileRes, dealsRes, sessionsRes]) => {
      if (dealsRes.error) { setError(true); return; }
      const dealList = dealsRes.data ?? [];
      const sessions = sessionsRes.data ?? [];
      const matched = sessions.find((s) => dealList.some((d) => d.id === s.deal_id)) ?? sessions[0] ?? null;
      setProfile(profileRes.data ?? null);
      setDeals(dealList);
      setSession(matched);

      if (matched) {
        client.GET("/negotiation/sessions/{id}/offers", { params: { path: { id: matched.id } } })
          .then(({ data }) => setOffers(data ?? []));
      } else {
        setOffers([]);
      }
    });
  }

  useEffect(() => {
    if (!loadSession()?.creator_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see AppShell.tsx
      setError(true);
      return;
    }
    reload();
    reloadBrands();
  }, []);

  useEffect(() => {
    if (!session) return;
    client.GET("/negotiation/sessions/{id}/forecast", {
      params: { path: { id: session.id }, query: { weeks: 12, weekly_growth_rate: growthRate / 100 } },
    }).then(({ data }) => setForecast(data ?? []));
  }, [session, growthRate]);

  useEffect(() => {
    if (!profile) return;
    client.GET("/benchmarks", { params: { query: { niche: profile.niche, follower_tier: profile.follower_tier } } })
      .then(({ data }) => setBenchmark(data ?? null));
  }, [profile]);

  async function completeProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError("");
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error: apiError } = await client.PATCH("/creators/me", {
      body: {
        followers_count: Number(form.get("followers_count")),
        engagement_rate: Number(form.get("engagement_rate")),
        avg_views_per_week: Number(form.get("avg_views_per_week")),
      },
    });
    setBusy(false);
    if (apiError) { setProfileError("Couldn't save your profile. Try again."); return; }
    reload();
  }

  async function addDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    await client.POST("/deals", {
      body: {
        creator_id: loadSession()?.creator_id ?? "",
        brand_id: String(form.get("brand_id")),
        campaign_name: String(form.get("campaign_name")),
        contact_email: String(form.get("contact_email")),
      },
    });
    setBusy(false);
    formEl.reset();
    setShowDealForm(false);
    reload();
  }

  async function logOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const formEl = e.currentTarget;
    setOfferError("");
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
      setOfferError(
        (apiError as { detail?: string }).detail === "Checklist is not complete"
          ? "Your brand needs to finish the checklist below before you can send your own ask."
          : "Couldn't send."
      );
      return;
    }
    formEl.reset();
    client.GET("/negotiation/sessions/{id}/offers", { params: { path: { id: session.id } } })
      .then(({ data }) => setOffers(data ?? []));
  }

  if (error) {
    return <EmptyState icon={Handshake} message="Couldn't load your dashboard. Try signing in again." />;
  }
  if (profile === undefined) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  if (profile && profile.followers_count == null) {
    return (
      <div style={{ maxWidth: "420px" }}>
        <div className="text-h3" style={{ marginBottom: "6px" }}>A couple of numbers first</div>
        <div style={{ fontSize: "13px", color: "var(--color-ink-soft)", marginBottom: "14px" }}>
          We use these to calculate fair rates and track your growth over time.
        </div>
        <form onSubmit={completeProfile} className="mtile" style={{ display: "grid", gap: "10px" }}>
          <label className="text-label">Followers
            <input name="followers_count" type="number" min={0} required className="field" placeholder="e.g. 42000" />
          </label>
          <label className="text-label">Engagement rate (%)
            <input name="engagement_rate" type="number" min={0} step="0.1" required className="field" placeholder="e.g. 4.5" />
          </label>
          <label className="text-label">Avg. views per week
            <input name="avg_views_per_week" type="number" min={0} required className="field" placeholder="e.g. 21000" />
          </label>
          <button className="btn" disabled={busy} type="submit">Continue</button>
          {profileError && <div style={{ fontSize: "12px", color: "var(--color-danger)" }}>{profileError}</div>}
        </form>
      </div>
    );
  }

  const latestBrandOffer = [...offers].reverse().find((o) => o.sender === "brand");
  const week12 = forecast[forecast.length - 1];
  const checklistDone = session ? CHECKLIST_LABELS.filter(([key]) => session.checklist[key]).length : 0;
  const maxHigh = Math.max(...forecast.map((f) => f.high), session?.range_high ?? 0, 1);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", color: "var(--color-ink-soft)" }}>
          {profile
            ? `${profile.followers_count?.toLocaleString()} followers · ${profile.engagement_rate}% engagement${profile.avg_views_per_week ? ` · ${profile.avg_views_per_week.toLocaleString()} views/week` : ""}`
            : ""}
        </div>
        {linkedBrands.length > 0 && (
          <button className="btn" onClick={() => setShowDealForm((v) => !v)}>
            {showDealForm ? "Cancel" : "+ Add a deal"}
          </button>
        )}
      </div>

      <div className="mtile" style={{ marginBottom: "14px" }}>
        <div className="lbl" style={{ marginBottom: "8px" }}>Linked brands</div>
        {linkedBrands.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)", marginBottom: "10px" }}>
            Not linked to any brand yet. Enter an invite code from a brand to see their deals and contracts.
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {linkedBrands.map((b) => <StatusPill key={b.id} status={b.name} variant="neutral" />)}
          </div>
        )}
        <form onSubmit={linkBrand} style={{ display: "flex", gap: "8px", alignItems: "end" }}>
          <label className="text-label" style={{ flex: 1 }}>Invite code
            <input
              className="field"
              placeholder="Ask your brand contact for this"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value)}
              required
            />
          </label>
          <button className="btn" disabled={linkBusy} type="submit">Link brand</button>
        </form>
        {linkError && <div style={{ fontSize: "12px", color: "var(--color-danger)", marginTop: "6px" }}>{linkError}</div>}
      </div>

      {showDealForm && (
        <form onSubmit={addDeal} className="mtile" style={{ marginBottom: "14px", display: "grid", gap: "10px" }}>
          <label className="text-label">Brand
            <select name="brand_id" required className="field">
              <option value="">Select brand…</option>
              {linkedBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="text-label">Campaign name<input name="campaign_name" required className="field" /></label>
          <label className="text-label">Contact email<input name="contact_email" type="email" required className="field" /></label>
          <button className="btn" disabled={busy} type="submit">Add deal</button>
        </form>
      )}

      <div className="lbl" style={{ marginBottom: "6px" }}>My deals</div>
      {deals.length === 0 ? (
        <EmptyState icon={Briefcase} message="No deals yet. Add one once a brand reaches out." />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", marginBottom: "18px" }}>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{d.campaign_name}</td>
                <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                  <StatusPill status={DEAL_STAGE_LABEL[d.status] ?? d.status} variant={dealVariant(d.status)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!session ? (
        <EmptyState icon={Handshake} message="No active negotiation yet. Your brand will set one up once a deal comes in." />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div className="mtile">
              <div className="lbl">Suggested range</div>
              <div className="val" style={{ fontSize: "17px" }}>{money(session.range_low)}–{money(session.range_high)}</div>
            </div>
            <div className="mtile">
              <div className="lbl">Forecast (12 weeks)</div>
              {forecast.length > 0 ? (
                <svg width="100%" height="30" viewBox="0 0 120 30" style={{ marginTop: "4px" }}>
                  <polyline
                    points={forecast.map((f, i) => `${(i / (forecast.length - 1 || 1)) * 120},${30 - (f.mid / maxHigh) * 28}`).join(" ")}
                    fill="none" stroke="var(--color-accent)" strokeWidth="2"
                  />
                </svg>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>—</div>
              )}
            </div>
          </div>

          <div className="mtile" style={{ marginBottom: "14px" }}>
            <div className="lbl" style={{ marginBottom: "8px" }}>Know your worth</div>
            <label className="text-label" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              Estimated weekly growth
              <input
                type="number" step="0.5" className="field" style={{ maxWidth: "70px", margin: 0 }}
                value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))}
              />
              %
            </label>
            {week12 && (
              <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                At this pace, you&apos;ll be worth about <strong>{money(week12.mid)}</strong> by week 12 (~3 months).
                {latestBrandOffer ? (
                  week12.mid > latestBrandOffer.amount ? (
                    <> The brand&apos;s offer of {money(latestBrandOffer.amount)} is <strong>below</strong> that — you have room to negotiate up.</>
                  ) : (
                    <> That&apos;s still under the brand&apos;s offer of {money(latestBrandOffer.amount)} — their offer already looks fair.</>
                  )
                ) : (
                  <> Log the brand&apos;s offer below to compare it against this.</>
                )}
              </div>
            )}
          </div>

          <div className="mtile" style={{ marginBottom: "14px" }}>
            <div className="lbl" style={{ marginBottom: "8px" }}>Pre-send checklist · {checklistDone}/4</div>
            <div style={{ fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {CHECKLIST_LABELS.map(([key, label]) => (
                <div key={key} style={!session.checklist[key] ? { color: "var(--color-warning)" } : undefined}>
                  {session.checklist[key] ? "✓" : "○"}&nbsp; {label}{!session.checklist[key] ? " — not set" : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="mtile" style={{ marginBottom: "14px" }}>
            <div className="lbl" style={{ marginBottom: "8px" }}>Negotiation thread</div>
            {offers.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--color-ink-faint)", marginBottom: "10px" }}>No messages yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                {offers.map((o) => (
                  <div key={o.id} style={{ fontSize: "12.5px", display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 600, textTransform: "capitalize", minWidth: "50px" }}>
                      {o.sender === "creator" ? "You" : o.sender}
                    </span>
                    <span>{money(o.amount)}</span>
                    {o.message && <span style={{ color: "var(--color-ink-soft)" }}>— {o.message}</span>}
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={logOffer} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "end" }}>
              <label className="text-label">Your ask (₹)<input name="amount" type="number" step="0.01" required className="field" /></label>
              <label className="text-label">Note<input name="message" className="field" placeholder="Optional" /></label>
              <button className="btn" disabled={busy} type="submit">Send</button>
            </form>
            {offerError && <div style={{ fontSize: "11.5px", color: "var(--color-danger)", marginTop: "6px" }}>{offerError}</div>}
          </div>
        </>
      )}

      {profile && (
        <div className="mtile">
          <div className="lbl" style={{ marginBottom: "10px" }}>
            {profile.niche} · {profile.follower_tier} followers
          </div>
          {!benchmark || benchmark.insufficient_data ? (
            <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>Not enough data yet for your niche and tier.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "18px", height: "54px" }}>
              {([["p25", benchmark.p25_rate], ["p50", benchmark.p50_rate], ["p75", benchmark.p75_rate]] as const).map(([label, val], i) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{
                    width: "30px", height: `${20 + i * 17}px`,
                    background: i === 2 ? "var(--color-ink)" : i === 1 ? "var(--color-accent)" : "var(--color-accent-dim)",
                    borderRadius: "4px 4px 0 0",
                  }} />
                  <div style={{ fontSize: "10.5px", color: "var(--color-ink-faint)", marginTop: "4px" }}>{label} {money(val ?? 0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
