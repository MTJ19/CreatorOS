// POST /contracts                        — draft a contract from an agreed deal
// POST /contracts/:id/send-for-signature — send the drafted doc to the e-sign provider
// GET  /contracts/:id                    — fetch a contract

import { getServiceClient, json, handleOptions } from "../_shared/client.ts";
import { logActivity } from "../_shared/activityLog.ts";
import { getEsignProvider } from "../_shared/esignProvider.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const supabase = getServiceClient();
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ['contracts', ':id'?, 'send-for-signature'?]

  try {
    // ---- POST /contracts — draft a contract from an agreed deal ----
    if (req.method === "POST" && parts.length === 1) {
      const body = await req.json();
      const { deal_id, doc_url } = body;

      if (!deal_id) return json({ error: "deal_id is required" }, 400);

      // Pull the deal to confirm it's actually agreed, and to copy over
      // creator/brand/agency references. This is the hand-off point from
      // the Negotiation Dashboard module into Agency Ops Core.
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("id, agency_id, creator_id, brand_id, status, agreed_terms")
        .eq("id", deal_id)
        .single();

      if (dealError) return json({ error: "Deal not found" }, 404);
      if (deal.status !== "agreed") {
        return json({ error: "Deal terms must be agreed before drafting a contract" }, 409);
      }

      const { data: contract, error } = await supabase
        .from("contracts")
        .insert({
          deal_id: deal.id,
          creator_id: deal.creator_id,
          brand_id: deal.brand_id,
          agency_id: deal.agency_id,
          doc_url: doc_url ?? null,
          status: "drafted",
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);

      await logActivity(supabase, {
        entityType: "contract",
        entityId: contract.id,
        agencyId: deal.agency_id,
        actorRole: "agency",
        action: "contract.drafted",
        metadata: { deal_id },
      });

      return json({ contract }, 201);
    }

    // ---- POST /contracts/:id/send-for-signature ----
    if (req.method === "POST" && parts.length === 3 && parts[2] === "send-for-signature") {
      const contractId = parts[1];

      const { data: contract, error: fetchError } = await supabase
        .from("contracts")
        .select("*, creators(name, email)")
        .eq("id", contractId)
        .single();

      if (fetchError) return json({ error: "Contract not found" }, 404);
      if (!contract.doc_url) {
        return json({ error: "Contract has no doc_url — upload the drafted document first" }, 400);
      }

      const provider = getEsignProvider();
      const envelope = await provider.createEnvelope({
        docUrl: contract.doc_url,
        signerEmail: contract.creators.email,
        signerName: contract.creators.name,
      });

      const { data: updated, error: updateError } = await supabase
        .from("contracts")
        .update({
          status: "sent_for_signature",
          esign_provider: Deno.env.get("ESIGN_PROVIDER") ?? "stub",
          esign_envelope_id: envelope.envelopeId,
          esign_status: "sent",
        })
        .eq("id", contractId)
        .select()
        .single();

      if (updateError) return json({ error: updateError.message }, 400);

      await logActivity(supabase, {
        entityType: "contract",
        entityId: contractId,
        agencyId: contract.agency_id,
        actorRole: "agency",
        action: "contract.sent_for_signature",
        metadata: { envelope_id: envelope.envelopeId },
      });

      return json({ contract: updated, signing_url: envelope.signingUrl });
    }

    // ---- GET /contracts/:id ----
    if (req.method === "GET" && parts.length === 2) {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", parts[1])
        .single();

      if (error) return json({ error: error.message }, 404);
      return json({ contract: data });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
