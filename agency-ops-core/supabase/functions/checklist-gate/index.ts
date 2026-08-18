import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { usage_rights_duration, exclusivity_scope, revision_limit, payment_timeline } = payload;

    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!usage_rights_duration || usage_rights_duration.toString().trim() === "") {
      missingFields.push("usage_rights_duration");
    } else if (usage_rights_duration.toString().toLowerCase().includes("perpetuity")) {
      warnings.push("Perpetual usage rights detected. Requires Legal & Compliance lead approval.");
    }
    
    if (!exclusivity_scope || exclusivity_scope.toString().trim() === "") {
      missingFields.push("exclusivity_scope");
    } else if (exclusivity_scope.toString().toLowerCase().includes("total")) {
      warnings.push("Total category exclusivity limits future brand opportunities.");
    }
    
    // revision_limit can be 0, so we check for undefined or null explicitly
    if (revision_limit === undefined || revision_limit === null || revision_limit === "") {
      missingFields.push("revision_limit");
    } else if (Number(revision_limit) > 3) {
      warnings.push("High revision limit (>3) increases scope creep risk.");
    }
    
    if (!payment_timeline || payment_timeline.toString().trim() === "") {
      missingFields.push("payment_timeline");
    } else if (payment_timeline.toString().toLowerCase().includes("90")) {
      warnings.push("Net 90 payment timeline poses significant cashflow delay.");
    }

    const canSendCounter = missingFields.length === 0;

    return new Response(
      JSON.stringify({
        canSendCounter,
        missingFields,
        warnings,
        message: canSendCounter 
          ? "Checklist cleared. Ready to send counter-offer." 
          : "Pre-send checklist gate failed. Please fill all required fields.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error in checklist gate";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

