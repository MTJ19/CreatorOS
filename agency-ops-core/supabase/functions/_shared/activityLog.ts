// Shared activity log writer.
// Every module (yours, negotiation, and eventually payments/analytics) should
// call this instead of inserting into activity_log directly, so the
// visible_to rules stay consistent in one place.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ActorRole = "agency" | "creator" | "brand" | "system";
export type EntityType = "creator" | "deal" | "contract" | "deliverable" | "payment";

interface LogEntryInput {
  entityType: EntityType;
  entityId: string;
  agencyId: string;
  actorRole: ActorRole;
  actorId?: string | null;
  action: string;          // e.g. 'contract.drafted', 'deliverable.approved'
  metadata?: Record<string, unknown>;
  visibleTo?: ("agency" | "creator" | "brand")[];
}

// Default visibility per action prefix — override with visibleTo when a
// specific event should be narrower (e.g. internal compliance notes).
const DEFAULT_VISIBILITY: Record<string, ("agency" | "creator" | "brand")[]> = {
  creator: ["agency", "creator"],
  deal: ["agency", "creator"],
  contract: ["agency", "creator", "brand"],
  deliverable: ["agency", "creator", "brand"],
  payment: ["agency", "creator"],
};

export async function logActivity(
  supabase: SupabaseClient,
  entry: LogEntryInput
): Promise<{ error: string | null }> {
  const visibleTo = entry.visibleTo ?? DEFAULT_VISIBILITY[entry.entityType] ?? ["agency"];

  const { error } = await supabase.from("activity_log").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    agency_id: entry.agencyId,
    actor_role: entry.actorRole,
    actor_id: entry.actorId ?? null,
    action: entry.action,
    metadata: entry.metadata ?? {},
    visible_to: visibleTo,
  });

  if (error) {
    // Activity log failures should never block the primary operation from
    // returning to the caller, but they must be visible in server logs.
    console.error("activity_log insert failed:", error.message, entry);
    return { error: error.message };
  }
  return { error: null };
}
