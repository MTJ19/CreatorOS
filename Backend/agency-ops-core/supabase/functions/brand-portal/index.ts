// POST /brand-portal/generate-link   — agency generates a magic link for a contract
// GET  /brand-portal/:token          — brand views contract + deliverable (token-scoped, no login)
// POST /brand-portal/:token/approve  — brand approves the current deliverable
//
// Brands never get a Supabase auth session. Access control here is entirely
// "does this opaque token exist, match, and is unexpired" — checked in the
// service-role client, not via RLS.

import { getServiceClient, json, handleOptions } from "../_shared/client.ts";
import { logActivity } from "../_shared/activityLog.ts";

const LINK_TTL_DAYS = 30;

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const supabase = getServiceClient();
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ['brand-portal', 'generate-link' | ':token', 'approve'?]

  try {
    // ---- POST /brand-portal/generate-link ----
    if (req.method === "POST" && parts[1] === "generate-link") {
      const body = await req.json();
      const { contract_id } = body;
      if (!contract_id) return json({ error: "contract_id is required" }, 400);

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("id, agency_id, brand_id")
        .eq("id", contract_id)
        .single();
      if (contractError) return json({ error: "Contract not found" }, 404);

      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data: link, error } = await supabase
        .from("brand_portal_links")
        .insert({
          contract_id,
          brand_id: contract.brand_id,
          token,
          expires_at: expiresAt,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);

      await logActivity(supabase, {
        entityType: "contract",
        entityId: contract_id,
        agencyId: contract.agency_id,
        actorRole: "agency",
        action: "brand_portal.link_generated",
      });

      // Frontend teammate builds the actual URL from this token, e.g.
      // `${BRAND_PORTAL_BASE_URL}/${token}`
      return json({ token: link.token, expires_at: link.expires_at }, 201);
    }

    // Everything below requires a valid, unexpired token as parts[1]
    const token = parts[1];
    if (!token) return json({ error: "Not found" }, 404);

    const { data: link, error: linkError } = await supabase
      .from("brand_portal_links")
      .select("*, contracts(id, agency_id, status, doc_url, deliverables(*))")
      .eq("token", token)
      .single();

    if (linkError) return json({ error: "Invalid link" }, 404);
    if (new Date(link.expires_at) < new Date()) {
      return json({ error: "This link has expired" }, 410);
    }

    // ---- GET /brand-portal/:token ----
    if (req.method === "GET" && parts.length === 2) {
      await supabase
        .from("brand_portal_links")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", link.id);

      return json({
        contract: {
          status: link.contracts.status,
          doc_url: link.contracts.doc_url,
        },
        deliverables: link.contracts.deliverables,
      });
    }

    // ---- POST /brand-portal/:token/approve ----
    if (req.method === "POST" && parts.length === 3 && parts[2] === "approve") {
      const body = await req.json();
      const { deliverable_id } = body;
      if (!deliverable_id) return json({ error: "deliverable_id is required" }, 400);

      const { data: updated, error } = await supabase
        .from("deliverables")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", deliverable_id)
        .eq("contract_id", link.contracts.id) // guard: only within this token's contract
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);

      await logActivity(supabase, {
        entityType: "deliverable",
        entityId: deliverable_id,
        agencyId: link.contracts.agency_id,
        actorRole: "brand",
        action: "deliverable.approved",
      });

      return json({ deliverable: updated });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
