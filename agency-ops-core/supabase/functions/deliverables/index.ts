// POST  /deliverables            — create a deliverable slot for a signed contract
// PATCH /deliverables/:id/status — update status (submitted, approved, changes_requested, rejected)
// GET   /deliverables/:id        — fetch a deliverable

import { getServiceClient, json, handleOptions } from "../_shared/client.ts";
import { logActivity } from "../_shared/activityLog.ts";

const VALID_STATUSES = ["pending", "submitted", "changes_requested", "approved", "rejected"];

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const supabase = getServiceClient();
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ['deliverables', ':id'?, 'status'?]

  try {
    // ---- POST /deliverables ----
    if (req.method === "POST" && parts.length === 1) {
      const body = await req.json();
      const { contract_id } = body;
      if (!contract_id) return json({ error: "contract_id is required" }, 400);

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("id, agency_id, status")
        .eq("id", contract_id)
        .single();
      if (contractError) return json({ error: "Contract not found" }, 404);
      if (contract.status !== "signed") {
        return json({ error: "Contract must be signed before creating a deliverable" }, 409);
      }

      const { data, error } = await supabase
        .from("deliverables")
        .insert({ contract_id, status: "pending" })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);

      await logActivity(supabase, {
        entityType: "deliverable",
        entityId: data.id,
        agencyId: contract.agency_id,
        actorRole: "agency",
        action: "deliverable.created",
        metadata: { contract_id },
      });

      return json({ deliverable: data }, 201);
    }

    // ---- PATCH /deliverables/:id/status ----
    if (req.method === "PATCH" && parts.length === 3 && parts[2] === "status") {
      const id = parts[1];
      const body = await req.json();
      const { status, actor_role, notes } = body;

      if (!VALID_STATUSES.includes(status)) {
        return json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` }, 400);
      }
      if (!["agency", "creator", "brand", "system"].includes(actor_role)) {
        return json({ error: "actor_role is required" }, 400);
      }

      const { data: existing, error: fetchError } = await supabase
        .from("deliverables")
        .select("id, contract_id, contracts(agency_id)")
        .eq("id", id)
        .single();
      if (fetchError) return json({ error: "Deliverable not found" }, 404);

      const patch: Record<string, unknown> = { status, notes: notes ?? null };
      if (status === "submitted") patch.submitted_at = new Date().toISOString();
      if (status === "approved") patch.approved_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from("deliverables")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);

      // deliverables.contracts comes back as an array or object depending on
      // the client version — normalize defensively.
      const rawContracts = (existing as Record<string, unknown>).contracts;
      const agencyId = (Array.isArray(rawContracts)
        ? (rawContracts[0] as { agency_id?: string })?.agency_id
        : (rawContracts as { agency_id?: string })?.agency_id) ?? "";


      await logActivity(supabase, {
        entityType: "deliverable",
        entityId: id,
        agencyId,
        actorRole: actor_role,
        action: `deliverable.${status}`,
        metadata: { notes },
      });

      return json({ deliverable: updated });
    }

    // ---- GET /deliverables/:id ----
    if (req.method === "GET" && parts.length === 2) {
      const { data, error } = await supabase
        .from("deliverables")
        .select("*")
        .eq("id", parts[1])
        .single();
      if (error) return json({ error: error.message }, 404);
      return json({ deliverable: data });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
