// POST /webhooks-esign
// Receives status callbacks from the e-sign provider once one is selected.
// Payload shape below is a generic placeholder — replace the parsing with
// the real provider's webhook schema when it's chosen, but keep the same
// end result: update contracts.esign_status/status + log activity.

import { getServiceClient, json, handleOptions } from "../_shared/client.ts";
import { logActivity } from "../_shared/activityLog.ts";

interface GenericEsignWebhookPayload {
  envelope_id: string;
  status: "sent" | "viewed" | "signed" | "declined" | "voided";
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = getServiceClient();

  try {
    // TODO: verify webhook signature/secret here once provider is chosen —
    // do not trust this payload as-is in production.
    const payload: GenericEsignWebhookPayload = await req.json();

    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("id, agency_id, status")
      .eq("esign_envelope_id", payload.envelope_id)
      .single();

    if (fetchError) return json({ error: "No contract matches this envelope_id" }, 404);

    const newStatus = payload.status === "signed" ? "signed" : contract.status;

    const { error: updateError } = await supabase
      .from("contracts")
      .update({ esign_status: payload.status, status: newStatus })
      .eq("id", contract.id);

    if (updateError) return json({ error: updateError.message }, 400);

    await logActivity(supabase, {
      entityType: "contract",
      entityId: contract.id,
      agencyId: contract.agency_id,
      actorRole: "system",
      action: `contract.esign_${payload.status}`,
      metadata: { envelope_id: payload.envelope_id },
    });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
