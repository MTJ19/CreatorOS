import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define multipliers and adjustments (these could be fetched from the DB in Phase 2)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOLLOWER_TIER_MULTIPLIERS: Record<string, number> = {
  nano: 100,
  micro: 300,
  mid: 800,
  macro: 2000,
  mega: 5000,
};

const ENGAGEMENT_RATE_ADJUSTMENTS: Record<string, number> = {
  low: -100, // < 2%
  average: 0, // 2-5%
  high: 200, // 5-10%
  viral: 500, // > 10%
};

const NICHE_CPMS: Record<string, number> = {
  finance: 25.0,
  tech: 20.0,
  beauty: 15.0,
  fitness: 12.0,
  lifestyle: 10.0,
  gaming: 14.0,
  default: 10.0,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { viewsPerWeek, niche, followerTier, engagementRateTier } = await req.json();

    if (!viewsPerWeek || !niche || !followerTier || !engagementRateTier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: viewsPerWeek, niche, followerTier, engagementRateTier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine CPM based on niche (default to 10 if not found)
    const cpm = NICHE_CPMS[niche.toLowerCase()] || NICHE_CPMS.default;

    // Determine follower tier multiplier (default to 0 if not found)
    const followerMultiplier = FOLLOWER_TIER_MULTIPLIERS[followerTier.toLowerCase()] || 0;

    // Determine engagement rate adjustment (default to 0 if not found)
    const engagementAdjustment = ENGAGEMENT_RATE_ADJUSTMENTS[engagementRateTier.toLowerCase()] || 0;

    // Calculate base rate: (views / 1000 * cpm) + followerMultiplier + engagementAdjustment
    const viewsValue = (viewsPerWeek / 1000) * cpm;
    let baseRate = viewsValue + followerMultiplier + engagementAdjustment;

    // Ensure base rate is never negative
    if (baseRate < 0) {
      baseRate = 0;
    }

    // Calculate range
    const suggestedRateLow = baseRate * 0.85;
    const suggestedRateHigh = baseRate * 1.35;

    return new Response(
      JSON.stringify({
        cpmUsed: cpm,
        viewsValue: parseFloat(viewsValue.toFixed(2)),
        followerMultiplier,
        engagementAdjustment,
        baseRate: parseFloat(baseRate.toFixed(2)),
        suggestedRateLow: parseFloat(suggestedRateLow.toFixed(2)),
        suggestedRateHigh: parseFloat(suggestedRateHigh.toFixed(2)),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error in rate calculator";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

