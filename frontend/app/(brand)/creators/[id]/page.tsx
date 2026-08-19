"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Users2 } from "lucide-react";
import client from "@/lib/api";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import type { components } from "@/lib/api-types";

type Creator = components["schemas"]["Creator"];
type Deal = components["schemas"]["Deal"];
type Payment = components["schemas"]["Payment"];

const DEAL_STAGE_LABEL: Record<string, string> = {
  lead: "Lead", negotiating: "Negotiating", contracted: "Contracted",
  in_production: "In production", completed: "Completed", cancelled: "Cancelled",
};

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [creator, setCreator] = useState<Creator | null | undefined>(undefined);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      client.GET("/creators/{id}", { params: { path: { id } } }),
      client.GET("/deals", { params: { query: { limit: 200 } } }),
      client.GET("/contracts"),
      client.GET("/payments", { params: { query: { limit: 200 } } }),
    ]).then(([creatorRes, dealsRes, contractsRes, paymentsRes]) => {
      if (creatorRes.error || dealsRes.error) { setError(true); return; }
      setCreator(creatorRes.data ?? null);
      const myDeals = (dealsRes.data ?? []).filter((d) => d.creator_id === id);
      setDeals(myDeals);
      const myDealIds = new Set(myDeals.map((d) => d.id));
      const myContractIds = new Set((contractsRes.data ?? []).filter((c) => myDealIds.has(c.deal_id ?? "")).map((c) => c.id));
      setPayments((paymentsRes.data ?? []).filter((p) => myContractIds.has(p.contract_id)));
    });
  }, [id]);

  if (error) return <EmptyState icon={Users2} message="Couldn't load this creator." />;
  if (creator === undefined) return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  if (!creator) return <EmptyState icon={Users2} message="Creator not found." />;

  const active = deals.filter((d) => !["completed", "cancelled"].includes(d.status)).length;
  const completed = deals.filter((d) => d.status === "completed").length;
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount_inr), 0);
  const totalPending = payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + Number(p.amount_inr), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Link href="/brand" style={{ fontSize: "12px", color: "var(--color-ink-soft)" }}>← Back to deals</Link>
        <h1 className="text-h2" style={{ margin: "6px 0 2px" }}>{creator.display_name}</h1>
        <div style={{ fontSize: "12.5px", color: "var(--color-ink-soft)" }}>
          {creator.instagram_handle} · {creator.niche} · {creator.follower_tier}
          {creator.followers_count != null && <> · {creator.followers_count.toLocaleString()} followers</>}
          {creator.engagement_rate != null && <> · {creator.engagement_rate}% engagement</>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        <div className="mtile"><div className="lbl">Deals</div><div className="val">{deals.length}</div></div>
        <div className="mtile"><div className="lbl">Active</div><div className="val">{active}</div></div>
        <div className="mtile"><div className="lbl">Completed</div><div className="val">{completed}</div></div>
        <div className="mtile"><div className="lbl">Paid to date</div><div className="val" style={{ fontSize: "16px" }}>{money(totalPaid)}</div></div>
        <div className="mtile"><div className="lbl">Outstanding</div><div className="val" style={{ fontSize: "16px" }}>{money(totalPending)}</div></div>
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Deals</div>
        {deals.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>No deals yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>{d.campaign_name}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>
                    <StatusPill status={DEAL_STAGE_LABEL[d.status] ?? d.status} variant="accent" />
                  </td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>
                    <Link href={`/deals/${d.id}`} style={{ color: "var(--color-accent)" }}>Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mtile">
        <div className="lbl" style={{ marginBottom: "8px" }}>Payment history</div>
        {payments.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>No invoices yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>{p.invoice_number}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>{money(Number(p.amount_inr))}</td>
                  <td style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>
                    <StatusPill status={p.status} variant={p.status === "paid" ? "success" : "warning"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
