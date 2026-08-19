"use client";

import React, { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import client from "@/lib/api";
import { StatusPill, StatusVariant } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { loadSession } from "@/lib/auth";
import type { components } from "@/lib/api-types";

type Payment = components["schemas"]["Payment"];
type Contract = components["schemas"]["Contract"];

function variantFor(status: string): StatusVariant {
  switch (status) {
    case "paid": return "success";
    case "overdue": return "danger";
    default: return "warning";
  }
}

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[] | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isBrand, setIsBrand] = useState(false);

  function reload() {
    client.GET("/payments", { params: { query: { limit: 100 } } }).then(({ data, error: apiError }) => {
      if (apiError) { setError(true); return; }
      setItems(data ?? []);
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see AppShell.tsx
    setIsBrand(loadSession()?.role === "brand");
    reload();
    client.GET("/contracts").then(({ data }) => setContracts(data ?? []));
  }, []);

  async function createInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const contractId = String(form.get("contract_id"));
    setBusy(true);
    await client.POST("/payments", {
      params: { query: { deal_id: contracts.find((c) => c.id === contractId)?.deal_id ?? "" } },
      body: {
        contract_id: contractId,
        amount_inr: Number(form.get("amount_inr")),
        due_date: String(form.get("due_date") || "") || null,
      },
    });
    setBusy(false);
    formEl.reset();
    setShowForm(false);
    reload();
  }

  async function changeStatus(p: Payment, status: "pending" | "paid" | "overdue") {
    const contract = contracts.find((c) => c.id === p.contract_id);
    if (!contract) return;
    await client.PATCH("/payments/{contract_id}/status", {
      params: { path: { contract_id: p.contract_id }, query: { payment_id: p.id, deal_id: contract.deal_id ?? "" } },
      body: { status },
    });
    reload();
  }

  if (error) {
    return <EmptyState icon={Receipt} message="Couldn't load invoices. Try signing in again." />;
  }
  if (items === null) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  return (
    <>
      {isBrand && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New invoice"}
        </button>
      </div>
      )}

      {isBrand && showForm && (
        <form onSubmit={createInvoice} className="mtile" style={{ marginBottom: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label className="text-label" style={{ gridColumn: "1 / -1" }}>Contract
            <select name="contract_id" required className="field">
              <option value="">Select contract…</option>
              {contracts.map((c) => <option key={c.id} value={c.id}>{c.id.slice(0, 8)} — {c.status}</option>)}
            </select>
          </label>
          <label className="text-label">Amount (₹)<input name="amount_inr" type="number" step="0.01" required className="field" /></label>
          <label className="text-label">Due date<input name="due_date" type="date" className="field" /></label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" disabled={busy} type="submit">Create invoice</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Receipt} message="No invoices yet. Create one once a contract is signed." />
      ) : (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
        <thead>
          <tr style={{ color: "var(--color-ink-faint)", textAlign: "left" }}>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Invoice #</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Amount</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Due</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}>Status</th>
            <th style={{ fontWeight: 600, padding: "6px 4px", borderBottom: "1px solid var(--color-border)" }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>{p.invoice_number}</td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>₹{Number(p.amount_inr).toLocaleString()}</td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)", color: "var(--color-ink-soft)" }}>
                {p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}
              </td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                <StatusPill status={p.status} variant={variantFor(p.status)} />
              </td>
              <td style={{ padding: "8px 4px", borderBottom: "1px solid var(--color-border)" }}>
                {isBrand && (
                  <select
                    className="field"
                    style={{ marginTop: 0, width: "auto", fontSize: "12px", padding: "5px 8px" }}
                    value={p.status}
                    onChange={(e) => changeStatus(p, e.target.value as "pending" | "paid" | "overdue")}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
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
