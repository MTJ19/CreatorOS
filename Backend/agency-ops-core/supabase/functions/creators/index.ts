// POST /creators          — create a creator profile (onboarding)
// GET  /creators/:id      — fetch a creator profile

import { getServiceClient, json, handleOptions } from "../_shared/client.ts";
import { logActivity } from "../_shared/activityLog.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const supabase = getServiceClient();
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ['creators', ':id'?]

  try {
    if (req.method === "POST" && parts.length === 1) {
      const body = await req.json();
      const { agency_id, name, email, niche, follower_tier, connected_accounts } = body;

      if (!agency_id || !name || !email) {
        return json({ error: "agency_id, name, and email are required" }, 400);
      }

      const { data, error } = await supabase
        .from("creators")
        .insert({
          agency_id,
          name,
          email,
          niche: niche ?? null,
          follower_tier: follower_tier ?? null,
          connected_accounts: connected_accounts ?? [],
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);

      await logActivity(supabase, {
        entityType: "creator",
        entityId: data.id,
        agencyId: agency_id,
        actorRole: "agency",
        action: "creator.onboarded",
        metadata: { name },
      });

      return json({ creator: data }, 201);
    }

    if (req.method === "GET" && parts.length === 2) {
      const id = parts[1];
      const { data, error } = await supabase
        .from("creators")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return json({ error: error.message }, 404);
      return json({ creator: data });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
