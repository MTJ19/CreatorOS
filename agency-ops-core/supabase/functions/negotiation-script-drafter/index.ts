// Phase 1 — Deterministic Negotiation Script Drafter (No AI required)
// Generates ready-to-send counter-offer scripts for lowball offers,
// "exposure instead of pay" pitches, and scope creep requests.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateTemplateScript(
  scenario: string,
  brandName: string,
  creatorNiche: string,
  initialOffer: number,
  desiredRate: number,
  tone: string
): string {
  const brand = brandName || "Brand Partner";

  if (scenario === "exposure") {
    return `Hi ${brand} Team,\n\nThank you for reaching out with this exciting campaign opportunity! I really appreciate your enthusiasm for my content in the ${creatorNiche || "creator"} space.\n\nWhile I love your brand and mission, I don't accept unpaid or gifting-only collaborations for dedicated production deliverables. My standard rate for a dedicated integration with guaranteed audience engagement and exclusivity is $${desiredRate.toLocaleString()}.\n\nI'd love to partner with you if we can make the budget work. Let me know if we can proceed with this structure!\n\nBest regards,\n[Your Name]`;
  }

  if (scenario === "scope_creep") {
    return `Hi ${brand} Team,\n\nThanks for sharing the expanded deliverable scope and usage rights requirements. Based on the additional whitelisting rights and extra short-form cutdowns requested beyond our initial scope, my revised rate for this package is $${desiredRate.toLocaleString()} (adjusted from the baseline $${initialOffer.toLocaleString()}).\n\nThis ensures full commercial licensing, 2 rounds of creative revisions, and dedicated analytics reporting.\n\nLooking forward to finalizing the terms!\n\nBest regards,\n[Your Name]`;
  }

  // Standard / Lowball Counter-Offer
  if (tone.includes("friendly")) {
    return `Hi ${brand} Team,\n\nThank you so much for the offer of $${initialOffer.toLocaleString()}! I am really excited about collaborating on this campaign.\n\nLooking at the deliverables, production time, and the high engagement metrics from my ${creatorNiche || "audience"} community, my standard ask for this scope is $${desiredRate.toLocaleString()}.\n\nGiven how well our audiences align, I'm confident we will drive exceptional results and ROI for ${brand}. Let me know if this works on your end so we can lock in the production dates!\n\nWarmly,\n[Your Name]`;
  }

  if (tone.includes("data")) {
    return `Hi ${brand} Team,\n\nThank you for the proposal. Based on our average benchmark of 500k+ weekly impressions, 6.2% engagement rate, and verified conversions in the ${creatorNiche || "industry"} sector, the market CPM valuation for this placement is $${desiredRate.toLocaleString()}.\n\nOur historical campaign data indicates strong click-through and retention for partners in your category. We can confirm this deliverable schedule at $${desiredRate.toLocaleString()} with Net 30 terms and 6 months digital usage rights.\n\nPlease find our media kit attached and let us know how you'd like to proceed.\n\nBest regards,\nTalent Management`;
  }

  // Professional / Firm Default
  return `Dear ${brand} Team,\n\nThank you for reaching out and extending an initial offer of $${initialOffer.toLocaleString()}.\n\nAfter reviewing the required deliverables, creative scope, and licensing terms, our counter-offer for this partnership is $${desiredRate.toLocaleString()}. This rate covers full content production, 30-day category exclusivity, and standard revision rounds.\n\nWe value working with ${brand} and look forward to delivering high-impact results for your campaign.\n\nPlease let us know if we can prepare the agreement accordingly.\n\nBest regards,\n[Your Name / Talent Manager]`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      brandName, 
      creatorNiche, 
      initialOffer, 
      desiredRate, 
      tone = "polite but firm",
      scenario = "counter" 
    } = await req.json();

    // Validate inputs
    if (!brandName || initialOffer === undefined || desiredRate === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: brandName, initialOffer, or desiredRate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const script = generateTemplateScript(
      scenario,
      brandName,
      creatorNiche,
      Number(initialOffer),
      Number(desiredRate),
      tone
    );

    return new Response(
      JSON.stringify({ script, source: "deterministic_template" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error drafting negotiation script";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
