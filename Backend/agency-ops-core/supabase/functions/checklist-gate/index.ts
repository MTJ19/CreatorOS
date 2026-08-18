import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const { usage_rights_duration, exclusivity_scope, revision_limit, payment_timeline } = payload;

    const missingFields: string[] = [];

    if (!usage_rights_duration || usage_rights_duration.toString().trim() === "") {
      missingFields.push("usage_rights_duration");
    }
    
    if (!exclusivity_scope || exclusivity_scope.toString().trim() === "") {
      missingFields.push("exclusivity_scope");
    }
    
    // revision_limit can be 0, so we check for undefined or null explicitly
    if (revision_limit === undefined || revision_limit === null || revision_limit === "") {
      missingFields.push("revision_limit");
    }
    
    if (!payment_timeline || payment_timeline.toString().trim() === "") {
      missingFields.push("payment_timeline");
    }

    const canSendCounter = missingFields.length === 0;

    return new Response(
      JSON.stringify({
        canSendCounter,
        missingFields,
        message: canSendCounter 
          ? "Checklist cleared. Ready to send counter-offer." 
          : "Pre-send checklist gate failed. Please fill all required fields.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
