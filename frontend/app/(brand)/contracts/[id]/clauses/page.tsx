"use client";

import React, { useEffect, useState, use } from "react";
import { ShieldCheck } from "lucide-react";
import client from "@/lib/api";
import { ClauseCard } from "@/components/ClauseCard";
import { EmptyState } from "@/components/EmptyState";
import type { components } from "@/lib/api-types";

type Contract = components["schemas"]["Contract"];
type ClauseCardOut = components["schemas"]["ClauseCardOut"];

interface Highlight {
  start: number;
  end: number;
  flag: "red" | "yellow";
  reason: string | null;
}

function findHighlights(fullText: string, clauses: ClauseCardOut[]): Highlight[] {
  const ranges: Highlight[] = [];
  for (const c of clauses) {
    if (c.flag === "green") continue;
    const trimmed = c.raw_text.trim();
    if (!trimmed) continue;
    // Match whitespace-insensitively against the exact full text so extraction
    // formatting differences (line wraps, extra spaces) don't break the match.
    const pattern = trimmed
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    try {
      const match = fullText.match(new RegExp(pattern));
      if (match && match.index !== undefined) {
        ranges.push({ start: match.index, end: match.index + match[0].length, flag: c.flag, reason: c.flag_reason_code ?? null });
      }
    } catch {
      // Malformed pattern (shouldn't happen with the escaping above) — skip.
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: Highlight[] = [];
  for (const r of ranges) {
    if (merged.length && r.start < merged[merged.length - 1].end) continue;
    merged.push(r);
  }
  return merged;
}

function HighlightedText({ fullText, clauses }: { fullText: string; clauses: ClauseCardOut[] }) {
  const highlights = findHighlights(fullText, clauses);
  if (highlights.length === 0) {
    return <>{fullText}</>;
  }
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  highlights.forEach((h, i) => {
    if (h.start > cursor) nodes.push(<span key={`t${i}`}>{fullText.slice(cursor, h.start)}</span>);
    nodes.push(
      <mark
        key={`h${i}`}
        title={h.reason ?? undefined}
        style={{
          background: h.flag === "red" ? "var(--color-danger-soft)" : "var(--color-warning-soft)",
          color: h.flag === "red" ? "var(--color-danger)" : "var(--color-warning)",
          padding: "1px 2px",
          borderRadius: "3px",
        }}
      >
        {fullText.slice(h.start, h.end)}
      </mark>
    );
    cursor = h.end;
  });
  if (cursor < fullText.length) nodes.push(<span key="tail">{fullText.slice(cursor)}</span>);
  return <>{nodes}</>;
}

export default function ClausesReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null | undefined>(undefined);
  const [clauses, setClauses] = useState<ClauseCardOut[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      client.GET("/contracts/{id}", { params: { path: { id } } }),
      client.GET("/contracts/{contract_id}/clauses", { params: { path: { contract_id: id } } }),
    ]).then(([contractRes, clausesRes]) => {
      if (contractRes.error || clausesRes.error) { setError(true); return; }
      setContract(contractRes.data ?? null);
      setClauses(clausesRes.data ?? []);
    });
  }, [id]);

  if (error) {
    return <EmptyState icon={ShieldCheck} message="Couldn't load this contract. Try signing in again." />;
  }
  if (contract === undefined) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "14px" }}>
      <div className="mtile" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="lbl">Full contract text</div>
        {contract?.raw_text ? (
          <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: "70vh", overflowY: "auto" }}>
            <HighlightedText fullText={contract.raw_text} clauses={clauses} />
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>
            Full text isn&apos;t available for this contract (either it hasn&apos;t been scanned yet, or no text could
            be extracted from the PDF).
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="lbl">Flagged clauses</div>
          {clauses.length === 0 ? (
            <EmptyState icon={ShieldCheck} message="No clauses have been scanned for this contract yet." />
          ) : (
            clauses.map((clause) => (
              <ClauseCard
                key={clause.id}
                clauseText={clause.raw_text}
                flagColor={clause.flag}
                flagReason={clause.flag_reason_code}
                llmExplanation={clause.llm_explanation}
              />
            ))
          )}
        </div>
        <div className="mtile">
          <div className="lbl" style={{ marginBottom: "8px" }}>Escalation queue</div>
          <p style={{ fontSize: "12px", color: "var(--color-ink-faint)" }}>
            Per-contract escalation listing isn&apos;t exposed by the API yet &mdash;
            only creating and resolving a single escalation are.
          </p>
        </div>
      </div>
    </div>
  );
}
