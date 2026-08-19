"use client";

import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import client from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import type { components } from "@/lib/api-types";

type ActivityLog = components["schemas"]["ActivityLog"];

function actionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityLog[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    client.GET("/activity-log").then(({ data, error: apiError }) => {
      if (apiError) { setError(true); return; }
      setItems(data ?? []);
    });
  }, []);

  if (error) {
    return <EmptyState icon={Activity} message="Couldn't load activity. Try signing in again." />;
  }
  if (items === null) {
    return <div style={{ fontSize: "13px", color: "var(--color-ink-faint)" }}>Loading…</div>;
  }
  if (items.length === 0) {
    return <EmptyState icon={Activity} message="No activity yet. Every action across your deals will be logged here." />;
  }

  const sorted = [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {sorted.map((log) => (
        <div
          key={log.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 4px",
            borderBottom: "1px solid var(--color-border)",
            fontSize: "12.5px",
          }}
        >
          <div>
            <span style={{ textTransform: "capitalize" }}>{log.actor_type}</span>
            <span style={{ color: "var(--color-ink-faint)" }}> · </span>
            <span>{actionLabel(log.action)}</span>
          </div>
          <div style={{ color: "var(--color-ink-faint)" }}>
            {new Date(log.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
